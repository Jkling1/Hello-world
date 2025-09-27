from pydantic import BaseModel, Field
from typing import List, Optional


class WorkoutRequest(BaseModel):
    name: str = Field(..., description="Name of the person requesting the workout plan")
    age: int = Field(..., ge=10, le=100, description="Age in years")
    fitness_level: str = Field(..., description="Beginner, intermediate, or advanced")
    goal: str = Field(..., description="Primary fitness goal, e.g. strength, endurance, weight loss")
    available_equipment: List[str] = Field(
        default_factory=list, description="List of equipment available, leave empty for bodyweight"
    )
    preferences: Optional[str] = Field(
        default=None, description="Optional preferences such as workout style or days per week"
    )


class WorkoutDay(BaseModel):
    day: str
    focus: str
    exercises: List[str]


class WorkoutPlan(BaseModel):
    summary: str
    schedule: List[WorkoutDay]
    tips: List[str]
