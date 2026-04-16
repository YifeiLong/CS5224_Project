"""
llm_service.py

Local LLM service for the advisory module.

Main job of this file:
- Load a small local model from disk
- Turn forecast results into a compact prompt
- Generate a short advisory answer for the user

This file is intentionally kept separate from the FastAPI route layer.
That makes the API code cleaner and also makes it easier to swap models later.

Current plan:
- Default model: DeepSeek-R1-Distill-Qwen-1.5B
- Default usage: load from a local folder downloaded by download_model.py

Important note:
This is an MVP for our course project. The goal is not to build the most
powerful chat system. The goal is to produce a practical advisory response
based on our forecast output.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from threading import Lock
from typing import Any, Dict, Literal, Optional

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


RunMode = Literal["mock", "local"]
Language = Literal["en", "zh"]


DEFAULT_MODEL_PATH = os.getenv(
    "LOCAL_LLM_MODEL_PATH",
    "./models/deepseek-r1-distill-qwen-1.5b",
)

DEFAULT_MAX_NEW_TOKENS = 220
DEFAULT_TEMPERATURE = 0.3
DEFAULT_TOP_P = 0.9

SYSTEM_PROMPT = """You are the advisory assistant for SolarYield AI, a rooftop solar decision-support tool for Singapore.

Your task:
- Help users interpret forecast results from the SolarYield AI backend
- Explain PV generation, payback, ROI, and forecast assumptions in clear and practical language
- Support decision-making, but do not present the result as a guarantee

Important behavior:
- Use only the information provided in the forecast summary
- Do not invent numbers, causes, or external facts
- Treat all outputs as estimates based on assumptions
- Do not give legal, engineering, or financial advice

How to answer:
1. Start with a short direct answer to the user's question
2. Use the neutral scenario as the main reference
3. If relevant, mention key numbers such as annual generation, payback, ROI, or installation cost
4. Explain uncertainty by comparing pessimistic and optimistic scenarios
5. If available, you may briefly mention:
   - nearest weather station information
   - tariff variation over time
   - rainy-day or historical weather context
6. Keep the response concise, practical, and cautious

Style:
- Clear, calm, and trustworthy
- Helpful but not overconfident
- Avoid sounding overly technical
- Avoid sounding like a chatbot or giving a long essay

