"""
Simplified PV generation model.

Formula
-------
    pv_kwh[m] = sun_hours[m] × system_size_kwp × performance_ratio

Simplifying assumptions (document for end-users):
  - 'sun_hours' represents *effective* sun-hours (already reduced for diffuse
    radiation). No additional irradiance-to-energy conversion factor is applied.
  - Performance ratio (PR ≈ 0.80) bundles inverter efficiency, wiring losses,
    temperature derating, and mismatch losses into a single scalar.
  - No site-specific shading, soiling, or tilt/orientation correction.
  - Panel degradation is handled separately in the ROI module (not here).
"""


def pv_kwh_monthly(
    weather_series: list[float],
    system_size_kwp: float,
    performance_ratio: float = 0.80,
) -> list[float]:
    """
    Convert monthly effective sun-hours to kWh generated.

    Args:
        weather_series:   12-element list of effective sun-hours per month.
        system_size_kwp:  Installed PV capacity in kWp.
        performance_ratio: System performance ratio (0–1).

    Returns:
        12-element list of monthly kWh generated.
    """
    return [
        round(sun_h * system_size_kwp * performance_ratio, 2)
        for sun_h in weather_series
    ]
