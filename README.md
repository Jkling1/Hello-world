# AI Fitness Agent

This project delivers an end-to-end AI-powered fitness planning experience built with a FastAPI backend and a Vite + React frontend. The API optionally uses OpenAI's Responses API to craft personalized workout plans (with a deterministic rule-based fallback when no API key is present). The React dashboard collects user inputs and renders the generated plan.

## File Structure

```
.
├── .env.example             # Template for secrets required by the backend
├── README.md                # Project overview and setup guide
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── requirements.txt     # Python dependencies
│   ├── schemas.py           # Pydantic request/response models
│   └── services/
│       ├── __init__.py
│       └── plan_generator.py# OpenAI + fallback workout plan generation logic
├── docs/                    # Documentation scaffold provided with the repo
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

## Prerequisites

- Python 3.11+
- Node.js 18+

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\\Scripts\\activate
pip install -r requirements.txt
cp ../.env.example ../.env  # fill in OPENAI_API_KEY if you have one
uvicorn backend.main:app --reload
```

The API serves:

- `GET /health` – health check used by the frontend status badge
- `POST /api/workouts` – accepts a JSON `WorkoutRequest` and returns a `WorkoutPlan`

If `OPENAI_API_KEY` is set, the backend calls OpenAI's Responses API (model `gpt-4o-mini`). Otherwise, it falls back to a deterministic template so the app remains functional offline.

## Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will start the React development server on http://localhost:5173. The proxy declared in `vite.config.js` forwards `/api` requests to the FastAPI backend running on port 8000.

## Usage

1. Launch both servers (backend on 8000, frontend on 5173).
2. Visit the React app at http://localhost:5173.
3. Adjust the form fields (name, age, goal, equipment, etc.) and click **Generate Workout Plan**.
4. The dashboard renders the summarized plan, a day-by-day schedule, and actionable tips. When OpenAI is unavailable, the rule-based fallback produces a structured example plan so the UI stays interactive.

## Environment Variables

See `.env.example` for the required variables. Only `OPENAI_API_KEY` is needed to enable live AI generation.

## Testing the API Quickly

With the backend running you can hit the API directly:

```bash
curl -X POST http://localhost:8000/api/workouts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jordan",
    "age": 30,
    "fitness_level": "Intermediate",
    "goal": "Endurance",
    "available_equipment": ["Dumbbells", "Resistance bands"],
    "preferences": "4 sessions per week, include mobility work"
  }'
```

## Screenshots

If you run the frontend and backend locally the dashboard should resemble the following layout (form on top, generated plan below). Take a screenshot using your preferred tool once running locally.
