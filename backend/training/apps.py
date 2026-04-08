from django.apps import AppConfig
import os


class TrainingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "training"

    def ready(self):
        # Start background worker only in the reloader child process.
        if os.environ.get("RUN_MAIN") != "true":
            return
        from training.worker import reconcile_stale_training_jobs, training_worker

        reconcile_stale_training_jobs()
        training_worker.start()
