from __future__ import annotations

import os
from typing import List

from openai import OpenAI

from ..schemas import WorkoutPlan, WorkoutRequest, WorkoutDay


class PlanGenerationError(RuntimeError):
    """Raised when an AI-generated workout plan cannot be produced."""


class WorkoutPlanGenerator:
    def __init__(self, model: str = "gpt-4o-mini") -> None:
        self.model = model
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None

    def generate(self, request: WorkoutRequest) -> WorkoutPlan:
        if self.client:
            return self._generate_with_openai(request)
        return self._generate_rule_based(request)

    def _generate_with_openai(self, request: WorkoutRequest) -> WorkoutPlan:
        prompt = (
            "You are an expert fitness coach. Create a 4-day workout plan tailored to the user. "
            "Return JSON with fields summary, schedule (array of day, focus, exercises[]), and tips (array of strings)."
        )
        response = self.client.responses.create(
            model=self.model,
            input=[
                {
                    "role": "system",
                    "content": "You design safe, progressive workouts and keep them concise.",
                },
                {
                    "role": "user",
                    "content": prompt + f"\nUser data: {request.model_dump_json()}",
                },
            ],
            response_format={"type": "json_object"},
        )

        try:
            payload = response.output[0].content[0].text
            plan_data = WorkoutPlan.model_validate_json(payload)
            return plan_data
        except Exception as exc:  # pragma: no cover - defensive
            raise PlanGenerationError("Unable to parse workout plan from OpenAI response") from exc

    def _generate_rule_based(self, request: WorkoutRequest) -> WorkoutPlan:
        template_days: List[WorkoutDay] = []
        focuses = [
            ("Day 1", "Strength"),
            ("Day 2", "Conditioning"),
            ("Day 3", "Mobility"),
            ("Day 4", "Active Recovery"),
        ]
        equipment_hint = ", ".join(request.available_equipment) if request.available_equipment else "bodyweight"

        for day, focus in focuses:
            exercises = [
                f"Warm-up: 5 minutes of dynamic stretches",
                f"Primary: {request.goal.title()} circuit tailored for {request.fitness_level.lower()} athletes",
                f"Equipment: Utilize {equipment_hint}",
                "Cool-down: 5 minutes of breathing and stretching",
            ]
            template_days.append(WorkoutDay(day=day, focus=focus, exercises=exercises))

        tips = [
            "Hydrate before, during, and after workouts.",
            "Log your progress weekly to adjust intensity.",
            "Prioritize sleep and balanced nutrition for recovery.",
        ]

        summary = (
            f"Custom 4-day plan for {request.name} focusing on {request.goal.lower()} while considering "
            f"a {request.fitness_level.lower()} fitness level and available equipment ({equipment_hint})."
        )

        return WorkoutPlan(summary=summary, schedule=template_days, tips=tips)
