# 🎮 GamingStore: Frontend de la tienda

Frontend para clientes de **GamingStore**, una tienda de videojuegos cloud native. Permite iniciar sesión, ver el catálogo y comprar juegos. Las llamadas a la API van autenticadas con JWT de **Amazon Cognito**.

Proyecto de la asignatura **Desarrollo Cloud Native I (DSY1107)**, DuocUC.

## Stack

- React + Vite
- AWS Amplify (Auth) + `@aws-amplify/ui-react` (login con `withAuthenticator`)
- Amazon Cognito (user pool de clientes)
- Consume una API REST en Spring Boot expuesta por API Gateway con authorizer JWT

## Funcionalidades

- Registro e inicio de sesión de clientes con Cognito
- Catálogo de videojuegos (`GET /api/videojuegos`)
- Compra de un videojuego, que genera una orden (`POST /api/ordenes`)
- Token JWT adjunto en cada request

## Arquitectura

```
Cliente (React) ──JWT──> API Gateway (authorizer Cognito) ──> Backend Spring Boot
       │
       └── Cognito (user pool clientes)
```

Repos relacionados:
- Panel de administración: [Frontend-admin_tiendadevideojuegos](https://github.com/Truquitos212/Frontend-admin_tiendadevideojuegos)

## Cómo correrlo

```bash
npm install
cp .env.example .env   # completar con los datos de tu user pool y API
npm run dev
```

Variables de entorno (`.env`):

| Variable | Descripción |
|---|---|
| `VITE_AWS_REGION` | Región de AWS |
| `VITE_AWS_USER_POOL_ID` | ID del user pool de Cognito |
| `VITE_AWS_USER_POOL_CLIENT_ID` | ID del app client |
| `VITE_API_BASE_URL` | URL base de la API (API Gateway) |