Goal:
Give a useful explanation that feels grounded in the forecast result and helps the user make sense of it.
"""


@dataclass
class AdvisoryGenerationResult:
    """Standard internal output format returned by the service."""
    answer: str
    disclaimer: str
    used_model: str
    run_mode: str
    status: str = "success"


def _safe_get(d: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    """
    Read nested dictionary values safely.

    Example:
        _safe_get(data, "roi", "payback_years", "neutral")
    """
    cur: Any = d
    for key in keys:
        if not isinstance(cur, dict) or key not in cur:
            return default
        cur = cur[key]
    return cur


def _format_percent(value: Optional[float]) -> Optional[str]:
    """Convert 0.18 -> '18.0%'."""
    if value is None:
        return None
    return f"{value * 100:.1f}%"


def _format_number(value: Optional[float], digits: int = 2) -> str:
    """Format numeric values consistently for prompt and mock text."""
    if value is None:
        return "N/A"
    return f"{value:,.{digits}f}"


def summarize_forecast_result(forecast_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract the most useful fields from /forecast output.

    We do not want to pass the whole raw JSON blindly into a small model.
    A short, stable summary is usually easier for a 1.5B model to handle.

    Expected forecast_result structure comes from the current backend:
    - location
    - inputs_used
    - historical_averages
    - weather_scenarios
    - rainy_days
    - pv_kwh
    - tariff_series
    - roi
    - cashflow_cumulative_sgd
    """
    roof_area = _safe_get(forecast_result, "inputs_used", "roof_area_m2")
    system_size = _safe_get(forecast_result, "inputs_used", "system_size_kwp")
    capex = _safe_get(forecast_result, "roi", "capex_sgd")
    tariff = _safe_get(forecast_result, "inputs_used", "tariff_sgd_per_kwh")
    postal_code = _safe_get(forecast_result, "location", "postal_code")

    pv_neutral = _safe_get(forecast_result, "pv_kwh", "neutral", default=[]) or []
    annual_generation_neutral = round(sum(pv_neutral), 2) if pv_neutral else None

    payback_pess = _safe_get(forecast_result, "roi", "payback_years", "pessimistic")
    payback_neu = _safe_get(forecast_result, "roi", "payback_years", "neutral")
    payback_opt = _safe_get(forecast_result, "roi", "payback_years", "optimistic")

    roi_pess = _safe_get(forecast_result, "roi", "roi_10y", "pessimistic")
    roi_neu = _safe_get(forecast_result, "roi", "roi_10y", "neutral")
    roi_opt = _safe_get(forecast_result, "roi", "roi_10y", "optimistic")

    cashflow_neutral = _safe_get(
        forecast_result, "cashflow_cumulative_sgd", "neutral", default=[]
    ) or []
    final_cumulative_neutral = (
        round(cashflow_neutral[-1], 2) if cashflow_neutral else None
    )

    nearest_station = _safe_get(forecast_result, "location", "nearest_station")
    station_distance_km = _safe_get(forecast_result, "location", "station_distance_km")

    tariff_series = _safe_get(forecast_result, "tariff_series", default=[]) or []
    avg_tariff = round(sum(tariff_series) / len(tariff_series), 4) if tariff_series else None
    tariff_min = round(min(tariff_series), 4) if tariff_series else None
    tariff_max = round(max(tariff_series), 4) if tariff_series else None

    rainy_days = _safe_get(forecast_result, "rainy_days", default=[]) or []
    avg_rainy_days = round(sum(rainy_days) / len(rainy_days), 2) if rainy_days else None

    historical = _safe_get(forecast_result, "historical_averages", default={}) or {}
    weather_scenarios = _safe_get(forecast_result, "weather_scenarios", default={}) or {}

    # summary = {
    #     "postal_code": postal_code,
    #     "roof_area_m2": roof_area,
    #     "system_size_kwp": system_size,
    #     "capex_sgd": capex,
    #     "tariff_sgd_per_kwh": tariff,
    #     "annual_generation_kwh_neutral": annual_generation_neutral,
    #     "payback_years": {
    #         "pessimistic": payback_pess,
    #         "neutral": payback_neu,
    #         "optimistic": payback_opt,
    #     },
    #     "roi_10y": {
    #         "pessimistic": roi_pess,
    #         "neutral": roi_neu,
    #         "optimistic": roi_opt,
    #     },
    #     "final_cumulative_sgd_neutral": final_cumulative_neutral,
    # }

    summary = {
        "postal_code": postal_code,
        "nearest_station": nearest_station,
        "station_distance_km": station_distance_km,
        "roof_area_m2": roof_area,
        "system_size_kwp": system_size,
        "capex_sgd": capex,

        "tariff_sgd_per_kwh": tariff,
        "avg_tariff_sgd_per_kwh": avg_tariff,
        "tariff_range_sgd_per_kwh": {
            "min": tariff_min,
            "max": tariff_max,
        },

        "annual_generation_kwh_neutral": annual_generation_neutral,

        "payback_years": {
            "pessimistic": payback_pess,
            "neutral": payback_neu,
            "optimistic": payback_opt,
        },
        "roi_10y": {
            "pessimistic": roi_pess,
            "neutral": roi_neu,
            "optimistic": roi_opt,
        },

        "final_cumulative_sgd_neutral": final_cumulative_neutral,

        "avg_rainy_days_per_month": avg_rainy_days,
        "historical_averages": historical,
        "weather_scenarios_sample": {
            "pessimistic_first_3": weather_scenarios.get("pessimistic", [])[:3],
            "neutral_first_3": weather_scenarios.get("neutral", [])[:3],
            "optimistic_first_3": weather_scenarios.get("optimistic", [])[:3],
        },
    }

    return summary


def has_high_uncertainty(summary: Dict[str, Any]) -> bool:
    """
    Simple uncertainty flag based on scenario spread.

    Current rule:
    - payback gap >= 1.0 year, or
    - 10-year ROI gap >= 0.10
    """
    payback = summary.get("payback_years", {})
    roi = summary.get("roi_10y", {})

    p_pay = payback.get("pessimistic")
    o_pay = payback.get("optimistic")
    if p_pay is not None and o_pay is not None and abs(p_pay - o_pay) >= 1.0:
        return True

    p_roi = roi.get("pessimistic")
    o_roi = roi.get("optimistic")
    if p_roi is not None and o_roi is not None and abs(p_roi - o_roi) >= 0.10:
        return True

    return False


