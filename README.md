# BildyApp

API REST con Node.js y Express para la gestión de albaranes de obra. Este módulo implementa la gestión completa de usuarios.

## Requisitos

- Node.js 22+
- MongoDB Atlas

## Instalación

```bash
npm install
cp .env.example .env
# Rellenar las variables de .env
```

## Ejecución

```bash
npm run dev
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/user/register | Registro de usuario |
| PUT | /api/user/validation | Verificar email |
| POST | /api/user/login | Login |
| PUT | /api/user/register | Actualizar datos personales |
| PATCH | /api/user/company | Crear o unirse a empresa |
| PATCH | /api/user/logo | Subir logo de empresa |
| GET | /api/user | Obtener usuario autenticado |
| POST | /api/user/refresh | Renovar access token |
| POST | /api/user/logout | Cerrar sesión |
| DELETE | /api/user | Eliminar usuario |
| PUT | /api/user/password | Cambiar contraseña |
| POST | /api/user/invite | Invitar usuario |

## Variables de entorno

Ver `.env.example`
