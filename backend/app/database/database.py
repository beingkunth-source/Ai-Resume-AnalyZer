from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import get_settings

settings = get_settings()
db_url = settings.database_url
engine_options: dict = {"pool_pre_ping": True}

if db_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    # Disable prepared statements for PostgreSQL PgBouncer transaction poolers
    engine_options.update({
        "pool_size": 5,
        "max_overflow": 5,
        "pool_recycle": 280,
        "connect_args": {"prepare_threshold": None},
    })

try:
    engine = create_engine(db_url, **engine_options)
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"Primary DB connection failed ({e}). Falling back to local SQLite app.db database.")
    db_url = "sqlite:///./app.db"
    engine_options = {"pool_pre_ping": True, "connect_args": {"check_same_thread": False}}
    engine = create_engine(db_url, **engine_options)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import logging
    logger = logging.getLogger(__name__)
    from app.database import models  # noqa: F401

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as create_err:
        logger.warning(f"Base.metadata.create_all non-fatal notice: {create_err}")

    try:
        with engine.connect() as conn:
            try:
                inspector = inspect(conn)
                for table_name in Base.metadata.tables.keys():
                    try:
                        if inspector.has_table(table_name):
                            existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
                            table_obj = Base.metadata.tables[table_name]
                            for column in table_obj.columns:
                                if column.name not in existing_cols:
                                    col_type = column.type.compile(engine.dialect)
                                    default_clause = ""
                                    if "JSON" in str(col_type).upper():
                                        if "sqlite" in engine.dialect.name:
                                            col_type = "JSON"
                                            default_clause = " DEFAULT '[]'"
                                        else:
                                            col_type = "JSONB"
                                            default_clause = " DEFAULT '[]'::jsonb"
                                    alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}{default_clause}"
                                    try:
                                        conn.execute(text(alter_sql))
                                        conn.commit()
                                    except Exception as alter_err:
                                        logger.warning(f"Could not add missing column {column.name} to {table_name}: {alter_err}")
                    except Exception as table_err:
                        logger.warning(f"Table inspection skipped for {table_name}: {table_err}")
            except Exception as inspect_err:
                logger.warning(f"Inspector initialization skipped: {inspect_err}")
    except Exception as exc:
        logger.warning(f"Column check during init_db skipped: {exc}")

    # Seed initial demo accounts if not present
    try:
        from app.database.models import User
        from app.core.security import hash_password
        from sqlalchemy import select
        with SessionLocal() as db:
            demo_accounts = [
                ("Alex Morgan", "alex.morgan.dev@gmail.com", "password123"),
                ("Demo User", "demo@example.com", "password123"),
                ("Sarah Chen", "sarah.chen@linkedin-user.com", "password123"),
            ]
            for name, email, password in demo_accounts:
                existing = db.scalar(select(User).where(User.email == email))
                if not existing:
                    db.add(User(name=name, email=email, password_hash=hash_password(password)))
            db.commit()
    except Exception as seed_err:
        logger.warning(f"Demo user seeding skipped or failed: {seed_err}")




