import pandas as pd
import json
from prophet.serialize import model_from_json
from datetime import datetime


def load_and_predict_sunshine(start_date, months=12):
    with open('./model/model_rain.json', 'r') as fin:
        model_rain = model_from_json(json.load(fin))
    with open('./model/model_sun.json', 'r') as fin:
        model_sun = model_from_json(json.load(fin))

    future_dates = pd.DataFrame({
        'ds': pd.date_range(start=start_date, periods=months, freq='MS')
    })

    forecast_rain = model_rain.predict(future_dates)

    future_sun = forecast_rain[['ds', 'yhat']].rename(columns={'yhat': 'no_of_rainy_days'})
    forecast_sun = model_sun.predict(future_sun)

    df_sun = forecast_sun[['ds', 'yhat']].rename(columns={'yhat': 'H_Sunshine_Hrs'})

    hist_sun_avg = model_sun.history['y'].mean()
    hist_rain_avg = model_sun.history['no_of_rainy_days'].mean()

    return df_sun, hist_sun_avg, hist_rain_avg


def load_and_predict_tariff(start_date, user_type='domestic', months=12):
    filename = f'./model/tariff_{user_type}.json'
    with open(filename, 'r') as fin:
        model_tariff = model_from_json(json.load(fin))

    future_dates = pd.DataFrame({
        'ds': pd.date_range(start=start_date, periods=months, freq='MS')
    })

    forecast_tariff = model_tariff.predict(future_dates)
    df_tariff = forecast_tariff[['ds', 'yhat']].rename(columns={'yhat': 'Tariff_Cents_per_kWh'})

    hist_tariff_avg = model_tariff.history['y'].mean()

    return df_tariff, hist_tariff_avg


def calculate_solar_roi(roof_area_m2, user_type='domestic', months_to_predict=12):
    current_date = pd.to_datetime(datetime.now().strftime('%Y-%m-01'))

    df_sun, hist_sun_avg, hist_rain_avg = load_and_predict_sunshine(current_date, months_to_predict)
    df_tariff, hist_tariff_avg = load_and_predict_tariff(current_date, user_type, months_to_predict)

    df_results = pd.merge(df_sun, df_tariff, on='ds')

    A_eff = roof_area_m2 * 0.7
    G = 1.0
    eta_panel = 0.8
    eta_system = 0.8

    df_results['D_Days'] = df_results['ds'].dt.daysinmonth
    df_results['E_month_kWh'] = (
            df_results['H_Sunshine_Hrs'] * A_eff * G * eta_panel * eta_system * df_results['D_Days']
    )

    df_results['Tariff_Dollars'] = df_results['Tariff_Cents_per_kWh'] / 100.0
    df_results['Savings_Dollars'] = df_results['E_month_kWh'] * df_results['Tariff_Dollars']
    df_results['Cumulative_Savings'] = df_results['Savings_Dollars'].cumsum()
    df_results['Date'] = df_results['ds'].dt.strftime('%Y-%m')

    df_results['Hist_Avg_Sunshine_Hrs'] = round(hist_sun_avg, 2)
    df_results['Hist_Avg_Rainy_Days'] = round(hist_rain_avg, 2)
    df_results['Hist_Avg_Tariff'] = round(hist_tariff_avg, 2)

    final_cols = [
        'Date', 'H_Sunshine_Hrs', 'D_Days', 'E_month_kWh',
        'Tariff_Cents_per_kWh', 'Savings_Dollars', 'Cumulative_Savings',
        'Hist_Avg_Sunshine_Hrs', 'Hist_Avg_Rainy_Days', 'Hist_Avg_Tariff'
    ]

    return df_results[final_cols].to_dict(orient='records')


if __name__ == "__main__":
    ROOF_AREA = 100
    USER_TYPE = 'domestic'

    roi_df = calculate_solar_roi(roof_area_m2=ROOF_AREA, user_type=USER_TYPE, months_to_predict=12)
    pd.options.display.float_format = '{:.2f}'.format
    print(roi_df)