def build_user_prompt(
    user_question: str,
    forecast_result: Dict[str, Any],
    language: Language = "en",
) -> str:
    """
    Build a compact prompt for the local model.

    We pass a summarized version of the forecast result instead of every field.
    This usually works better for a smaller local model.
    """
    summary = summarize_forecast_result(forecast_result)
    language_instruction = (
        "Please answer in clear Chinese."
        if language == "zh"
        else "Please answer in clear English."
    )

    prompt = f"""User question:
{user_question}

Forecast summary:
{json.dumps(summary, ensure_ascii=False, indent=2)}

Rules:
- Use the forecast summary only
- Do not invent missing numbers
- Use the neutral scenario as the main reference
- Compare pessimistic and optimistic scenarios when explaining uncertainty
- If weather station information is provided, briefly mention that the estimate is based on the nearest station
- If tariff range is provided, mention that electricity price assumptions may vary over time
- If historical averages are provided, you may briefly mention that the forecast is grounded in historical weather patterns, but future outcomes can still differ
- Keep the answer concise, practical, and cautious

Additional requirement:
{language_instruction}
"""
    return prompt.strip()


def generate_disclaimer(language: Language = "en") -> str:
    """Return a short fixed disclaimer."""
    if language == "zh":
        return "本回答仅用于结果解释与辅助决策，不构成专业财务、法律或工程建议。"
    return (
        "This response is for result interpretation and decision support only. "
        "It is not professional financial, legal, or engineering advice."
    )


