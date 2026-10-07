# SheConnect

SheConnect is a full-stack maternal community application for sharing pregnancy and family moments, discussing posts, and connecting with other members through direct and group conversations. Members can manage their profile, find their own posts by ID, choose light or dark appearance, and control presence and direct-message preferences.

## Features

- Authenticated community feed with post creation, editing, and deletion.
- Post comments, including author-owned comment deletion.
- Profile management, post search by ID, pregnancy stage, avatar, and account settings.
- Direct and group conversations with message timestamps and read receipts.
- Optional active-presence and direct-message preferences.
- Veteran Mommy access verified by a protected backend role check; public registration cannot assign this role.
- JWT authentication, RESTful Express routes, and MongoDB persistence.

## Stack

- Frontend: React, TypeScript, Vite, and Tailwind CSS.
- Backend: Node.js, Express, and Mongoose.
- Database: MongoDB.

## Run locally

Requirements: Node.js `>=20.19.0`, npm, and a running MongoDB instance.

1. Configure the backend:

   ```powershell
   cd backend
   npm install
   Copy-Item .env.example .env
   ```

   Update `backend/.env` with a valid `MONGO_URI`, a strong random `JWT_SECRET`, and `CORS_ORIGINS` containing the frontend origin (local development defaults to `http://localhost:5173`).

2. In one terminal, start the backend:

   ```powershell
   cd backend
   npm start
   ```

3. In another terminal, start the frontend:

   ```powershell
   cd frontend/SheConnect-Frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. Vite proxies `/api` requests to the backend at `http://localhost:1111`.

For production, configure the frontend hosting/reverse proxy to route `/api` to the backend and set `CORS_ORIGINS` to the deployed frontend origin. Do not commit `.env` files or use development secrets in production.

## Validation

Run the backend controller tests:

```powershell
cd backend
npm test
```

The backend tests use Node's built-in test runner and mocked model methods; they do not require MongoDB. Validate the frontend:

```powershell
cd frontend/SheConnect-Frontend
npm run lint
npm run build
```

For backend API and database integration, start the app with a configured MongoDB database and verify the user, post, comment, and conversation flows in the running application.

## Documentation

- [Frontend setup, routes, and API connectivity](frontend/SheConnect-Frontend/README.md)
- [Backend setup, authentication, REST API, and CRUD behavior](backend/README.md)
