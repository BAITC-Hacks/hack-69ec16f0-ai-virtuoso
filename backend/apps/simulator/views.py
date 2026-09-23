from __future__ import annotations

from typing import Any

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from .domain.config import load_city_config
from .domain.engine import baseline_result, simulate
from .domain.entities import normalize_decisions
from .domain.validator import validate_decisions
from .models import Scenario
from .serializers import ScenarioInputSerializer, ScenarioSerializer
from .services.ai import build_analysis


@api_view(["GET"])
def health(_: Request) -> Response:
    config = load_city_config()
    return Response({"status": "ok", "dataset_version": config["dataset_version"], "ai_enabled": bool(settings.LLM_API_KEY)})


@api_view(["GET"])
def config_view(_: Request) -> Response:
    config = load_city_config()
    baseline = baseline_result()
    enriched_measures = []
    for measure_id, measure in config["measures"].items():
        factor = (config["horizon_quarters"] - measure["lag"]) / config["horizon_quarters"]
        enriched_measures.append(
            {
                "id": measure_id,
                **measure,
                "realization_factor": factor,
                "projected_effects": {indicator: effect * factor for indicator, effect in measure["effects"].items()},
            }
        )
    return Response(
        {
            "dataset_version": config["dataset_version"],
            "budget": config["budget"],
            "horizon_quarters": config["horizon_quarters"],
            "critical_threshold": config["critical_threshold"],
            "indicators": config["indicators"],
            "direction_weights": config["direction_weights"],
            "districts": _district_payload(config, baseline),
            "measures": enriched_measures,
            "synergies": config["synergies"],
            "incompatibilities": config["incompatibilities"],
            "baseline": baseline,
        }
    )


@api_view(["GET"])
def districts(_: Request) -> Response:
    config = load_city_config()
    baseline = baseline_result()
    return Response(_district_payload(config, baseline))


@api_view(["GET"])
def measures(_: Request) -> Response:
    config = load_city_config()
    return Response([{"id": measure_id, **measure} for measure_id, measure in config["measures"].items()])


@api_view(["POST"])
def validate_scenario(request: Request) -> Response:
    serializer = ScenarioInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    decisions = normalize_decisions(serializer.validated_data["decisions"])
    validation = validate_decisions(decisions)
    return Response(_validation_payload(validation))


@api_view(["POST"])
def simulate_scenario(request: Request) -> Response:
    serializer = ScenarioInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    decisions = normalize_decisions(serializer.validated_data["decisions"])
    validation = validate_decisions(decisions)
    if not validation.valid:
        return Response(_validation_payload(validation), status=status.HTTP_400_BAD_REQUEST)

    result = simulate(decisions)
    scenario = Scenario.objects.create(
        team_name=serializer.validated_data.get("team_name", ""),
        decisions=[decision.__dict__ for decision in decisions],
        result=result,
        score=result["score"],
        spent_budget=validation.spent_budget,
        weakest_district=result["weakest_district"]["name"],
    )
    return Response(
        {
            "id": scenario.id,
            "valid": True,
            "spent_budget": validation.spent_budget,
            "remaining_budget": validation.remaining_budget,
            "result": result,
            "analysis_url": f"/api/v1/scenarios/{scenario.id}/analysis/",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def scenario_analysis(request: Request, scenario_id: int) -> Response:
    scenario = get_object_or_404(Scenario, pk=scenario_id)
    decisions = normalize_decisions(scenario.decisions)
    analysis = build_analysis(decisions, scenario.result)
    scenario.ai_analysis = analysis
    scenario.save(update_fields=["ai_analysis"])
    return Response(analysis)


@api_view(["GET"])
def leaderboard(_: Request) -> Response:
    scenarios = Scenario.objects.order_by("-score", "spent_budget", "-created_at")[:20]
    return Response(ScenarioSerializer(scenarios, many=True).data)


def _validation_payload(validation: Any) -> dict[str, Any]:
    return {
        "valid": validation.valid,
        "spent_budget": validation.spent_budget,
        "remaining_budget": validation.remaining_budget,
        "errors": [error.__dict__ for error in validation.errors],
    }


def _district_payload(config: dict[str, Any], baseline: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "name": name,
            "population_share": district["population_share"],
            "profile": district["profile"],
            "indicators": district["indicators"],
            "score": baseline["districts"][name]["score"],
            "critical_indicators": baseline["districts"][name]["critical_indicators"],
        }
        for name, district in config["districts"].items()
    ]
