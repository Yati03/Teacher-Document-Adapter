# Teacher-Document-Adapter

A web app for teachers to manage classrooms and automatically generate accessibility-adapted versions of lesson materials (for students with visual impairments, dyslexia, memory difficulties, or color blindness) using an AI document-adaptation agent.

## Getting started

1. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:3000`.

## The AI document-adaptation agent

When a teacher uploads a lesson to a classroom, [`lib/documentAgent.js`](lib/documentAgent.js) sends it to an `@openai/agents` `Agent`. 
For every accommodation category with a positive student count in that classroom, the agent creates one adapted variant of the lesson using the teacher's custom instructions for that category (see Settings page), 
then bundles the original plus every adapted variant into a single ZIP, which is stored back in MongoDB via GridFS for the teacher to download.

## How AI was used to build this project

This app was built with Codex working from a detailed written specification covering the five pages. Codex did the implementation work directly.

## Tech stack

- **Next.js 16** (App Router, Turbopack) — pages and API routes
- **MongoDB + GridFS** — user, classroom, and settings documents; lesson files stored as binary blobs
- **OpenAI Agents SDK** (`@openai/agents`) — the document-adaptation agent, with the Code Interpreter tool for reading and rewriting uploaded lessons
- **jose** — signed JWT session cookies
- **bcryptjs** — password hashing

## Pages

| Page | Route | Purpose |
|---|---|---|
| Login | `/login` | Username/password sign-in |
| Create Account | `/account` | Registration with password-strength and match validation |
| Home | `/home` | Three-panel dashboard: classroom list, selected classroom's lessons, banner with Help/Settings/Account |
| Settings | `/settings` | Per-teacher accommodation instructions (Visual Problems, Dyslexic, Memory Problems, Color Blind) |
| Class | `/class` | Create/edit a classroom's name and per-accommodation student counts |

## Database architecture

MongoDB collections mirror the echelon structure from the original spec:

```
users
 ├─ username, passwordHash
 ├─ settings { visualProblems, dyslexic, memoryProblems, colorBlind }
 └─ (referenced by) classrooms, lessons

classrooms
 ├─ userId
 ├─ name
 └─ students { total, visualProblems, dyslexia, memoryProblems, colorBlindness }

lessons
 ├─ userId, classroomId
 ├─ name, status (processing | ready | failed)
 └─ originalFileId / adaptedFileId → GridFS
```

## Known limitations

- No delete for classrooms, lessons, or accounts.
- The in-app Help tour is a simplified step-through card rather than a proper animation.
- No automated test suite.
