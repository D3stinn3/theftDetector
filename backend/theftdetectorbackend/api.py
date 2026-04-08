from ninja_extra import NinjaExtraAPI

from alerts.api import HistoryController
from cameras.api import CamerasController
from core.api import HealthController, RoiController, SettingsController, StatsController
from faces.api import FacesController
from training.api import PlaybackController, TrainingController
from users.api import AuthController


api = NinjaExtraAPI(
    title="Theft Detector Recreated API",
    version="1.0.0",
    docs_url="/docs",
)

api.register_controllers(
    AuthController,
    HealthController,
    SettingsController,
    RoiController,
    StatsController,
    HistoryController,
    FacesController,
    CamerasController,
    PlaybackController,
    TrainingController,
)
