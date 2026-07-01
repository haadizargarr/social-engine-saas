from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default='editor')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    channels = relationship("Channel", back_populates="owner", cascade="all, delete-orphan")


class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, nullable=False)  # e.g., "Instagram", "Pinterest"
    page_name = Column(String, nullable=False) # e.g., "theon3piece"
    handle = Column(String, unique=True, index=True, nullable=False)
    is_connected = Column(Boolean, default=False)
    oauth_token = Column(String, nullable=True)
    oauth_refresh_token = Column(String, nullable=True)
    oauth_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="channels")

    # Link posts to this channel
    posts = relationship("Post", back_populates="channel", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    media_url = Column(String, nullable=True)
    content_type = Column(String, nullable=True, default='post')
    is_published = Column(Boolean, default=False)
    approval_status = Column(String, default='pending')
    
    # Analytics Metrics
    impressions = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    
    scheduled_for = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Foreign key linking directly to the Channel table
    channel_id = Column(Integer, ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    channel = relationship("Channel", back_populates="posts")