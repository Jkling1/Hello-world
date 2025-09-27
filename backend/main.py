from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import WorkoutPlan, WorkoutRequest
from .services.plan_generator import PlanGenerationError, WorkoutPlanGenerator

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

logger = logging.getLogger(__name__)

app = FastAPI(title="AI Fitness Coach API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

generator = WorkoutPlanGenerator()


@app.get("/health", summary="Service health check")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/workouts", response_model=WorkoutPlan, summary="Generate a personalized workout plan")
def create_workout_plan(request: WorkoutRequest) -> WorkoutPlan:
    try:
        return generator.generate(request)
    except PlanGenerationError as exc:
        logger.exception("Failed to generate workout plan")
        raise HTTPException(status_code=502, detail=str(exc))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
