from routingpy import OSRM
from routingpy import MapboxOSRM
from geopy.geocoders import get_geocoder_for_service
from geopy.adapters import AioHTTPAdapter
import os
from get_docker_secret import get_docker_secret

GEOCODER_SERVICE = os.getenv('GEOCODER_SERVICE', default='nominatim')
GEOCODER_USER_AGENT = os.getenv('GEOCODER_USER_AGENT', default='LetItFlyBackend')
GEOCODER_KEY = os.getenv('GEOCODER_KEY', default=None)

# Mapbox settings
MAPBOX_API_KEY = get_docker_secret('mapbox_api_key')
print(f"Mapbox key: {MAPBOX_API_KEY}")
#print(MAPBOX_API_KEY is not None)

if MAPBOX_API_KEY:
    client = MapboxOSRM(api_key=MAPBOX_API_KEY)
    print('Client set to mapbox')
else:
    client = OSRM(base_url='http://127.0.0.1:5000')
def get_geocoder_class():
    """Returns the correct geocoder class according to the GEOCODER_SERVICE enviornmental variable"""
    return get_geocoder_for_service(GEOCODER_SERVICE)

def get_geocoder_options() -> dict:
    """Returns an asynchronous geocoder class config dictionary according to enviornmental variables"""
    options = dict(
        user_agent=GEOCODER_USER_AGENT,
        adapter_factory=AioHTTPAdapter,)
    if GEOCODER_KEY is not None:
        options['api_key'] = GEOCODER_KEY
    return options