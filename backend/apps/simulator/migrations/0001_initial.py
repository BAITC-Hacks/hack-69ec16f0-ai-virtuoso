from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Scenario",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("team_name", models.CharField(blank=True, max_length=120)),
                ("decisions", models.JSONField()),
                ("result", models.JSONField()),
                ("ai_analysis", models.JSONField(blank=True, null=True)),
                ("score", models.FloatField()),
                ("spent_budget", models.IntegerField()),
                ("weakest_district", models.CharField(max_length=60)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-score", "spent_budget", "-created_at"]},
        ),
    ]
