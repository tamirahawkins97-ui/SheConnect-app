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

## Client-side routes and backend connectivity

React Router provides the browser-facing routes. These page paths are distinct from the `/api/...` REST endpoints used to load or update their data. During development, Vite proxies those API requests to the Express server at `http://localhost:1111`; `apiFetch` adds the stored bearer token to authenticated requests.

| Frontend route | Access | Backend communication |
| --- | --- | --- |
| `/` | Public | Posts credentials to `POST /api/users/login` or `POST /api/users/register`. Veteran Mommy sign-in also verifies the returned token with `GET /api/users/admin`; that endpoint applies the backend `adminOnly` role check. |
| `/auth` | Public redirect | Redirects to `/`; sign-in and registration are provided on the landing page. |
| `/feed` | Authenticated | Verifies the session with `GET /api/users/me`; loads posts with `GET /api/posts` and community members with `GET /api/users`. Post comments use `/api/posts/:postId/comments`. |
| `/create-post` | Authenticated | Creates posts with `POST /api/posts`. |
| `/social` and `/conversations` | Authenticated | Uses `/api/conversations` for conversation lists and creation, `/api/conversations/:id/messages` for reading and sending messages, and the conversation read-status `PATCH` endpoints. |
| `/profile` | Authenticated | Loads the account with `GET /api/users/me` and personal posts with `GET /api/posts/mine`; post lookup, editing, and deletion use `/api/posts/:id`. |
| `/settings` | Authenticated | Loads account settings with `GET /api/users/me`; currently attempts profile updates with `PUT /api/users/profile` and account deletion with `DELETE /api/users/me`. |

All authenticated pages are nested under `ProtectedRoute`, which checks token expiry in the browser and validates the session with `GET /api/users/me`. The authenticated layout also sends `PATCH /api/users/me/presence` when the page becomes visible and periodically while it remains open.

**Backend route gap:** the current Express `UserRoutes.js` does not register `PUT /api/users/profile` or `DELETE /api/users/me`, although the Profile and Settings screens call these endpoints. Those save and account-deletion actions require matching backend routes/controllers before they can work end to end. See the [backend README](../../backend/README.md) for the implemented API contract.
