# SheConnect Frontend

SheConnect is a maternal community application for sharing pregnancy and family moments, commenting on posts, and connecting through individual or group conversations. This folder contains the React, TypeScript, and Vite web client.

The frontend uses the SheConnect REST API for authentication and community features. For backend setup, authentication middleware, CRUD behavior, and the complete API route reference, see the [backend README](../../backend/README.md).

## Requirements

- Node.js and npm
- The SheConnect backend and MongoDB for API-backed features

## Install and run

From this directory:

```bash
npm install
npm run dev
```
-----------------------Full dependancies allocated in  `package.json` -----------------------

Vite serves the application at `http://localhost:5173`. Its development server proxies requests under `/api` to the backend at `http://localhost:1111`. Start and configure the backend as described in the [backend README](../../backend/README.md).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Run the TypeScript project build, then create the production bundle. |
| `npm run preview` | Preview the production bundle locally after building. |
| `npm run lint` | Run ESLint against the frontend source. |

## Main application areas

- **Landing and authentication:** Sign in or register for a community account. Veteran Mommy sign-in is a separate option and is verified by the backend's role-protected endpoint; the role cannot be assigned during public registration.
- **Feed:** Browse community posts, pregnancy details, and comments.
- **Create Post:** Share an image and a message with pregnancy stage and due-date details.
- **Profile:** Update profile information and view, search, edit, or delete your own posts.
- **Social Hub:** Create individual or group conversations, send messages, and view message read status and timestamps.
- **Settings:** Manage account preferences and select light or dark appearance. The display preference is saved in the browser.

## Project notes

- Client-side routes are defined in `src/App.tsx`.
- The shared stylesheet and responsive layout rules are in `src/App.css`.
- API requests are centralized in `src/utils/api.ts`.
- The Vite API proxy is configured in `vite.config.ts`.
- The production build output is written to `dist/`.
