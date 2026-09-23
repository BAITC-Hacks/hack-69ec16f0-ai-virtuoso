from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("config/", views.config_view, name="config"),
    path("districts/", views.districts, name="districts"),
    path("measures/", views.measures, name="measures"),
    path("scenarios/validate/", views.validate_scenario, name="validate-scenario"),
    path("scenarios/simulate/", views.simulate_scenario, name="simulate-scenario"),
    path("scenarios/<int:scenario_id>/analysis/", views.scenario_analysis, name="scenario-analysis"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
]
