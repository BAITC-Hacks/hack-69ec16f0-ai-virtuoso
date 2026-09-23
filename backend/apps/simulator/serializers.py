from __future__ import annotations

from rest_framework import serializers


class DecisionSerializer(serializers.Serializer):
    measure_id = serializers.CharField(max_length=8)
    district = serializers.CharField(max_length=60, required=False, allow_blank=True, allow_null=True)


class ScenarioInputSerializer(serializers.Serializer):
    team_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    decisions = DecisionSerializer(many=True)


class ScenarioSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    team_name = serializers.CharField()
    score = serializers.FloatField()
    spent_budget = serializers.IntegerField()
    weakest_district = serializers.CharField()
    created_at = serializers.DateTimeField()
