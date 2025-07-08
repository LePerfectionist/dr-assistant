# from fastapi import APIRouter, Depends, HTTPException
# from sqlmodel import Session, select
# from app.database import get_session
# from app.models.user import User
# from app.schema import UserCreate, UserResponse

# router = APIRouter(prefix="/auth", tags=["Authentication"])

# @router.post("/login", response_model=UserResponse)
# def login_or_create_user(user_data: UserCreate, session: Session = Depends(get_session)):
#     """
#     Finds a user by email. If they don't exist, a new user is created.
#     This is a simplified authentication for now.
#     """
#     # Check if user already exists
#     statement = select(User).where(User.email == user_data.email)
#     existing_user = session.exec(statement).first()

#     if existing_user:
#         return existing_user

#     # If not, create a new user
#     new_user = User.from_orm(user_data) # Create a User model from the Pydantic schema
#     session.add(new_user)
#     session.commit()
#     session.refresh(new_user)
#     return new_user

# in app/routers/auth.py

from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from sqlmodel import Session, select

from app.database import get_session
from app.models.user import User
from app.schema import UserResponse # Assuming you have this schema

# --- Configuration ---
# IMPORTANT: Move this to your settings.py or environment variables in a real app!
SECRET_KEY = "a-very-secret-key-that-you-should-change" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Token expires in 1 hour

# --- Security Utils ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login") # The URL of our login endpoint

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """Creates a new JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependency to get current user ---
def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    """Decodes token, validates user, and returns the User object."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # The 'sub' (subject) of the token is the user's email
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get the user from the database
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user

# --- Router ---
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    """Handles user registration."""
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
    
    # Create new user with a hashed password
    new_user = User(
        name=name,
        email=email,
        password=get_password_hash(password)
    )
    session.add(new_user)
    session.commit()
    
    return {"message": "User created successfully. Please login."}

@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """
    Handles user login. Takes email in the 'username' field.
    Returns a JWT access token.
    """
    # Note: OAuth2PasswordRequestForm uses the field name "username" by standard
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create and return the access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """A test endpoint to get the current logged-in user's details."""
    return current_user