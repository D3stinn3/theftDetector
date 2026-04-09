from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Alert",
            fields=[
                ("id", models.CharField(max_length=128, primary_key=True, serialize=False)),
                ("message", models.TextField(blank=True, default="")),
                ("timestamp", models.CharField(db_index=True, max_length=64)),
                ("image_path", models.TextField(blank=True, default="")),
            ],
            options={
                "db_table": "alerts",
                "ordering": ["-timestamp"],
            },
        ),
    ]
