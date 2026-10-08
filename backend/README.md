# SheConnect Backend

The SheConnect backend is a Node.js, Express, and MongoDB API for user authentication, community posts and comments, and direct or group conversations. MongoDB access is implemented with Mongoose.

## Requirements

- Node.js `>=20.19.0` (see `package.json`)
- npm
- A MongoDB connection string
- Express framework 
- bcrypt integration for password security 
- Cross Origin Resource Sharing (cors) to ensure accurate communication between servers. 
- jsonwebtoken generation for stored user validation

-----------------------Full dependancies allocated in  `package.json` -----------------------

## Setup and tests

From `backend/`, install dependencies with `npm install` and create a local `.env` containing `MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGINS=http://localhost:5173`. Use a cryptographically random JWT secret and never commit `.env`. The Render Blueprint at the repository root sets the production environment, builds the frontend, and serves it from this Express service.

For a separate frontend host, set `CORS_ORIGINS` to its exact browser origin(s), comma-separated. Same-origin frontend requests to the combined Render service do not require CORS.

Run `npm test` to execute the backend controller tests. The tests use Node's built-in test runner and mocked model methods, so they do not require a running MongoDB instance. End-to-end verification still requires a configured MongoDB database and running frontend/backend.

## Request and authentication conventions

- API routes are mounted under `/api`.
- JSON request bodies are supported; the JSON body limit is 10 MB.
- CORS allows the configured frontend origins and includes `PATCH` for presence and message read-status requests.
- Protected routes expect `Authorization: Bearer <token>`.
- Registration returns a JWT with a two-day lifetime. Login returns a JWT with a one-day lifetime.
- The signed JWT contains the user's `_id` and `role`. Route middleware verifies it with `JWT_SECRET` and makes the decoded claims available as `req.user`.
- Missing bearer tokens return `401`; an invalid or expired token is rejected by authentication middleware. Admin-only access additionally checks the role and returns `403` when the user is not a `Veteran Mommy`.
- Authenticated reads and mutations are scoped to the caller where applicable. For example, `/api/posts/mine` lists the signed-in user's posts, and post edit/delete/look-up operations only find that user's own post.

## REST API

All request and response bodies below are JSON unless otherwise noted.

### Authentication and users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/users/register` | No | Create a user from `username`, `email`, and `password`; returns `201` and a JWT. |
| `POST` | `/api/users/login` | No | Authenticate with `email` and `password`; returns a JWT. |
| `GET` | `/api/users/me` | Bearer token | Return the authenticated user (excluding the password). |
| `GET` | `/api/users` | Bearer token | List up to 100 community members other than the caller, with presence information. |
| `PATCH` | `/api/users/me/presence` | Bearer token | Update the caller's last-seen timestamp. |
| `GET` | `/api/users/admin` | Bearer token + admin role | Verify Veteran Mommy access; requires role `Veteran Mommy` via `adminOnly` middleware. |

Passwords are hashed by the User model before saving and compared with bcrypt during login. Public registration accepts only `username`, `email`, and `password`; a new account receives the default `user` role. Veteran Mommy accounts must be granted that role through a trusted administrative process, never through public registration. The landing page's Veteran Mommy sign-in option validates credentials and then calls `/api/users/admin`; the backend middleware makes the role decision and rejects other roles with `403`. User self-service profile update and account deletion routes are **not currently registered** in `UserRoutes.js`.

Self-service profile updates are registered at `PUT /api/users/profile`. They accept only supported profile and privacy fields; password changes require the current password. Account deletion is registered at `DELETE /api/users/me` and removes the user's posts and related comments, direct conversations, and group participation/messages. The `allowDirectMessages` setting is enforced when creating or sending direct conversations, while `showActiveStatus` controls presence visibility.

### Posts

All `/api/posts` routes require a bearer token.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/posts` | List up to 100 posts, newest first. |
| `GET` | `/api/posts/mine` | List posts owned by the authenticated user. |
| `POST` | `/api/posts` | Create a post. Returns `201`. |
| `GET` | `/api/posts/:id` | Get one of the authenticated user's posts by ID. |
| `PUT` | `/api/posts/:id` | Update allowed post fields: `message`, `imageURL`, `Day`, `Week`, `Trimester`, and `dueDate`. |
| `DELETE` | `/api/posts/:id` | Delete one of the authenticated user's posts. |

Create-post payload fields are `message`, `day` (weekday string or number 1–7), `week` (number or `Week N`, 1–42), `trimester`, and `dueDate`. The image can be supplied as `image` or `imageURL`; the API stores it in `imageURL`. Post responses include the populated author's username and avatar where applicable.

### Comments

The supported comment workflow is post-scoped. Reading comments is public; creating and deleting comments require a bearer token.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/posts/:postId/comments` | No | List comments for a post, oldest first. |
| `POST` | `/api/posts/:postId/comments` | Bearer token | Add a comment using `text`, `gifUrl`, or both; returns `201`. |
| `DELETE` | `/api/posts/:postId/comments/:id` | Bearer token | Delete a comment if it belongs to the authenticated user. |
| `DELETE` | `/api/comments/:id` | Bearer token | Delete a comment owned by the authenticated user. |

A comment must include non-empty text or a GIF/image URL. The comment author is populated in responses.
The comment router is also mounted at `/api/comments`, but its `GET /` and `POST /` handlers depend on a `postId` route parameter; use the post-scoped endpoints above for listing and creating comments.

### Conversations and messages

Every `/api/conversations` route requires a bearer token. A caller must be a participant to read, send messages to, or update read status for a conversation.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/conversations` | List the caller's conversations with participant details, last message, and unread count. |
| `POST` | `/api/conversations` | Create or find a direct conversation, or create a group conversation. |
| `GET` | `/api/conversations/:id/messages` | Get a conversation and its messages. |
| `POST` | `/api/conversations/:id/messages` | Send a message with a non-empty `text` body (maximum 5,000 characters); returns `201`. |
| `PATCH` | `/api/conversations/:id/messages/:messageId/read` | Mark one incoming message as read. |
| `PATCH` | `/api/conversations/:id/read` | Mark all incoming messages in the conversation as read. |

Create a direct conversation with `{ "type": "direct", "recipientId": "<user-id>" }`. Create a group with `{ "type": "group", "groupTitle": "...", "participantIds": ["<user-id>", "..."], "maxParticipants": 50 }`. The authenticated user is automatically included in a group; groups allow 3–50 total participants.

## CRUD and REST design

- **Create:** `POST` creates accounts, posts, comments, conversations, and messages.
- **Read:** `GET` retrieves the current user, community, feed/profile posts, post comments, conversations, and conversation messages.
- **Update:** `PUT /api/posts/:id` updates a user's post; `PATCH` updates presence or message read state.
- **Delete:** `DELETE` removes an owned post or comment.
- Resource identifiers are carried in route parameters (for example `:id`, `:postId`, and `:messageId`); request data is sent in JSON bodies.
- Controllers return resource-specific HTTP status codes and JSON error messages for common invalid, unauthorized, and missing-resource cases.

## Project structure

```text
backend/
  controllers/   Request handlers and resource operations
  db/            MongoDB connection
  middleware/    JWT verification and role checks
  models/        Mongoose user, post, comment, and conversation schemas
  routes/        Express routers mounted by server.js
  seeds/         Development seed script
  server.js      Middleware configuration and API route mounting
```
