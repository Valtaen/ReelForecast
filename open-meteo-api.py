import openmeteo_requests

import requests_cache
import pandas as pd
from retry_requests import retry

# You will need to install these by the terminal for the imports to work
# pip install openmeteo-requests
# pip install requests-cache retry-requests numpy pandas

# Modifies how pandas displays the data
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)
pd.set_option('display.width', None)

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Forecast
forecast_url = "https://api.open-meteo.com/v1/forecast"
forecast_params = {
    "latitude": 32.7766,
    "longitude": -79.9309,
    "hourly": ["temperature_2m", "rain", "wind_speed_10m", "wind_direction_10m"],
    "temperature_unit": "fahrenheit",
    "wind_speed_unit": "kn",
    "precipitation_unit": "inch"
}

# Marine
marine_url = "https://marine-api.open-meteo.com/v1/marine"
marine_params = {
    "latitude": 32.7766,
    "longitude": -79.9309,
    "hourly": ["wave_height", "wave_period"],
    "length_unit": "imperial"
}

forecast_responses = openmeteo.weather_api(forecast_url, params=forecast_params)
marine_responses = openmeteo.weather_api(marine_url, params=marine_params)

forecast_response = forecast_responses[0]
marine_response = marine_responses[0]

print(f"Coordinates {forecast_response.Latitude()}°N {forecast_response.Longitude()}°E")
print(f"Elevation {forecast_response.Elevation()} m asl")
print(f"Timezone {forecast_response.Timezone()} {forecast_response.TimezoneAbbreviation()}")
print(f"Timezone difference to GMT+0 {forecast_response.UtcOffsetSeconds()} s")

# Forecast
forecast_hourly = forecast_response.Hourly()
hourly_temperature_2m = forecast_hourly.Variables(0).ValuesAsNumpy()
hourly_rain = forecast_hourly.Variables(1).ValuesAsNumpy()
hourly_wind_speed_10m = forecast_hourly.Variables(2).ValuesAsNumpy()
hourly_wind_direction_10m = forecast_hourly.Variables(3).ValuesAsNumpy()

# Marine
marine_hourly = marine_response.Hourly()
hourly_wave_height = marine_hourly.Variables(0).ValuesAsNumpy()
hourly_wave_period = marine_hourly.Variables(1).ValuesAsNumpy()

# Forecast
# Dictionary
hourly_data = {"forecast_date": pd.date_range(
    start = pd.to_datetime(forecast_hourly.Time(), unit = "s", utc = True),
    end = pd.to_datetime(forecast_hourly.TimeEnd(), unit = "s", utc = True),
    freq = pd.Timedelta(seconds = forecast_hourly.Interval()),
    inclusive = "left"
)}

hourly_data["temperature_2m"] = hourly_temperature_2m
hourly_data["rain"] = hourly_rain
hourly_data["wind_speed_10m"] = hourly_wind_speed_10m
hourly_data["wind_direction_10m"] = hourly_wind_direction_10m

# Marine
hourly_data["wave_height"] = hourly_wave_height
hourly_data["wave_period"] = hourly_wave_period

hourly_dataframe = pd.DataFrame(data = hourly_data)
print(hourly_dataframe)

# print()
# print()
# print(marine_hourly.Variables(0).ValuesAsNumpy())
# print(hourly_data)
# print(hourly_temperature_2m)