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

## Deploy to Render

The root [`render.yaml`](render.yaml) defines a single Render Web Service that builds the Vite frontend and serves it with the Express backend. The frontend uses relative `/api` requests, so production does not need a separate frontend service or Vite proxy.

1. Push this repository to GitHub and create a Render Blueprint from the repository.
2. In the Blueprint setup, provide `MONGO_URI` for a production MongoDB database. Render generates `JWT_SECRET`; keep it private and rotate any credential that has been exposed.
3. Deploy the `sheconnect-app` web service. Render runs `npm run build`, starts the root `index.js` entry point, and checks `/health`.
4. If using a custom domain or serving the frontend separately, set `CORS_ORIGINS` in Render to the exact comma-separated browser origin(s), including `https://`. The blueprint default allows the Render service's default URL.
5. Configure MongoDB network access so the Render service can reach the database. Restrict database access to Render's outbound IP ranges where practical; avoid broad public access for production.

The service requires `MONGO_URI` and `JWT_SECRET`; it binds to Render's assigned `PORT`. Never commit `.env` files or put credentials in frontend build variables.

If deploying a Web Service manually instead of using the Blueprint, set **Root Directory** to the repository root, **Build Command** to `npm run build`, and **Start Command** to `node index.js` (or `npm start`). Do not use `node .` unless the root package metadata is included in the deployed commit.

## Run locally

Requirements: Node.js `>=20.19.0`, npm, and a running MongoDB instance.

1. Configure the backend:

   ```powershell
   cd backend
   npm install
   ```

   Create `backend/.env` with `MONGO_URI`, a strong random `JWT_SECRET`, and `CORS_ORIGINS=http://localhost:5173`. Do not commit this file.

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

For other production hosting arrangements, configure the frontend hosting/reverse proxy to route `/api` to the backend and set `CORS_ORIGINS` to the deployed frontend origin.

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
