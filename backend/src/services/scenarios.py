"""
Derive pessimistic / neutral / optimistic scenario variants from a base series.
"""


def make_scenarios(
    base_series: list[float], delta: float = 0.15
) -> dict[str, list[float]]:
    """
    Scale a base monthly series by ±delta to produce three scenarios.

    Args:
        base_series: 12-element list (e.g. sun-hours or kWh values).
        delta:       Fractional spread, default 15 %.

    Returns:
        Dict with keys 'pessimistic', 'neutral', 'optimistic'.
        Pessimistic values are clamped to >= 0.
    """
    return {
        "pessimistic": [max(0.0, round(v * (1 - delta), 4)) for v in base_series],
        "neutral":     [round(v, 4) for v in base_series],
        "optimistic":  [round(v * (1 + delta), 4) for v in base_series],
    }
