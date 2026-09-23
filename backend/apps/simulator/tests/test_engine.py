from django.test import SimpleTestCase

from apps.simulator.domain.engine import baseline_result, simulate
from apps.simulator.domain.entities import Decision
from apps.simulator.domain.scoring import count_critical


REFERENCE = [
    Decision("M7", "Нура"),
    Decision("M8", "Нура"),
    Decision("M10", "Нура"),
    Decision("M12"),
    Decision("M5", "Сарыарка"),
]


class EngineTests(SimpleTestCase):
    def test_baseline_scores(self):
        result = baseline_result()
        self.assertAlmostEqual(result["districts"]["Есиль"]["score"], 62.99, places=5)
        self.assertAlmostEqual(result["districts"]["Алматы"]["score"], 57.06, places=5)
        self.assertAlmostEqual(result["districts"]["Сарыарка"]["score"], 54.65, places=5)
        self.assertAlmostEqual(result["districts"]["Байконур"]["score"], 56.63, places=5)
        self.assertAlmostEqual(result["districts"]["Нура"]["score"], 49.18, places=5)
        self.assertAlmostEqual(result["d_avg"], 56.8624, places=5)
        self.assertEqual(result["n_crit"], 2)
        self.assertAlmostEqual(result["score"], 52.55768, places=5)

    def test_reference_scenario(self):
        result = simulate(REFERENCE)
        self.assertAlmostEqual(result["districts"]["Есиль"]["score"], 63.4275, places=5)
        self.assertAlmostEqual(result["districts"]["Алматы"]["score"], 57.4975, places=5)
        self.assertAlmostEqual(result["districts"]["Сарыарка"]["score"], 56.3, places=5)
        self.assertAlmostEqual(result["districts"]["Байконур"]["score"], 57.0675, places=5)
        self.assertAlmostEqual(result["districts"]["Нура"]["score"], 52.9625, places=5)
        self.assertAlmostEqual(result["d_avg"], 58.0776, places=5)
        self.assertEqual(result["n_crit"], 0)
        self.assertAlmostEqual(result["score"], 56.54307, places=5)
        self.assertAlmostEqual(result["delta"], 3.98539, places=5)

    def test_synergy_m1_m2_only_m1_district(self):
        result = simulate([Decision("M1", "Есиль"), Decision("M2"), Decision("M4", "Алматы"), Decision("M8", "Нура"), Decision("M12")])
        synergies = result["breakdown"]["synergies"]
        self.assertTrue(any(item["id"] == "SYN_M1_M2" and item["district"] == "Есиль" for item in synergies))
        self.assertAlmostEqual(result["districts"]["Есиль"]["indicators"]["T1"], 45 + 4.5 + 3 + 2, places=5)
        self.assertAlmostEqual(result["districts"]["Алматы"]["indicators"]["T1"], 40 + 3, places=5)

    def test_synergy_m5_m6(self):
        result = simulate([Decision("M5", "Сарыарка"), Decision("M6"), Decision("M8", "Нура"), Decision("M10", "Нура"), Decision("M12")])
        self.assertTrue(any(item["id"] == "SYN_M5_M6" and item["district"] == "Сарыарка" for item in result["breakdown"]["synergies"]))
        self.assertAlmostEqual(result["districts"]["Сарыарка"]["indicators"]["E2"], 40 + 8.75 + 1.5 + 2, places=5)

    def test_lag_and_negative_effect(self):
        result = simulate([Decision("M11", "Нура"), Decision("M2"), Decision("M4", "Алматы"), Decision("M8", "Нура"), Decision("M12")])
        self.assertAlmostEqual(result["districts"]["Нура"]["indicators"]["T1"], 55 - 1.75 + 3, places=5)
        self.assertAlmostEqual(result["districts"]["Нура"]["indicators"]["B2"], 50 + 10.5 + 2.25, places=5)

    def test_clipping(self):
        result = simulate([Decision("M3", "Есиль"), Decision("M4", "Есиль"), Decision("M6"), Decision("M10", "Есиль"), Decision("M12")])
        for district in result["districts"].values():
            for value in district["indicators"].values():
                self.assertGreaterEqual(value, 0)
                self.assertLessEqual(value, 100)

    def test_critical_threshold(self):
        districts = {"A": {"S1": 39.999, "S2": 40.0}}
        self.assertEqual(count_critical(districts, ["S1", "S2"], 40), 1)

    def test_order_invariance(self):
        result_a = simulate(REFERENCE)
        result_b = simulate(list(reversed(REFERENCE)))
        self.assertAlmostEqual(result_a["score"], result_b["score"], places=8)

    def test_city_measure_applies_to_all_districts(self):
        result = simulate([Decision("M12"), Decision("M7", "Нура"), Decision("M8", "Нура"), Decision("M10", "Нура"), Decision("M5", "Сарыарка")])
        for district_name, district in result["districts"].items():
            baseline_c2 = baseline_result()["districts"][district_name]["indicators"]["C2"]
            self.assertAlmostEqual(district["indicators"]["C2"], baseline_c2 + 4.375, places=5)
