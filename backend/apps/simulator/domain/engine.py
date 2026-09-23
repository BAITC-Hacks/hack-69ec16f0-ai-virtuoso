from __future__ import annotations

from copy import deepcopy
from typing import Any

from .config import load_city_config
from .entities import Decision
from .scoring import clip, count_critical, district_score, final_score


def baseline_result() -> dict[str, Any]:
    return simulate([])


def simulate(decisions: list[Decision]) -> dict[str, Any]:
    config = load_city_config()
    indicators = list(config["indicators"].keys())
    weights = {indicator: meta["weight"] for indicator, meta in config["indicators"].items()}
    districts = _baseline_indicators(config)
    regular_breakdown: list[dict[str, Any]] = []
    synergy_breakdown: list[dict[str, Any]] = []

    for decision in decisions:
        measure = config["measures"][decision.measure_id]
        factor = (float(config["horizon_quarters"]) - float(measure["lag"])) / float(config["horizon_quarters"])
        target_districts = list(districts.keys()) if measure["type"] == "city" else [decision.district]
        for district in target_districts:
            if district is None:
                continue
            for indicator, full_effect in measure["effects"].items():
                realized = float(full_effect) * factor
                before = districts[district][indicator]
                districts[district][indicator] = before + realized
                regular_breakdown.append(
                    {
                        "measure_id": decision.measure_id,
                        "district": district,
                        "indicator": indicator,
                        "full_effect": float(full_effect),
                        "realized_effect": realized,
                        "lag": int(measure["lag"]),
                        "factor": factor,
                    }
                )

    for synergy in config["synergies"]:
        if all(_has_measure(decisions, measure_id) for measure_id in synergy["requires"]):
            for source_decision in [decision for decision in decisions if decision.measure_id == synergy["source_measure"]]:
                district = source_decision.district
                if not district:
                    continue
                indicator = str(synergy["indicator"])
                amount = float(synergy["amount"])
                districts[district][indicator] += amount
                synergy_breakdown.append(
                    {
                        "id": synergy["id"],
                        "label": synergy["label"],
                        "requires": synergy["requires"],
                        "district": district,
                        "indicator": indicator,
                        "effect": amount,
                    }
                )

    pre_clip = deepcopy(districts)
    for district_values in districts.values():
        for indicator in indicators:
            district_values[indicator] = clip(float(district_values[indicator]))

    district_scores = {name: district_score(values, weights) for name, values in districts.items()}
    d_avg = sum(float(config["districts"][name]["population_share"]) * score for name, score in district_scores.items())
    weakest_name = min(district_scores, key=lambda name: district_scores[name])
    weakest_score = district_scores[weakest_name]
    n_crit = count_critical(districts, indicators, float(config["critical_threshold"]))
    score = final_score(d_avg, weakest_score, n_crit)
    baseline_scores = _baseline_scores(config)

    return {
        "dataset_version": config["dataset_version"],
        "score": score,
        "display_score": round(score, 2),
        "baseline_score": baseline_scores["score"],
        "delta": score - baseline_scores["score"],
        "display_delta": round(score - baseline_scores["score"], 2),
        "d_avg": d_avg,
        "weakest_district": {"name": weakest_name, "score": weakest_score},
        "n_crit": n_crit,
        "districts": {
            name: {
                "population_share": config["districts"][name]["population_share"],
                "profile": config["districts"][name]["profile"],
                "indicators": districts[name],
                "pre_clip_indicators": pre_clip[name],
                "score": district_scores[name],
                "baseline_score": baseline_scores["district_scores"][name],
                "delta": district_scores[name] - baseline_scores["district_scores"][name],
                "critical_indicators": [indicator for indicator in indicators if districts[name][indicator] < config["critical_threshold"]],
            }
            for name in districts
        },
        "breakdown": {
            "regular_effects": regular_breakdown,
            "synergies": synergy_breakdown,
            "formula": {
                "d_avg": d_avg,
                "weakest_district_score": weakest_score,
                "n_crit": n_crit,
                "score": score,
                "expression": "0.7 * D_avg + 0.3 * D_min - N_crit",
            },
        },
        "improvements": _improvements(config, baseline_scores["district_indicators"], districts, district_scores, baseline_scores["district_scores"]),
        "weak_spots": _weak_spots(config, districts),
    }


def _baseline_indicators(config: dict[str, Any]) -> dict[str, dict[str, float]]:
    return {
        district_name: {indicator: float(value) for indicator, value in district["indicators"].items()}
        for district_name, district in config["districts"].items()
    }


def _baseline_scores(config: dict[str, Any]) -> dict[str, Any]:
    indicators = list(config["indicators"].keys())
    weights = {indicator: meta["weight"] for indicator, meta in config["indicators"].items()}
    district_indicators = _baseline_indicators(config)
    district_scores = {name: district_score(values, weights) for name, values in district_indicators.items()}
    d_avg = sum(float(config["districts"][name]["population_share"]) * score for name, score in district_scores.items())
    weakest_name = min(district_scores, key=lambda name: district_scores[name])
    n_crit = count_critical(district_indicators, indicators, float(config["critical_threshold"]))
    score = final_score(d_avg, district_scores[weakest_name], n_crit)
    return {
        "score": score,
        "d_avg": d_avg,
        "district_scores": district_scores,
        "district_indicators": district_indicators,
        "weakest_district": weakest_name,
        "n_crit": n_crit,
    }


def _has_measure(decisions: list[Decision], measure_id: str) -> bool:
    return any(decision.measure_id == measure_id for decision in decisions)


def _improvements(
    config: dict[str, Any],
    baseline: dict[str, dict[str, float]],
    current: dict[str, dict[str, float]],
    district_scores: dict[str, float],
    baseline_scores: dict[str, float],
) -> list[dict[str, Any]]:
    improvements: list[dict[str, Any]] = []
    for district in current:
        improved_indicators = [
            {"indicator": indicator, "delta": current[district][indicator] - baseline[district][indicator]}
            for indicator in config["indicators"]
            if current[district][indicator] > baseline[district][indicator]
        ]
        if district_scores[district] > baseline_scores[district] or improved_indicators:
            improvements.append(
                {
                    "district": district,
                    "score_delta": district_scores[district] - baseline_scores[district],
                    "indicators": improved_indicators,
                }
            )
    return improvements


def _weak_spots(config: dict[str, Any], current: dict[str, dict[str, float]]) -> list[dict[str, Any]]:
    spots: list[dict[str, Any]] = []
    for district, values in current.items():
        for indicator, value in values.items():
            if value < config["critical_threshold"]:
                spots.append(
                    {
                        "district": district,
                        "indicator": indicator,
                        "value": value,
                        "label": config["indicators"][indicator]["label"],
                    }
                )
    return spots
