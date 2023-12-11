import redis.asyncio as redis
import os

REDIS_HOST = os.getenv('REDIS_HOST', default='localhost')
REDIS_PORT = os.getenv('REDIS_PORT', default=6379)
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', default='eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81')

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, password=REDIS_PASSWORD)
