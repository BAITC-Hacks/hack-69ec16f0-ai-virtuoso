from __future__ import annotations

from collections.abc import Mapping


def clip(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return max(lower, min(upper, value))


def district_score(indicators: Mapping[str, float], weights: Mapping[str, float]) -> float:
    return sum(float(indicators[indicator]) * float(weight) for indicator, weight in weights.items())


def count_critical(
    districts: Mapping[str, Mapping[str, float]],
    indicators: list[str],
    threshold: float,
) -> int:
    return sum(1 for values in districts.values() for indicator in indicators if float(values[indicator]) < threshold)


def final_score(d_avg: float, weakest_score: float, critical_count: int) -> float:
    return 0.7 * d_avg + 0.3 * weakest_score - critical_count