def generate_mock_answer(
    user_question: str,
    forecast_result: Dict[str, Any],
    language: Language = "en",
) -> str:
    """
    Lightweight fallback answer generator.

    This is useful for early testing even if the local model has not been
    downloaded yet. It also gives us a backup path for debugging.
    """
    q = (user_question or "").lower()
    summary = summarize_forecast_result(forecast_result)

    nearest_station = summary.get("nearest_station")
    station_distance_km = summary.get("station_distance_km")
    avg_tariff = summary.get("avg_tariff_sgd_per_kwh")
    tariff_range = summary.get("tariff_range_sgd_per_kwh", {})
    avg_rainy_days = summary.get("avg_rainy_days_per_month")

    historical = summary.get("historical_averages", {})
    has_historical = bool(historical)

    annual_gen = summary.get("annual_generation_kwh_neutral")
    payback_neutral = _safe_get(summary, "payback_years", "neutral")
    roi_neutral = _safe_get(summary, "roi_10y", "neutral")
    roof_area = summary.get("roof_area_m2")
    system_size = summary.get("system_size_kwp")
    capex = summary.get("capex_sgd")
    high_uncertainty = has_high_uncertainty(summary)

    roi_text = _format_percent(roi_neutral) if roi_neutral is not None else None


    if language == "zh":
        direct = "根据目前的 forecast 结果，"
        details = []

        if "回本" in user_question or "payback" in q:
            if payback_neutral is not None:
                if payback_neutral <= 5:
                    direct += f"中性情景下约 {payback_neutral:.2f} 年回本，整体上算比较合理。"
                else:
                    direct += f"中性情景下约 {payback_neutral:.2f} 年回本，节奏相对偏慢一些。"
            else:
                direct += "目前还不能准确判断回本周期，因为相关字段缺失。"
        elif "roi" in q:
            if roi_text:
                direct += f"中性情景下 10 年 ROI 约为 {roi_text}，说明这个项目有一定回报潜力。"
            else:
                direct += "目前还不能准确解释 ROI，因为相关字段缺失。"
        elif "值得" in user_question or "install" in q or "solar" in q:
            direct += "这个项目值得进一步考虑，但不建议把它理解为一个无风险决定。"
        else:
            direct += "这个结果更适合作为辅助决策参考，而不是精确承诺。"

        if annual_gen is not None:
            details.append(f"中性情景下预计年发电量约为 {_format_number(annual_gen, 2)} kWh。")
        if roof_area is not None and system_size is not None:
            details.append(
                f"这个估计基于屋顶面积约 {_format_number(roof_area, 1)} m²、系统容量约 {_format_number(system_size, 2)} kWp。"
            )
        if capex is not None:
            details.append(f"当前假设的初始安装成本约为 SGD {_format_number(capex, 2)}。")
        if roi_text and "roi" not in q:
            details.append(f"中性情景下 10 年 ROI 约为 {roi_text}。")

        if nearest_station:
            if station_distance_km is not None:
                details.append(
                    f"该估计参考了最近的气象站 {nearest_station}，距离约 {_format_number(station_distance_km, 2)} km。"
                )
            else:
                details.append(
                    f"该估计参考了最近的气象站 {nearest_station}。"
                )

        if avg_tariff is not None:
            details.append(
                f"预测期内假设电价平均约为 {_format_number(avg_tariff, 4)} SGD/kWh。"
            )

        if tariff_range.get("min") is not None and tariff_range.get("max") is not None:
            details.append(
                f"电价大致在 {_format_number(tariff_range['min'], 4)} 到 {_format_number(tariff_range['max'], 4)} SGD/kWh 之间波动。"
            )

        if avg_rainy_days is not None:
            details.append(
                f"平均每月约 {_format_number(avg_rainy_days, 1)} 天为雨天。"
            )

        if has_historical:
            details.append(
                "该预测也参考了历史天气平均情况，因此整体估计会更有现实依据，但未来结果仍可能有所偏差。"
            )

        uncertainty = (
            "三种情景之间差异相对较大，所以结果存在比较明显的不确定性。"
            if high_uncertainty
            else "结果仍会受到天气、用电量和成本假设的影响。"
        )

        answer = direct
        if details:
            answer += "\n\n" + "".join(details)
        answer += "\n\n不确定性说明：" + uncertainty
        return answer

    direct = "Based on the current forecast result, "
    details = []

    if "payback" in q:
        if payback_neutral is not None:
            if payback_neutral <= 5:
                direct += (
                    f"the neutral scenario payback of about {payback_neutral:.2f} years "
                    f"looks fairly reasonable."
                )
            else:
                direct += (
                    f"the neutral scenario payback of about {payback_neutral:.2f} years "
                    f"looks somewhat slow."
                )
        else:
            direct += "the payback period cannot be interpreted precisely because the field is missing."
    elif "roi" in q:
        if roi_text:
            direct += f"the neutral 10-year ROI of about {roi_text} suggests some return potential."
        else:
            direct += "the ROI cannot be interpreted precisely because the field is missing."
    elif "install" in q or "solar" in q or "worth" in q:
        direct += "the project looks worth considering, but not as a risk-free decision."
    else:
        direct += "the result is better understood as decision support rather than a guarantee."

    if annual_gen is not None:
        details.append(
            f"The neutral scenario annual generation is about {_format_number(annual_gen, 2)} kWh."
        )
    if roof_area is not None and system_size is not None:
        details.append(
            f"The estimate is based on about {_format_number(roof_area, 1)} m² of roof area "
            f"and {_format_number(system_size, 2)} kWp system size."
        )
    if capex is not None:
        details.append(f"The assumed upfront installation cost is around SGD {_format_number(capex, 2)}.")
    if roi_text and "roi" not in q:
        details.append(f"The neutral 10-year ROI is about {roi_text}.")

    if nearest_station:
        if station_distance_km is not None:
            details.append(
                f"The estimate is based on the nearest weather station ({nearest_station}), about {_format_number(station_distance_km, 2)} km away."
            )
        else:
            details.append(
                f"The estimate is based on the nearest weather station ({nearest_station})."
            )

    if avg_tariff is not None:
        details.append(
            f"The assumed electricity tariff averages about {_format_number(avg_tariff, 4)} SGD/kWh."
        )

    if tariff_range.get("min") is not None and tariff_range.get("max") is not None:
        details.append(
            f"The tariff assumption varies roughly from {_format_number(tariff_range['min'], 4)} to {_format_number(tariff_range['max'], 4)} SGD/kWh."
        )

    if avg_rainy_days is not None:
        details.append(
            f"The forecast context reflects about {_format_number(avg_rainy_days, 1)} rainy days per month on average."
        )

    if has_historical:
        details.append(
            "The estimate is also informed by historical weather patterns, which helps provide a more grounded baseline for the forecast."
        )

    uncertainty = (
        "The scenario spread is relatively large, so the estimate has noticeable uncertainty."
        if high_uncertainty
        else "The result still depends on weather, electricity usage, and cost assumptions."
    )

    answer = direct
    if details:
        answer += "\n\n" + " ".join(details)
    answer += "\n\nUncertainty note: " + uncertainty
    return answer


