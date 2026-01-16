"""
Authentication Schemas dla Pydantic
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """User registration request"""
    username: str
    email: EmailStr
    password: str
    
    class Config:
        example = {
            "username": "john_doe",
            "email": "john@example.com",
            "password": "secure_password_123"
        }


class UserLogin(BaseModel):
    """User login request"""
    username: str
    password: str
    
    class Config:
        example = {
            "username": "john_doe",
            "password": "secure_password_123"
        }


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str
    username: str
    
    class Config:
        example = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "username": "john_doe"
        }


class UserProfile(BaseModel):
    """User profile response"""
    username: str
    email: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class APIKeysUpdate(BaseModel):
    """Update API keys request"""
    perplexity_key: Optional[str] = None
    openai_key: Optional[str] = None
    deepseek_key: Optional[str] = None
    anthropic_key: Optional[str] = None
    google_key: Optional[str] = None
    moonshot_key: Optional[str] = None
    
    class Config:
        example = {
            "perplexity_key": "pplx-xxxxxxxx...",
            "openai_key": "sk-xxxxxxxx...",
        }


class APIKeysResponse(BaseModel):
    """API keys response (masked)"""
    perplexity: Optional[str]
    openai: Optional[str]
    deepseek: Optional[str]
    anthropic: Optional[str]
    google: Optional[str]
    moonshot: Optional[str]
    
    def mask_keys(self):
        """Mask API keys for security"""
        for key in ['perplexity', 'openai', 'deepseek', 'anthropic', 'google', 'moonshot']:
            if getattr(self, key):
                value = getattr(self, key)
                masked = value[:10] + "..." + value[-5:] if len(value) > 15 else "***"
                setattr(self, key, masked)
        return self
