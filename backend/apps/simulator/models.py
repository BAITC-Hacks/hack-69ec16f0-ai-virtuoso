from django.db import models


class Scenario(models.Model):
    team_name = models.CharField(max_length=120, blank=True)
    decisions = models.JSONField()
    result = models.JSONField()
    ai_analysis = models.JSONField(null=True, blank=True)
    score = models.FloatField()
    spent_budget = models.IntegerField()
    weakest_district = models.CharField(max_length=60)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-score", "spent_budget", "-created_at"]

    def __str__(self) -> str:
        label = self.team_name or f"Scenario {self.pk}"
        return f"{label}: {self.score:.2f}"
