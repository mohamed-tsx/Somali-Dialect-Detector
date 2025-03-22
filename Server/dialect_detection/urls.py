# dialect_detection/urls.py
from django.urls import path
from .views import PredictDialect

urlpatterns = [
    path('predict/', PredictDialect.as_view(), name='predict-dialect'),
]
