"""
Weather forecasting service — DUMMY STUB.

Interface contract
------------------
WeatherForecaster exposes two public methods:

    load_model(path: str) -> None
        Load a serialised model artifact (currently a no-op placeholder).
        Plug your trained Prophet / LSTM model here.

    forecast_monthly(lat: float, lon: float) -> list[float]
        Return a 12-element list of *effective sun-hours per month*.
        Currently returns a deterministic sinusoidal pattern.
        Replace the body of this method with real inference when ready.

How to swap in a real model
---------------------------
1. Train a model that outputs 12 monthly sun-hour values given (lat, lon).
2. Serialise it (e.g. joblib.dump / torch.save).
3. Set MODEL_PATH in config.py (or via env var).
4. Implement load_model() and replace forecast_monthly() body.
   The rest of the pipeline (scenarios → PV → ROI) is model-agnostic.
"""

import math


class WeatherForecaster:
    """Thin wrapper around the (currently stubbed) weather model."""

    # Reasonable Singapore baseline: ~120 effective sun-hours/month
    # with a gentle ±10-hour sinusoidal seasonal swing.
    _BASE_HOURS: float = 120.0
    _AMPLITUDE: float = 10.0

    def load_model(self, path: str) -> None:
        """
        Placeholder: deserialise and store a trained model from `path`.

        Example (uncomment when implementing):
            import joblib
            self._model = joblib.load(path)
        """
        # TODO: replace with real model loading
        pass

    def forecast_monthly(self, lat: float, lon: float) -> list[float]:
        """
        Return 12 monthly effective sun-hours.

        Parameters are accepted for API compatibility; the dummy ignores them.
        The sinusoidal pattern gives month 0 (Jan) = BASE, peak near month 3,
        trough near month 9 — a rough approximation of Singapore's wet seasons.

        Replace this entire method body with real model inference.
        """
        return [
            round(
                self._BASE_HOURS + self._AMPLITUDE * math.sin(2 * math.pi * m / 12),
                2,
            )
            for m in range(12)
        ]
