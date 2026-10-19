# Digital Credential Wallet App

This project contains both the backend services and the frontend mobile application for interacting with the Walt.id digital credential ecosystem.

---

# App Backend

The backend for interfacing between the digital credential wallet app and Waltid API is located here.

For starting the backend, run the following command at the root of the project:

```
docker compose up --build
```

This will start everything including the backend. The documentation for each can be accessed as followed:

- Backend API - http://localhost:8000/docs
- Backend Status Manager API - http://localhost:8001/docs
- Wallet API - http://localhost:7001
- Issuer API - http://localhost:7002
- Verifier API - http://localhost:7003

Alternatively, the backend can be started manually without using docker. First navigate to the backend folder:

```
cd backend
```

Then install the python package for pdm using pip:

```
pip install pdm
```

If you don't have pip, then you likely don't have a local version of python installed. It can be downloaded [here](https://www.python.org/downloads/). After this, packages are installed using:

```
pdm install
```

Then there are two scripts that can be ran. `pdm run start` starts the backend normally, and `pdm run test` runs the pytest testing suite.

Regardless of how the backend is started, it will always be accessible from http://localhost:8000.

## Environment Configuration

Create a .env file in the frontend directory:

```
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:8000/api
```

# App Frontend

The frontend is a React Native app built with Expo

## Setup

Navigate to the frontend folder

```
cd frontend
```

Install dependencies

```
npm install
```

## Environment Configuration

Create a .env file in the backend directory:

```
VERIFIER_PUBLIC_URL=http://YOUR_LOCAL_IP:7003.
ISSUER_PUBLIC_URL=http://YOUR_LOCAL_IP:7002.
```

## Running the app

Start the Expo development server:

```
npm start
```

Then:

- Press i to run on iOS simulator
- Press a to run on Android emulator
- Or scan the QR code using Expo Go on your phone

## Running the backend tests

The app needs to be started before running tests, see the App Backend section

From the backend folder:

```
STATUS_MANAGER_API_BASE_URL=http://localhost:8001 WALLET_API_BASE_URL=http://localhost:7001 pdm run pytest tests/ --cov=. --cov-report=term-missing --cov-fail-under=80 -v
```

### Finding your local IP address

MacOS:

```
ipconfig getifaddr en0
```

Windows:

```
ipconfig
```

Look for an address like 192.168.x.x.

## Important notes:

- Your phone must be on the same Wi-Fi network as your computer
- The backend must be running before using the app
- Restart Expo after changing .env
  If issues occur, clear cache:

```
np start -- --clear
```

## Common issues

Blank scanner screen:

- Ensure camera permissions are enabled
- Reload the app or restart Expo

Network request failed:

- Check the .env IP address
- Ensure backend is running on port 8000
- Ensure no VPN or firewall is blocking requests
