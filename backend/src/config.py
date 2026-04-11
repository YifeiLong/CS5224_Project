# Application-wide constants.
# Override via environment variables where appropriate.

import os

DEFAULT_TARIFF_SGD_PER_KWH: float = 0.30      # SP Group flat rate fallback
DEFAULT_PANEL_EFFICIENCY: float = 0.20         # typical mono-PERC panel
DEFAULT_PERFORMANCE_RATIO: float = 0.80        # inverter + wiring + temp losses
DEFAULT_CAPEX_PER_KWP_SGD: float = 2000.0      # rough SG market install cost
SELF_CONSUMPTION_RATIO: float = 0.80           # fraction of generation used on-site
DEGRADATION_RATE_PER_YEAR: float = 0.005       # 0.5 % annual panel degradation

# OneMap Search API — requires a registered token (token-based auth added 2024).
# Register at: https://www.onemap.gov.sg/apidocs/register
# Set ONEMAP_API_TOKEN in your .env file or environment before starting the server.
ONEMAP_SEARCH_URL: str = "https://www.onemap.gov.sg/api/common/elastic/search"
ONEMAP_API_TOKEN: str = os.getenv("ONEMAP_API_TOKEN", "")
GEOCODE_TIMEOUT_S: int = 5
