from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

MeasureType = Literal["district", "city"]


@dataclass(frozen=True)
class Decision:
    measure_id: str
    district: str | None = None


@dataclass(frozen=True)
class ValidationErrorItem:
    code: str
    message: str
    details: dict


@dataclass(frozen=True)
class ValidationResult:
    valid: bool
    errors: list[ValidationErrorItem]
    spent_budget: int
    remaining_budget: int


def normalize_decisions(raw_decisions: list[dict]) -> list[Decision]:
    decisions: list[Decision] = []
    for item in raw_decisions:
        measure_id = str(item.get("measure_id") or item.get("id") or "").strip().upper()
        district = item.get("district")
        district_value = str(district).strip() if district not in (None, "") else None
        decisions.append(Decision(measure_id=measure_id, district=district_value))
    return decisions
