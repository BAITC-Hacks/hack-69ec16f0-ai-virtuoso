from django.contrib import admin

from .models import Scenario


@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = ("id", "team_name", "score", "spent_budget", "weakest_district", "created_at")
    search_fields = ("team_name",)
    readonly_fields = ("created_at",)
