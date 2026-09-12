from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

settings = get_settings()
engine_options: dict = {"pool_pre_ping": True}
if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options.update({"pool_size": 5, "max_overflow": 5, "pool_recycle": 280})

engine = create_engine(settings.database_url, **engine_options)
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
    from app.database import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    if settings.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            inspector = inspect(engine)
            for table_name in Base.metadata.tables.keys():
                if inspector.has_table(table_name):
                    existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
                    table_obj = Base.metadata.tables[table_name]
                    for column in table_obj.columns:
                        if column.name not in existing_cols:
                            col_type = column.type.compile(engine.dialect)
                            default_clause = ""
                            if "JSON" in col_type.upper():
                                col_type = "JSON"
                                default_clause = " DEFAULT '[]'"
                            alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}{default_clause}"
                            conn.execute(text(alter_sql))
                            conn.commit()

