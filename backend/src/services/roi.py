"""
ROI and financial metrics for a rooftop PV installation.

Definitions
-----------
savings_kwh[m]  : kWh avoided from the grid each month
                  = min(pv_kwh[m], monthly_load_kwh)   if load is known
                  = pv_kwh[m] * SELF_CONSUMPTION_RATIO  otherwise
                  (no feed-in tariff / export revenue modelled in MVP)

savings_sgd[m]  : monthly_savings_kwh[m] * tariff[m]

cumulative_sgd  : running total of savings_sgd, offset by capex on day 0
                  cumulative_sgd[0] = savings_sgd[0] - capex

payback_month   : first 1-indexed month where cumulative_sgd >= 0, or None
payback_years   : payback_month / 12 (float) or None

roi_10y         : (Σ savings over 120 months with annual degradation - capex) / capex
                  degradation applied per full year: year k → factor (1-0.005)^k
"""

from typing import Optional

from ..config import DEGRADATION_RATE_PER_YEAR, SELF_CONSUMPTION_RATIO


def compute_roi(
    pv_kwh: list[float],
    tariff_series: list[float],
    capex_sgd: float,
    monthly_load_kwh: Optional[float] = None,
) -> dict:
    """
    Compute savings, cumulative cashflow, payback period, and 10-year ROI.

    Args:
        pv_kwh:           12-element monthly PV generation (kWh).
        tariff_series:    12-element monthly tariff (SGD/kWh).
        capex_sgd:        Total capital expenditure (SGD).
        monthly_load_kwh: Monthly consumption (kWh). None → use self-consumption ratio.

    Returns:
        Dict with keys: savings_kwh, savings_sgd, cumulative_sgd,
        payback_month, payback_years, roi_10y.
    """
    # Monthly savings in kWh
    if monthly_load_kwh is None:
        savings_kwh = [round(p * SELF_CONSUMPTION_RATIO, 2) for p in pv_kwh]
    else:
        savings_kwh = [round(min(p, monthly_load_kwh), 2) for p in pv_kwh]

    # Monthly savings in SGD
    savings_sgd = [
        round(kwh * t, 4) for kwh, t in zip(savings_kwh, tariff_series)
    ]

    # Cumulative cashflow (first 12 months for the chart): starts at -capex
    cumulative: list[float] = []
    running = -capex_sgd
    for s in savings_sgd:
        running = round(running + s, 4)
        cumulative.append(running)

    # 10-year ROI: extrapolate 12-month pattern × 10 years with degradation
    annual_savings = sum(savings_sgd)
    total_10y = sum(
        annual_savings * (1 - DEGRADATION_RATE_PER_YEAR) ** year
        for year in range(10)
    )
    roi_10y: Optional[float] = (
        round((total_10y - capex_sgd) / capex_sgd, 4) if capex_sgd > 0 else None
    )

    # Payback: project forward up to 30 years with degradation to find the break-even month
    payback_month: Optional[int] = None
    if annual_savings > 0:
        running_payback = -capex_sgd
        months_simulated = 0
        for year in range(30):
            degradation_factor = (1 - DEGRADATION_RATE_PER_YEAR) ** year
            for month_savings in savings_sgd:
                months_simulated += 1
                running_payback += month_savings * degradation_factor
                if running_payback >= 0 and payback_month is None:
                    payback_month = months_simulated
                    break
            if payback_month is not None:
                break

    payback_years: Optional[float] = (
        round(payback_month / 12, 1) if payback_month is not None else None
    )

    return {
        "savings_kwh": savings_kwh,
        "savings_sgd": savings_sgd,
        "cumulative_sgd": cumulative,
        "payback_month": payback_month,
        "payback_years": payback_years,
        "roi_10y": roi_10y,
    }
