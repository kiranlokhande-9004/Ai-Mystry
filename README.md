# AL Mystery Room

An AI-powered detective game. Give the app a fictional case premise, investigate the generated suspects and evidence, then submit a verdict to reveal the solution.

## Features

- Generate fictional investigations with Google Gemini.
- Choose a case category, difficulty, and suspect count.
- Review suspect profiles, timelines, and evidence.
- Bookmark evidence and save investigation notes.
- Submit a verdict and receive the explanation and score.
- Store mysteries and investigation progress in MongoDB.
- Keep the culprit and solution on the backend until a verdict is submitted.

## Deploying on Netlify

On Netlify, the API runs as Netlify Functions (`netlify/functions/`). Data is stored in Netlify Database (Postgres), and case generation uses Gemini through Netlify AI Gateway, so you don't need a MongoDB URI or Gemini API key. Database migrations in `netlify/database/migrations/` are applied automatically on deploy. Case generation runs in a background function, and the frontend polls `GET /api/v1/mysteries/jobs/:jobId` until the case is ready. Run it locally with `netlify dev`.

The Express server in `server/` is still there for local development with MongoDB.

## Tech stack

- Frontend: React, Vite, React Router, Lucide
- Backend: Node.js, Express, Mongoose, Zod
- AI: Google Gemini API using `@google/genai`
- Database: MongoDB

## Requirements

- Node.js 20 or newer
- npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- A Gemini API key

## Setup

Install the root dependencies:

```bash
npm install
```

Create a root `.env` file from the backend example. In PowerShell:

```powershell
Copy-Item server/.env.example .env
```

Set the following values in `.env`:

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
CLIENT_URL=http://localhost:5173
```

Replace the MongoDB URI and Gemini key placeholders with your own values. Keep `.env` private; it is ignored by Git. For MongoDB Atlas, use a connection string supported by your network and allow the app server to connect to the cluster.

## Run the app

From the project root:

```bash
npm run dev
```

This starts the Vite frontend and Express API. Open the frontend URL printed by Vite, usually `http://localhost:5173`. The API listens on port `5002` by default.

To run the applications separately, use two terminals:

```bash
npm run dev:client
```

```bash
npm run dev:server
```

The backend can also be run from its own directory after installing its dependencies and creating `server/.env` from `server/.env.example`:

```powershell
Copy-Item server/.env.example server/.env
cd server
npm install
npm run dev
```

The API health endpoint is `http://localhost:5002/api/v1/health`. It reports whether MongoDB and Gemini are configured.

## Production build

Build the frontend assets with:

```bash
npm run build
```

Start the API with:

```bash
npm start
```

## API overview

All API routes use the `/api/v1` prefix.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API, MongoDB, and Gemini configuration status |
| `POST` | `/mysteries/generate` | Generate and save a mystery; returns public case data only |
| `GET` | `/mysteries/:id` | Retrieve public mystery data |
| `POST` | `/investigations` | Start an investigation for a mystery |
| `GET` | `/investigations/:id` | Retrieve investigation progress |
| `PATCH` | `/investigations/:id/progress` | Save notes, opened evidence, and bookmarks |
| `POST` | `/investigations/:id/verdict` | Submit a suspect and reveal the result |

## Security notes

- Keep `GEMINI_API_KEY` and MongoDB credentials in `.env` files on the backend only.
- Never commit `.env` files or put secrets in frontend code.
- Generated cases and evidence are fictional.
- The frontend never receives the hidden solution before verdict submission.

