# Application Server
This folder contains the 
## Run Instructions
To run the server locally, cd into this directory and run the command
```
uvicorn main:app --reload
```

## Generating SQL setup file
In order to generate a `.sql` initialization script for a docker image, run the `generate_schema.py` script from the root of the project.