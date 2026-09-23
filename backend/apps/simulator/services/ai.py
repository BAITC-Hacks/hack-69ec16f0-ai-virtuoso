from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings

from apps.simulator.domain.config import load_city_config
from apps.simulator.domain.entities import Decision
from apps.simulator.domain.recommendations import recommend_alternatives


def build_analysis(decisions: list[Decision], result: dict[str, Any]) -> dict[str, Any]:
    recommendations = recommend_alternatives(decisions, result)
    if settings.LLM_API_KEY and settings.LLM_BASE_URL:
        llm_response = _try_llm(decisions, result, recommendations)
        if llm_response:
            return {**llm_response, "ai_mode": "llm", "recommendations": recommendations}

    return {
        "ai_mode": "fallback",
        "summary": _fallback_summary(result),
        "trade_off": _trade_off(decisions),
        "recommendations": recommendations,
        "confidence": "deterministic",
    }


def _try_llm(decisions: list[Decision], result: dict[str, Any], recommendations: list[dict[str, Any]]) -> dict[str, Any] | None:
    payload = {
        "model": settings.LLM_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Ты интерпретируешь уже рассчитанные результаты AKIM OS. "
                    "Не пересчитывай числа, не придумывай Score, отвечай на русском JSON."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {"decisions": [decision.__dict__ for decision in decisions], "result": result, "recommendations": recommendations},
                    ensure_ascii=False,
                ),
            },
        ],
        "response_format": {"type": "json_object"},
    }
    request = urllib.request.Request(
        settings.LLM_BASE_URL.rstrip("/") + "/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {settings.LLM_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    content = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        return None
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return {"summary": content, "trade_off": _trade_off(decisions)}
    return parsed if isinstance(parsed, dict) else None


def _fallback_summary(result: dict[str, Any]) -> str:
    weak_spots = result["weak_spots"]
    weakest = result["weakest_district"]
    if not weak_spots:
        critical_text = "Сценарий убирает все показатели ниже критического порога 40."
    else:
        items = ", ".join(f"{spot['district']} {spot['indicator']}={spot['value']:.1f}" for spot in weak_spots[:3])
        critical_text = f"После сценария остаются критические зоны: {items}."
    return (
        f"Score меняется с {result['baseline_score']:.2f} до {result['score']:.2f} "
        f"({result['delta']:+.2f}). {critical_text} "
        f"Самый слабый район после расчёта: {weakest['name']} ({weakest['score']:.2f})."
    )


def _trade_off(decisions: list[Decision]) -> str:
    config = load_city_config()
    counts: dict[str, int] = {}
    for decision in decisions:
        direction = config["measures"][decision.measure_id]["direction"]
        counts[direction] = counts.get(direction, 0) + 1
    if not counts:
        return "Сценарий ещё не сформирован."
    top_direction = max(counts, key=counts.get)
    labels = {
        "transport": "транспорт",
        "ecology": "экологию",
        "social": "социальную инфраструктуру",
        "safety": "безопасность",
        "services": "городские сервисы",
    }
    return f"Главный управленческий акцент сделан на {labels.get(top_direction, top_direction)}; остальные направления получают меньше бюджета."
