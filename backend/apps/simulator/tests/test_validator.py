from django.test import SimpleTestCase

from apps.simulator.domain.entities import Decision
from apps.simulator.domain.validator import validate_decisions


class ValidatorTests(SimpleTestCase):
    def _codes(self, decisions):
        return {error.code for error in validate_decisions(decisions).errors}

    def test_reference_valid(self):
        result = validate_decisions([Decision("M7", "Нура"), Decision("M8", "Нура"), Decision("M10", "Нура"), Decision("M12"), Decision("M5", "Сарыарка")])
        self.assertTrue(result.valid)
        self.assertEqual(result.spent_budget, 95)

    def test_budget_exceeded(self):
        codes = self._codes([Decision("M3", "Есиль"), Decision("M5", "Сарыарка"), Decision("M7", "Нура"), Decision("M8", "Нура"), Decision("M13", "Алматы")])
        self.assertIn("BUDGET_EXCEEDED", codes)

    def test_exactly_five(self):
        self.assertIn("EXACTLY_FIVE_REQUIRED", self._codes([Decision("M7", "Нура")] * 4))
        self.assertIn("EXACTLY_FIVE_REQUIRED", self._codes([Decision("M1", "Есиль"), Decision("M2"), Decision("M4", "Алматы"), Decision("M8", "Нура"), Decision("M12"), Decision("M14")]))

    def test_duplicate(self):
        self.assertIn("DUPLICATE_MEASURE", self._codes([Decision("M7", "Нура"), Decision("M7", "Есиль"), Decision("M10", "Нура"), Decision("M12"), Decision("M5", "Сарыарка")]))

    def test_direction_limit(self):
        self.assertIn("DIRECTION_LIMIT_EXCEEDED", self._codes([Decision("M7", "Нура"), Decision("M8", "Нура"), Decision("M9", "Алматы"), Decision("M10", "Нура"), Decision("M12")]))

    def test_district_required(self):
        self.assertIn("DISTRICT_REQUIRED", self._codes([Decision("M7"), Decision("M8", "Нура"), Decision("M10", "Нура"), Decision("M12"), Decision("M5", "Сарыарка")]))

    def test_city_measure_has_no_district(self):
        self.assertIn("CITY_MEASURE_HAS_DISTRICT", self._codes([Decision("M7", "Нура"), Decision("M8", "Нура"), Decision("M10", "Нура"), Decision("M12", "Есиль"), Decision("M5", "Сарыарка")]))

    def test_m1_m3_global_incompatibility(self):
        self.assertIn("GLOBAL_INCOMPATIBILITY", self._codes([Decision("M1", "Есиль"), Decision("M3", "Алматы"), Decision("M8", "Нура"), Decision("M10", "Нура"), Decision("M12")]))

    def test_m4_m7_same_district_forbidden_different_allowed(self):
        invalid = validate_decisions([Decision("M4", "Нура"), Decision("M7", "Нура"), Decision("M8", "Алматы"), Decision("M10", "Нура"), Decision("M12")])
        valid = validate_decisions([Decision("M4", "Есиль"), Decision("M7", "Нура"), Decision("M8", "Алматы"), Decision("M10", "Нура"), Decision("M12")])
        self.assertIn("DISTRICT_INCOMPATIBILITY", {error.code for error in invalid.errors})
        self.assertTrue(valid.valid)

    def test_m5_m13_same_district_forbidden_different_allowed(self):
        invalid = validate_decisions([Decision("M5", "Сарыарка"), Decision("M13", "Сарыарка"), Decision("M7", "Нура"), Decision("M10", "Нура"), Decision("M12")])
        valid = validate_decisions([Decision("M5", "Сарыарка"), Decision("M13", "Алматы"), Decision("M9", "Нура"), Decision("M10", "Нура"), Decision("M12")])
        self.assertIn("DISTRICT_INCOMPATIBILITY", {error.code for error in invalid.errors})
        self.assertTrue(valid.valid)
