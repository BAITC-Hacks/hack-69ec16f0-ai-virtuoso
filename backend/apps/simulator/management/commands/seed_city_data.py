from django.core.management.base import BaseCommand

from apps.simulator.domain.config import load_city_config
from apps.simulator.domain.engine import baseline_result


class Command(BaseCommand):
    help = "Validate the canonical synthetic Astana dataset. Idempotent for local demos."

    def handle(self, *args, **options):
        config = load_city_config()
        baseline = baseline_result()
        self.stdout.write(self.style.SUCCESS(f"Dataset {config['dataset_version']} loaded. Baseline Score: {baseline['score']:.5f}"))
