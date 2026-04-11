"""
Prophet Forecasting Service.
Handles spatial mapping and Prophet ML model inference for weather and tariffs.
"""

import math
import json
from pathlib import Path
from datetime import datetime
from dateutil.relativedelta import relativedelta

import pandas as pd
from prophet.serialize import model_from_json


class ProphetForecaster:
    """Wrapper around trained Prophet models for the backend."""

    def __init__(self):
        self._stations = []
        self._base_dir = Path(__file__).parent.parent
        self._models_dir = self._base_dir / "models"
        self._data_dir = self._base_dir / "data"

        self._load_weather_stations()

    def _load_weather_stations(self):
        """Load weather station geometry from CSV."""
        filepath = self._data_dir / "station_meta.csv"
        try:
            df = pd.read_csv(filepath)
            for _, row in df.iterrows():
                self._stations.append({
                    'station_id': row['station_id'],
                    'station_name': row['station_name'],
                    'latitude': float(row['location_latitude']),
                    'longitude': float(row['location_longitude'])
                })
        except FileNotFoundError:
            print(f"Warning: Station metadata missing at {filepath}")

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great-circle distance in kilometers."""
        R = 6371  # Earth radius km
        lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
        lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
        delta_lat = lat2_rad - lat1_rad
        delta_lon = lon2_rad - lon1_rad
        a = math.sin(delta_lat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def get_nearest_station(self, lat: float, lon: float) -> dict:
        """Find the closest ML-trained station by coordinates."""
        if not self._stations:
            raise ValueError("Station metadata not loaded.")
        
        nearest = min(
            self._stations,
            key=lambda s: self._haversine_distance(lat, lon, s['latitude'], s['longitude'])
        )
        nearest['distance_km'] = round(self._haversine_distance(lat, lon, nearest['latitude'], nearest['longitude']), 2)
        return nearest

    def _get_past_12m_avg(self, model, start_date, end_date):
        """Extract average values from Prophet training history."""
        history = model.history
        mask = (history['ds'] >= start_date) & (history['ds'] <= end_date)
        past_data = history.loc[mask]
        
        if past_data.empty:
            return round(history['y'].mean(), 2)
        return round(past_data['y'].mean(), 2)

    def forecast_scenario(self, lat: float, lon: float, user_type: str = 'residential') -> dict:
        """
        Run the Prophet ML models sequentially:
        1. Find station → 2. Predict Rain → 3. Predict Sun → 4. Predict Tariff.
        """
        # 1. Match station
        station = self.get_nearest_station(lat, lon)
        station_id = station['station_id']

        # 2. Load models
        try:
            with open(self._models_dir / f"model_rain_{station_id}.json", 'r') as fin:
                model_rain = model_from_json(json.load(fin))
            with open(self._models_dir / "model_sun.json", 'r') as fin:
                model_sun = model_from_json(json.load(fin))
            with open(self._models_dir / f"tariff_{user_type}.json", 'r') as fin:
                model_tariff = model_from_json(json.load(fin))
        except FileNotFoundError as e:
            raise RuntimeError(f"Missing Prophet JSON model: {str(e)}")

        # Calculate timeframes
        current_date = pd.Timestamp(datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0))
        future_dates = pd.DataFrame({'ds': pd.date_range(start=current_date, periods=12, freq='MS')})
        
        past_12m_start = current_date - relativedelta(months=12)
        past_12m_end = current_date - relativedelta(days=1)

        # Predict future series
        forecast_rain = model_rain.predict(future_dates)
        future_sun_df = forecast_rain[['ds', 'yhat']].rename(columns={'yhat': 'no_of_rainy_days'})
        
        forecast_sun = model_sun.predict(future_sun_df)
        forecast_tariff = model_tariff.predict(future_dates)

        # Predicts DAILY avg sunshine hours -> converted to total monthlysunshine hours.
        days_in_month = future_dates['ds'].dt.daysinmonth
        monthly_sun_hours = forecast_sun['yhat'] * days_in_month

        # Historical averages
        hist_rain_avg = self._get_past_12m_avg(model_rain, past_12m_start, past_12m_end)
        hist_sun_avg = self._get_past_12m_avg(model_sun, past_12m_start, past_12m_end)
        hist_tariff_avg = self._get_past_12m_avg(model_tariff, past_12m_start, past_12m_end)

        # Output serialization
        return {
            "station": station,
            "sun_hours_monthly": monthly_sun_hours.round(2).tolist(),
            "rainy_days_monthly": forecast_rain['yhat'].round(1).tolist(),
            "tariff_sgd_monthly": (forecast_tariff['yhat'] / 100.0).round(4).tolist(),
            "historical": {
                "past_12m_avg_daily_sunshine_hrs": hist_sun_avg,
                "past_12m_avg_rainy_days": hist_rain_avg,
                "past_12m_avg_tariff_cents": hist_tariff_avg
            }
        }

