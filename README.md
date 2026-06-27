# CodeFront

A competitive programming platform with real-time 1v1 battle mode.

**Live:** https://codefront-sigma.vercel.app

## Features
- 30 DSA problems across Easy / Medium / Hard
- Docker sandboxed code execution (Python, C++, Java)
- Real-time 1v1 battle mode with matchmaking
- Solo practice mode with personal best tracking
- Contest mode with leaderboard freeze
- AI code review powered by Gemini
- JWT authentication with HTTP-only cookies

## Tech Stack
**Backend:** Node.js, Express, MongoDB, Redis, Bull, Socket.io, Docker  
**Frontend:** React, Redux, Vite, Monaco Editor  
**Infrastructure:** AWS EC2, Vercel, MongoDB Atlas, Docker Compose

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 20+
- MongoDB Atlas account

### Setup
\```bash
# clone
git clone https://github.com/atharva-nagane/codefront.git
cd codefront

# backend
cd backend
cp .env.example .env  # fill in your values
npm install
npm run dev

# worker (new terminal)
node src/features/execution/execution.worker.js

# frontend (new terminal)
cd ../frontend
npm install
npm run dev
\```

### Seed problems
\```bash
cd backend
node scripts/seedProblems.js
\```

### Run tests
\```bash
cd backend
npm test
\```

### Docker (production)
\```bash
cp .env.example .env  # fill in values
docker compose up -d
\```