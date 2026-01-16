"""
User Authentication & Database
System logowania i zarządzania API keys użytkowników
"""
from sqlalchemy import create_engine, Column, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./users.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dni


class User(Base):
    """Model użytkownika"""
    __tablename__ = "users"
    
    username = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # === PERPLEXITY ===
    perplexity_key = Column(String, default=None)
    
    # === OpenAI (ChatGPT, Copilot) ===
    openai_key = Column(String, default=None)
    
    # === Chinese LLMs ===
    deepseek_key = Column(String, default=None)
    qwen_key = Column(String, default=None)         # Alibaba Qwen (通义千问)
    
    # === Anthropic ===
    anthropic_key = Column(String, default=None)
    
    # === Google ===
    google_key = Column(String, default=None)
    
    # === Moonshot (Kimi) ===
    moonshot_key = Column(String, default=None)
    
    # === X (formerly Twitter) / Grok ===
    grok_key = Column(String, default=None)
    
    # === Custom/Agnes ===
    agnes_key = Column(String, default=None)        # Custom AI Provider
    
    # Usage tracking
    api_calls_used = Column(String, default="{}")  # JSON: {"perplexity": 10, "openai": 5, "qwen": 2}
    last_login = Column(DateTime, default=None)
    
    # Chrome Extension
    chrome_extension_id = Column(String, default=None)
    chrome_session_token = Column(String, default=None)


# Create tables
Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency dla SessionLocal"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(username: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT token"""
    to_encode = {"sub": username}
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return username"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None


def create_user(db: Session, username: str, email: str, password: str) -> User:
    """Create new user"""
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user"""
    user = get_user(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user_api_keys(db: Session, username: str, **kwargs) -> User:
    """Update user's API keys"""
    user = get_user(db, username)
    if not user:
        return None
    
    allowed_keys = [
        'perplexity_key', 'openai_key', 'deepseek_key',
        'anthropic_key', 'google_key', 'moonshot_key'
    ]
    
    for key, value in kwargs.items():
        if key in allowed_keys and value is not None:
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user


def get_user_api_keys(db: Session, username: str) -> dict:
    """Get all API keys for user"""
    user = get_user(db, username)
    if not user:
        return {}
    
    return {
        'perplexity': user.perplexity_key,
        'openai': user.openai_key,
        'deepseek': user.deepseek_key,
        'anthropic': user.anthropic_key,
        'google': user.google_key,
        'moonshot': user.moonshot_key,
    }


def update_last_login(db: Session, username: str):
    """Update last login timestamp"""
    user = get_user(db, username)
    if user:
        user.last_login = datetime.utcnow()
        db.commit()
