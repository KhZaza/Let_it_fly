import redis

r = redis.Redis(host='localhost', port=6379, db=0)

print(r.set('foo', 'bar'))

print(r.get('foo'))

coords = (-121.86673799999927,37.7141846872869, "NathanYee")
#res = r.geoadd("DriverLocation", coords)
#print(res)

res = r.geosearch("DriverLocation",member="NathanYee",radius=10,unit='mi',withcoord=True)
print(res)
res = r.geopos("DriverLocation", 'NathanYee')
print(res)