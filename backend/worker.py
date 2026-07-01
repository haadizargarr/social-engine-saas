import os
import time
from datetime import datetime
from celery import Celery
from dotenv import load_dotenv

# We import the models and Session generator from our core engine
from backend.database import SessionLocal
from backend import models

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize the Celery Application (The Enterprise Worker Daemon)
celery_app = Celery(
    "social_engine_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Optional: Configuration for robust enterprise features like retry delays
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_acks_late=True, # Ensure tasks are fully executed before acknowledging
)

@celery_app.task(bind=True, max_retries=3)
def dispatch_post_payload(self, post_id: int):
    """
    This task handles the actual dispatching of the payload to external platform APIs.
    It runs entirely in the background, freeing up the main FastAPI thread.
    """
    db = SessionLocal()
    try:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if not post:
            return f"Payload {post_id} not found. Drop task."
            
        if post.is_published:
            return f"Payload {post_id} already published. Drop task."
        
        # In a real production scenario, you would inspect post.channel_id
        # and make external HTTP calls to LinkedIn, Twitter, etc. using their APIs.
        print(f"📦 [CELERY WORKER] Dispatching Payload ID {post.id} -> '{post.title}' to Target Node ID {post.channel_id}")
        
        # Simulate API network latency
        time.sleep(2)
        
        import random
        
        # Mark as published
        post.is_published = True
        
        # MOCK METRICS GENERATION
        # In a real app, this would be updated via webhooks or polling the social platforms
        post.impressions = random.randint(1000, 15000)
        post.likes = int(post.impressions * random.uniform(0.05, 0.15))
        post.shares = int(post.likes * random.uniform(0.1, 0.3))
        post.comments = int(post.likes * random.uniform(0.05, 0.2))
        
        db.commit()
        return f"Payload {post_id} successfully dispatched with {post.impressions} impressions."
        
    except Exception as e:
        print(f"🚨 [CELERY CRITICAL] Failed to dispatch payload {post_id}: {str(e)}")
        # Retry with exponential backoff if external API fails
        db.rollback()
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()
