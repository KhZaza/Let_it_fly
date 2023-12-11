from app import redis as r
def test_redis(redis):
    r.r = redis
    r.r.set('a', 'foo')
    assert r.r.get('a') == 'foo'