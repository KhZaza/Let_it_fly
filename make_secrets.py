"""
Use this script to instantiate a secrets folder if one isn't created
"""
import os

os.makedirs("./secrets", exist_ok=True)
with open(os.path.join("./secrets", "mapbox-api-key.txt"), "w") as f:
    f.write("[API KEY GOES HERE]")
