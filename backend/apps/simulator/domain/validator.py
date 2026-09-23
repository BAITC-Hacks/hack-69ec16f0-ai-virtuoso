from __future__ import annotations

from collections import Counter

from .config import load_city_config
from .entities import Decision, ValidationErrorItem, ValidationResult


def _error(code: str, message: str, details: dict | None = None) -> ValidationErrorItem:
    return ValidationErrorItem(code=code, message=message, details=details or {})


def validate_decisions(decisions: list[Decision]) -> ValidationResult:
    config = load_city_config()
    budget = int(config["budget"])
    measures = config["measures"]
    districts = set(config["districts"].keys())
    errors: list[ValidationErrorItem] = []

    known_decisions = [decision for decision in decisions if decision.measure_id in measures]
    spent_budget = sum(int(measures[decision.measure_id]["cost"]) for decision in known_decisions)

    if spent_budget > budget:
        errors.append(_error("BUDGET_EXCEEDED", "Бюджет сценария превышает 100.", {"spent_budget": spent_budget, "budget": budget}))

    if len(decisions) != 5:
        errors.append(_error("EXACTLY_FIVE_REQUIRED", "Необходимо выбрать ровно 5 решений.", {"count": len(decisions)}))

    unknown_ids = [decision.measure_id for decision in decisions if decision.measure_id not in measures]
    for measure_id in unknown_ids:
        errors.append(_error("UNKNOWN_MEASURE", f"Мероприятие {measure_id or '<empty>'} не найдено.", {"measure_id": measure_id}))

    id_counts = Counter(decision.measure_id for decision in known_decisions)
    duplicates = sorted(measure_id for measure_id, count in id_counts.items() if count > 1)
    if duplicates:
        errors.append(_error("DUPLICATE_MEASURE", "Одно мероприятие нельзя выбрать несколько раз.", {"measure_ids": duplicates}))

    direction_counts = Counter(str(measures[decision.measure_id]["direction"]) for decision in known_decisions)
    too_many_directions = {direction: count for direction, count in direction_counts.items() if count > 2}
    if too_many_directions:
        errors.append(
            _error(
                "DIRECTION_LIMIT_EXCEEDED",
                "Нельзя выбрать больше двух мероприятий одного направления.",
                {"direction_counts": too_many_directions},
            )
        )

    for index, decision in enumerate(known_decisions):
        measure = measures[decision.measure_id]
        if measure["type"] == "district":
            if not decision.district:
                errors.append(
                    _error(
                        "DISTRICT_REQUIRED",
                        f"Для {decision.measure_id} нужно выбрать район.",
                        {"index": index, "measure_id": decision.measure_id},
                    )
                )
            elif decision.district not in districts:
                errors.append(
                    _error(
                        "INVALID_DISTRICT",
                        f"Район {decision.district} недоступен.",
                        {"index": index, "district": decision.district},
                    )
                )
        elif decision.district:
            errors.append(
                _error(
                    "CITY_MEASURE_HAS_DISTRICT",
                    f"{decision.measure_id} действует на город целиком, район указывать нельзя.",
                    {"index": index, "measure_id": decision.measure_id, "district": decision.district},
                )
            )

    errors.extend(_validate_incompatibilities(known_decisions))

    return ValidationResult(
        valid=not errors,
        errors=errors,
        spent_budget=spent_budget,
        remaining_budget=budget - spent_budget,
    )


def _validate_incompatibilities(decisions: list[Decision]) -> list[ValidationErrorItem]:
    config = load_city_config()
    errors: list[ValidationErrorItem] = []
    by_id: dict[str, list[Decision]] = {}
    for decision in decisions:
        by_id.setdefault(decision.measure_id, []).append(decision)

    for rule in config["incompatibilities"]:
        first_id, second_id = rule["measures"]
        if first_id not in by_id or second_id not in by_id:
            continue
        reason = str(rule["reason"])
        if rule["scope"] == "global":
            errors.append(
                _error(
                    "GLOBAL_INCOMPATIBILITY",
                    f"{first_id} и {second_id} нельзя выбрать вместе. {reason}",
                    {"measure_ids": [first_id, second_id], "reason": reason},
                )
            )
        elif rule["scope"] == "same_district":
            for first in by_id[first_id]:
                for second in by_id[second_id]:
                    if first.district and first.district == second.district:
                        errors.append(
                            _error(
                                "DISTRICT_INCOMPATIBILITY",
                                f"{first_id} и {second_id} нельзя совместить в районе {first.district}. {reason}",
                                {"measure_ids": [first_id, second_id], "district": first.district, "reason": reason},
                            )
                        )
    return errors
