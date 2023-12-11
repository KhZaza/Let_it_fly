from setuptools import setup

tests_require = [
    'pytest',
    'pytest-cov'
]

setup(
    name='Let It Fly',
    version='0.0.1',
    packages=['app'],
    install_requires=['pytest', 'pytest-cov', 'fastapi', 'uvicorn',
                      'celery', 'SQLAlchemy', 'websockets', 'h3', 'redis', 'routingpy'],
    extras_require={
        'test': tests_require
    },
)
