import pandas as pd
import json
from prophet.serialize import model_from_json
from datetime import datetime
from dateutil.relativedelta import relativedelta


def get_station_id_by_name(station_input_name):
    stations = pd.read_csv('./data/station_meta.csv')

    matched = stations[stations['station_name'].str.contains(station_input_name, case=False, na=False)]

    if matched.empty:
        raise ValueError(f"No data for station '{station_input_name}', please check your input.")

    return matched.iloc[0]['station_id'], matched.iloc[0]['station_name']


def predict_solar_savings_by_station(station_input_name, user_type='domestic', roof_area_m2=50.0):
    station_id, station_full_name = get_station_id_by_name(station_input_name)
    # print(f"已匹配站点: {station_full_name} (ID: {station_id})")

    with open(f'./model/model_rain_{station_id}.json', 'r') as fin:
        model_rain = model_from_json(json.load(fin))
    with open('./model/model_sun.json', 'r') as fin:
        model_sun = model_from_json(json.load(fin))
    with open(f'./model/tariff_{user_type}.json', 'r') as fin:
        model_tariff = model_from_json(json.load(fin))

    current_date = pd.Timestamp(datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0))

    future_dates = pd.DataFrame({
        'ds': pd.date_range(start=current_date, periods=12, freq='MS')
    })

    forecast_rain = model_rain.predict(future_dates)
    future_sun = forecast_rain[['ds', 'yhat']].rename(columns={'yhat': 'no_of_rainy_days'})

    forecast_sun = model_sun.predict(future_sun)
    df_sun = forecast_sun[['ds', 'yhat']].rename(columns={'yhat': 'H_Sunshine_Hrs'})

    forecast_tariff = model_tariff.predict(future_dates)
    df_tariff = forecast_tariff[['ds', 'yhat']].rename(columns={'yhat': 'Tariff_Cents_per_kWh'})

    df_results = pd.merge(future_sun, df_sun, on='ds')
    df_results = pd.merge(df_results, df_tariff, on='ds')

    A_eff = roof_area_m2 * 0.7
    G = 1.0
    eta_panel = 0.8
    eta_system = 0.8

    df_results['D_Days'] = df_results['ds'].dt.daysinmonth
    df_results['E_month_kWh'] = (
            df_results['H_Sunshine_Hrs'] * A_eff * G * eta_panel * eta_system * df_results['D_Days']
    )

    df_results['Tariff_Dollars'] = df_results['Tariff_Cents_per_kWh'] / 100.0
    df_results['Savings_Dollars'] = round(df_results['E_month_kWh'] * df_results['Tariff_Dollars'], 2)

    df_results['Date'] = df_results['ds'].dt.strftime('%Y-%m')

    past_12m_start = current_date - relativedelta(months=12)
    past_12m_end = current_date - relativedelta(days=1)

    def get_past_12m_avg(model, start_date, end_date):
        history = model.history
        mask = (history['ds'] >= start_date) & (history['ds'] <= end_date)
        past_data = history.loc[mask]

        if past_data.empty:
            return history['y'].mean()
        return past_data['y'].mean()

    hist_rain_avg = get_past_12m_avg(model_rain, past_12m_start, past_12m_end)
    hist_sun_avg = get_past_12m_avg(model_sun, past_12m_start, past_12m_end)
    hist_tariff_avg = get_past_12m_avg(model_tariff, past_12m_start, past_12m_end)

    df_results['Past_12m_Avg_Rainy_Days'] = round(hist_rain_avg, 2)
    df_results['Past_12m_Avg_Sunshine_Hrs'] = round(hist_sun_avg, 2)
    df_results['Past_12m_Avg_Tariff_Cents'] = round(hist_tariff_avg, 2)

    df_results['no_of_rainy_days'] = df_results['no_of_rainy_days'].round(1)
    df_results['H_Sunshine_Hrs'] = df_results['H_Sunshine_Hrs'].round(2)
    df_results['Tariff_Cents_per_kWh'] = df_results['Tariff_Cents_per_kWh'].round(2)

    final_cols = [
        'Date',
        'no_of_rainy_days', 'H_Sunshine_Hrs', 'Tariff_Cents_per_kWh', 'Savings_Dollars',
        'Past_12m_Avg_Rainy_Days', 'Past_12m_Avg_Sunshine_Hrs', 'Past_12m_Avg_Tariff_Cents'
    ]

    return df_results[final_cols]


if __name__ == '__main__':
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    res = predict_solar_savings_by_station(station_input_name='Ang Mo Kio Avenue 5',
                                           user_type='domestic',
                                           roof_area_m2=100.0)
    print(res)