class LocalLLMService:
    """
    Small wrapper around a local Hugging Face causal LM.

    The model is loaded lazily:
    - service object can be created at import time
    - actual model load happens only when local generation is needed

    This keeps startup lighter, especially when the API is first deployed.
    """

    def __init__(
        self,
        model_path: str = DEFAULT_MODEL_PATH,
        device: Optional[str] = None,
    ) -> None:
        self.model_path = model_path
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self._tokenizer = None
        self._model = None
        self._load_lock = Lock()

    @property
    def tokenizer(self):
        """Tokenizer accessor with lazy loading."""
        self._ensure_loaded()
        return self._tokenizer

    @property
    def model(self):
        """Model accessor with lazy loading."""
        self._ensure_loaded()
        return self._model

    def _ensure_loaded(self) -> None:
        """
        Load tokenizer and model once.

        The lock avoids duplicate loads if two requests hit the service at the same time.
        """
        if self._tokenizer is not None and self._model is not None:
            return

        with self._load_lock:
            if self._tokenizer is not None and self._model is not None:
                return

            if not os.path.exists(self.model_path):
                raise FileNotFoundError(
                    f"Local model path not found: {self.model_path}. "
                    f"Run download_model.py first or set LOCAL_LLM_MODEL_PATH."
                )

            if self.device == "cpu":
                torch.set_num_threads(4)

            self._tokenizer = AutoTokenizer.from_pretrained(
                self.model_path,
                trust_remote_code=True,
            )

            self._model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.bfloat16,
                device_map="auto" if self.device == "cuda" else None,
            )

            if self.device != "cuda":
                self._model = self._model.to(self.device)

            self._model.eval()

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        max_new_tokens: int = DEFAULT_MAX_NEW_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE,
        top_p: float = DEFAULT_TOP_P,
    ) -> str:
        """
        Run local text generation.

        We format a plain prompt instead of relying on a chat server.
        This keeps the code simple and works for local inference.
        """
        prompt = (
            f"System:\n{system_prompt}\n\n"
            f"User:\n{user_prompt}\n\n"
            f"Assistant:\n"
        )

        inputs = self.tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=temperature > 0,
                temperature=temperature,
                top_p=top_p,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        generated_ids = output_ids[0][inputs["input_ids"].shape[1]:]
        text = self.tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        return text

    def generate_advisory(
        self,
        user_question: str,
        forecast_result: Dict[str, Any],
        language: Language = "en",
        run_mode: RunMode = "local",
        max_new_tokens: int = DEFAULT_MAX_NEW_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE,
        top_p: float = DEFAULT_TOP_P,
    ) -> AdvisoryGenerationResult:
        """
        Main entry used by the API layer.

        run_mode:
        - mock  -> no local model needed
        - local -> use downloaded model from disk
        """
        disclaimer = generate_disclaimer(language)

        if run_mode == "mock":
            answer = generate_mock_answer(user_question, forecast_result, language)
            return AdvisoryGenerationResult(
                answer=answer,
                disclaimer=disclaimer,
                used_model="mock-local-rule-based",
                run_mode="mock",
            )

        user_prompt = build_user_prompt(user_question, forecast_result, language)

        answer = self.generate_text(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
        )

        if not answer:
            answer = generate_mock_answer(user_question, forecast_result, language)

        return AdvisoryGenerationResult(
            answer=answer,
            disclaimer=disclaimer,
            used_model=self.model_path,
            run_mode="local",
        )


# Shared service instance.
# This is convenient for FastAPI usage because the route layer can import it directly.
llm_service = LocalLLMService()
