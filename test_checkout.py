import intasend
from app.config import get_settings
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

settings = get_settings()
client = intasend.APIService(
    token=settings.intasend_secret_key,
    publishable_key=settings.intasend_publishable_key,
    test=settings.intasend_test_mode
)
try:
    res = client.collect.checkout(email="test@kilelebridge.co.ke", amount=10.0, currency="KES")
    print("Response keys:", res.keys())
    print("Response:", res)
except Exception as e:
    print("Error:", e)
