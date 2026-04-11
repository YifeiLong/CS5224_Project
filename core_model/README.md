# Core Model
## Usage Guide
### Step 1: Model Training (forecast_new.ipynb)
The Jupyter Notebook handles data ingestion, resampling, and training.

Raw dataset files are in `./data/` directory.

Open `forecast_new.ipynb` and run all cells.

**What happens during execution?**

It aggregates high-frequency (5-minute) rainfall data into monthly rainy days.

It extracts and saves weather station metadata to station_meta.csv.

It trains and serializes a specific Prophet model for each valid weather station.

It trains the global sunshine model and domestic/industrial tariff models.

All models are saved as json files in the `./model/` folder.

### Step 2: Running Predictions (evaluation.py)
Once the models are trained, you can use `evaluation.py` to generate tailored forecasts for a specific region. This script is designed to be easily integrated into a backend API (like FastAPI) or a frontend dashboard (like Streamlit).

**Output Fields Explanation:**

The function returns a pandas.DataFrame projecting 12 months into the future, containing:

* `Date`: The forecasted month (YYYY-MM).
* `no_of_rainy_days`: Forecasted rainy days for that specific region.
* `H_Sunshine_Hrs`: Forecasted daily sunshine hours, adjusted for local rainfall.
* `Tariff_Cents_per_kWh`: Forecasted electricity price.
* `Savings_Dollars`: Estimated money saved for that month based on generated solar power.
* `Past_12m_Avg_*`: Historical baseline metrics for the past 12 months, useful for dashboard comparisons.

## Calculation Parameters
The financial savings calculation in evaluation.py uses the following physical constants and system efficiencies. You can adjust these in the script based on the specific solar panel hardware used:
* Effective Roof Area (A_eff): 70% of total roof area.
* Solar Constant (G): 1.0 kW/m².
* Panel Efficiency (eta_panel): 80% (0.8).
* System Efficiency (eta_system): 80% (0.8).
