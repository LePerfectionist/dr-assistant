from sqlmodel import SQLModel, create_engine, Session
from .settings import settings

engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    from .models import User, Application, RunbookDocument, System  # import all models
    SQLModel.metadata.create_all(engine)
