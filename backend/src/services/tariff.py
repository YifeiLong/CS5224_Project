"""
Electricity tariff service.

MVP: returns a flat constant rate for all 12 months.
Future: fetch live quarterly rates from SP Group and return a variable series.
"""

from ..config import DEFAULT_TARIFF_SGD_PER_KWH


def get_tariff_series(override: float | None = None) -> list[float]:
    """
    Return a 12-month electricity tariff series (SGD/kWh).

    Args:
        override: If provided, use this constant rate instead of the default.

    Returns:
        12-element list where every value equals the resolved tariff.
    """
    rate = override if override is not None else DEFAULT_TARIFF_SGD_PER_KWH
    return [round(rate, 4)] * 12
