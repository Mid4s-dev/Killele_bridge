# Change this:
# from app.database import Base, SessionLocal, engine

# To this:
from app.database import Base, get_session_factory, get_engine

# Then in your script where you need the session:
SessionLocal = get_session_factory()
engine = get_engine()