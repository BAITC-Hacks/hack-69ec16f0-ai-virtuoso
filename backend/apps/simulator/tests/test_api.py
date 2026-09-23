from django.test import TestCase
from rest_framework.test import APIClient


class SimulatorApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reference_payload = {
            "team_name": "Demo Team",
            "decisions": [
                {"measure_id": "M7", "district": "Нура"},
                {"measure_id": "M8", "district": "Нура"},
                {"measure_id": "M10", "district": "Нура"},
                {"measure_id": "M12"},
                {"measure_id": "M5", "district": "Сарыарка"},
            ],
        }

    def test_get_config(self):
        response = self.client.get("/api/v1/config/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["dataset_version"], "ASTANA_SYNTH_V1")

    def test_get_districts(self):
        response = self.client.get("/api/v1/districts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 5)

    def test_get_measures(self):
        response = self.client.get("/api/v1/measures/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 14)

    def test_validate_valid_scenario(self):
        response = self.client.post("/api/v1/scenarios/validate/", self.reference_payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])

    def test_validate_invalid_scenario(self):
        payload = {"decisions": self.reference_payload["decisions"][:4]}
        response = self.client.post("/api/v1/scenarios/validate/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["valid"])
        self.assertIn("errors", response.json())

    def test_simulate_valid_scenario(self):
        response = self.client.post("/api/v1/scenarios/simulate/", self.reference_payload, format="json")
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertTrue(body["valid"])
        self.assertIn("id", body)
        self.assertAlmostEqual(body["result"]["score"], 56.54307, places=5)

    def test_simulate_invalid_scenario(self):
        payload = {"decisions": self.reference_payload["decisions"][:4]}
        response = self.client.post("/api/v1/scenarios/simulate/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["valid"])

    def test_analysis_fallback(self):
        simulate_response = self.client.post("/api/v1/scenarios/simulate/", self.reference_payload, format="json")
        scenario_id = simulate_response.json()["id"]
        response = self.client.post(f"/api/v1/scenarios/{scenario_id}/analysis/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn(response.json()["ai_mode"], ["fallback", "llm"])
