from django.core.management.base import BaseCommand

from apps.simulator.models import Scenario


class Command(BaseCommand):
    help = "Delete saved demo scenarios."

    def handle(self, *args, **options):
        count, _ = Scenario.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} demo scenarios."))
