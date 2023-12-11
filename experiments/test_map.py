import pprint
from routingpy import Valhalla
from shapely.geometry import Polygon, Point

client = Valhalla(base_url='http://localhost:8002')


# Some locations
coords = [[-121.86673799999927,37.7141846872869],[-121.88114235985894,37.33531834514278]]

#route = client.directions(locations=coords, profile='auto')
isochrones = client.isochrones(locations=coords[0], profile='auto', intervals=[5,600, 1200, 7200],interval_type='time')
#matrix = client.matrix(locations=coords, profile='auto')

#print((route.geometry, route.duration, route.distance, route.raw))
#print((isochrones.raw, isochrones[0].geometry, isochrones[0].center, isochrones[0].interval))
#print((matrix.durations, matrix.distances, matrix.raw))

for iso in isochrones:
    geo = Polygon(iso.geometry)
    print(geo.bounds)
    print("Isochrone {} secs - {}:\n\tArea: {} sqm".format(client.__class__.__name__,
                                                            iso.interval,
                                                            geo.area))
    print(geo.centroid)
    print(f"coords[1] is in bounds: {geo.contains(Point(coords[1]))}")