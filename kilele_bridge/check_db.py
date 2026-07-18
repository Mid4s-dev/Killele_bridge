from app.database import get_engine
from sqlalchemy import text
engine = get_engine()
with engine.connect() as conn:
    res = conn.execute(text("SHOW COLUMNS FROM users WHERE Field='role'")).fetchone()
    print(res)
