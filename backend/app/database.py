# from sqlmodel import SQLModel, create_engine, Session
# from sqlalchemy.orm import sessionmaker
# from .settings import settings
# from sqlmodel import Session
# from sqlmodel import SQLModel, create_engine, Session
# from .models.update_requests import UpdateRequest

# # Create SQLAlchemy engine
# engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)

# # Create session maker
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# def get_session():
#     with Session(engine) as session:  
#         yield session

# # Initialize DB
# def init_db():
#     from .models import User, Application, RunbookDocument, System, UpdateRequest  # import all models
#     SQLModel.metadata.create_all(engine)
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.orm import sessionmaker
from .settings import settings

# Create SQLAlchemy engine
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session():
    with Session(engine) as session:  
        yield session

# Initialize DB
def init_db():
    SQLModel.metadata.create_all(engine)  # This will create all tables