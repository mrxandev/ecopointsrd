# EcoPoints RD

App móvil (Expo + React Native) de EcoPoints RD: los usuarios se inscriben en misiones ecológicas, ganan puntos y los canjean por recompensas. Los agentes validan la participación de los usuarios en las misiones escaneando su código QR.

## Requisitos

- Node.js
- La app [Expo Go](https://expo.dev/go) instalada en tu teléfono (o un emulador Android / simulador iOS)

## Instalación

```bash
npm install
```

Crea un archivo `.env` en la raíz del proyecto con estas variables:

```bash
EXPO_PUBLIC_API_ENV=local
EXPO_PUBLIC_API_LOCAL_URL=http://localhost:3000/
EXPO_PUBLIC_API_PRODUCTION_URL=<url-del-backend-en-produccion>
EXPO_PUBLIC_API_LOGIN_PATH=/api/auth/login
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<tu-api-key-de-google-maps>
```

Pide las URLs del backend y el API key de Google Maps al resto del equipo; no se suben al repositorio.

## Correr el proyecto

```bash
npx expo start
```

Escanea el código QR con Expo Go, o presiona `a` (Android) / `i` (iOS) en la terminal para abrirlo en un emulador/simulador.

Si tu teléfono no está en la misma red Wi-Fi que tu computadora, usa:

```bash
npx expo start --tunnel
```
