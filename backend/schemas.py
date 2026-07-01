from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- CHANNEL SCHEMAS ---
class ChannelCreate(BaseModel):
    platform: str
    page_name: str
    handle: str

class ChannelResponse(BaseModel):
    id: int
    platform: str
    page_name: str
    handle: str
    is_connected: bool
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- POST SCHEMAS ---
class PostCreate(BaseModel):
    title: str
    caption: Optional[str] = None
    media_url: Optional[str] = None
    content_type: Optional[str] = 'post'
    approval_status: Optional[str] = 'pending'
    scheduled_for: Optional[datetime] = None

class PostResponse(BaseModel):
    id: int
    title: str
    caption: Optional[str]
    media_url: Optional[str]
    content_type: Optional[str]
    is_published: bool
    approval_status: str
    
    impressions: int = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0
    
    scheduled_for: datetime
    channel_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- SECURITY SCHEMAS ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

# --- AI SCHEMAS ---
class AICopilotRequest(BaseModel):
    prompt: str
    mode: str
    platform: str