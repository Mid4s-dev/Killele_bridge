import argparse
import os
import sys

# Make the app package importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import get_settings
from intasend import APIService

def main():
    parser = argparse.ArgumentParser(description="Test IntaSend STK Push")
    parser.add_argument("--phone", required=True, help="Phone number to send STK push to (e.g. 2547XXXXXXXX)")
    parser.add_argument("--amount", type=float, default=10.0, help="Amount to charge (default: 10.0)")
    args = parser.parse_args()

    settings = get_settings()

    if not settings.intasend_publishable_key or not settings.intasend_secret_key:
        print("ERROR: INTASEND_PUBLISHABLE_KEY or INTASEND_SECRET_KEY missing in .env")
        sys.exit(1)

    print(f"Using IntaSend Mode: {'TEST' if settings.intasend_test_mode else 'LIVE'}")
    print(f"Publishable Key: {settings.intasend_publishable_key[:15]}...")

    client = APIService(
        publishable_key=settings.intasend_publishable_key,
        token=settings.intasend_secret_key,
        test=settings.intasend_test_mode,
    )

    print(f"Initiating STK push to {args.phone} for {args.amount} KES...")
    try:
        response = client.collect.mpesa_stk_push(
            phone_number=args.phone,
            email="test@kilelebridge.co.ke", # email is required by IntaSend SDK
            amount=args.amount,
            narrative="Test STK Push",
        )
        print("STK Push initiated successfully!")
        print("Response:", response)
    except Exception as e:
        print("ERROR:", str(e))

if __name__ == "__main__":
    main()
