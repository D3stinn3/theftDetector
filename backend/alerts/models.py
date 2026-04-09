from django.db import models


class Alert(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    message = models.TextField(blank=True, default="")
    timestamp = models.CharField(max_length=64, db_index=True)
    image_path = models.TextField(blank=True, default="")

    class Meta:
        db_table = "alerts"
        ordering = ["-timestamp"]
