from __future__ import annotations

from typing import Any

from .config import load_city_config
from .engine import simulate
from .entities import Decision
from .validator import validate_decisions


def recommend_alternatives(decisions: list[Decision], current_result: dict[str, Any]) -> list[dict[str, Any]]:
    config = load_city_config()
    current_score = float(current_result["score"])
    best: list[dict[str, Any]] = []
    selected_ids = {decision.measure_id for decision in decisions}

    for replace_index, old_decision in enumerate(decisions):
        for candidate_id, candidate in config["measures"].items():
            if candidate_id in selected_ids:
                continue
            districts = [None] if candidate["type"] == "city" else list(config["districts"].keys())
            for district in districts:
                candidate_decisions = list(decisions)
                candidate_decisions[replace_index] = Decision(measure_id=candidate_id, district=district)
                validation = validate_decisions(candidate_decisions)
                if not validation.valid:
                    continue
                result = simulate(candidate_decisions)
                delta = float(result["score"]) - current_score
                if delta > 0.01:
                    best.append(
                        {
                            "replace": {"measure_id": old_decision.measure_id, "district": old_decision.district},
                            "with": {"measure_id": candidate_id, "district": district},
                            "score": result["score"],
                            "delta": delta,
                            "message": (
                                f"Расчёт alternative engine показывает, что замена {old_decision.measure_id} "
                                f"на {candidate_id} увеличивает Score с {current_score:.2f} до {result['score']:.2f}."
                            ),
                        }
                    )

    return sorted(best, key=lambda item: item["delta"], reverse=True)[:3]
