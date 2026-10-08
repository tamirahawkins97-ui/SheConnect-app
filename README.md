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

## Live application

Open the deployed SheConnect application at [https://sheconnect-app-1.onrender.com/](https://sheconnect-app-1.onrender.com). Render's free service may take a short time to wake up after a period of inactivity.

## Deployment setup

SheConnect is deployed as one Render **Web Service** from the repository root. Express serves the built frontend and the `/api` endpoints from the same origin.

### Render dashboard configuration

Create or update a Web Service connected to this GitHub repository and configure:

- **Root Directory:** leave blank so Render uses the repository root.
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

Add these environment variables in the Render service's Environment settings:

- `NODE_ENV` — `production`
- `MONGO_URI` — the MongoDB connection string for the production database.
- `JWT_SECRET` — a new, randomly generated secret used to sign login tokens.
- `CORS_ORIGINS` — `https://sheconnect-app.onrender.com`; if using a custom frontend domain, include its exact HTTPS origin.

The build command installs the backend dependencies in `backend/`, installs the frontend dependencies, and creates the production frontend bundle. The start command starts the Express server, which serves that bundle and the API. The `/health` endpoint is used by Render to check that the service is responding.

Configure MongoDB network access to allow the Render service to connect. Keep database credentials and `JWT_SECRET` only in Render's private environment settings; do not commit `.env` files or include secrets in the frontend.

### Local development setup

Requirements: Node.js `>=20.19.0`, npm, and MongoDB.

1. Create `backend/.env` with `MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGINS=http://localhost:5173`. Keep this file local and uncommitted.
2. From the repository root, run `npm run build` to install dependencies and build the frontend.
3. Run `npm start` to start the backend. In another terminal, run `npm run dev` from `frontend/SheConnect-Frontend`.
4. Open `http://localhost:5173`. Vite proxies `/api` requests to the backend at `http://localhost:1111`.
