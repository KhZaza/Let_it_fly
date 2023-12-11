# Ride Share Project

This repository contains all of the coded components for the Let it Fly project, including the frontend, backend, and docker deployment.

## How to run

There are two versions of the app that can be started

- `docker-compose-dev.yml` - A development version of the project. This will sync with the local directory and update when changes are made.

- `docker-compose.yml` - This is a production version that has pre-compiled images and a built web server. 

If you are testing the production app, use `docker-compose.yml`. If you are developing, replace refrences with references to the development compose file.

### Starting docker compose
Enter the base directory of this project (where `docker-compose.yml` is located) in order to run these commands.
1. Ensure the following ports are open
- `3000` (needed for webserver)
- `8000` (needed for backend app server)
- `5432` (needed for postgres database)
- `6379` (needed for redis database)

2. Build the docker images needed using the following command:
```console
docker compose --file docker-compose.yml build
```
3. Create the necessary secrets files.

In order to ensure security, the API keys are stored in a docker compose secret and will be retrieved at runtime. The secrets are located in the `/secrets` folder in the base directory of the project. The folder is not tracked by git so the file needs to be created.

- Run the script `make_secrets.py` located in the base directory of the project using a version of python 3:

**If python uses the alias python3**
```
python3 make_secrets.py
```

**If python uses the alias python**
```
python make_secrets.py
```

- Replace the key in `mapbox-api-key.txt` with an API key retrieved from mapbox:

Once created, the file will look like this:

```
[API KEY GOES HERE]
```

Select all of the text and replace it with your API key retrieved from mapbox. If you are testing, an API key will be provided

4. To run compose, in the base directory of the project (where `docker-compose.yml` is located), run the command:

```console
docker compose --file docker-compose.yml up
```
Docker compose will spawn a fleet of servers for the project and network them together. This will allow the complete project to be launched in a fleet of containers without having to launch each container manually. 

5. After the servers have started, navigate to `localhost:3000` in the browser to access the website.
