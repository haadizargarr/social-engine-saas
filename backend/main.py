import os
import shutil
import threading
import time
import bcrypt
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import uvicorn
import jwt
import boto3
import secrets
from backend.worker import dispatch_post_payload

from backend.database import engine, Base, get_db
from backend import models, schemas

# --- CONFIGURATION MATRIX ---
SECRET_KEY = "PRODUCTION_STRONG_SECRET_KEY_KEEP_THIS_HIDDEN_IN_ENV"
ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 1

# --- SECURITY SYSTEM BOOT ---
# Using bcrypt directly — passlib 1.7.4 is incompatible with bcrypt >= 4.0
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Sync relational schemas to SQLite matrix
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Social Engine Enterprise API",
    version="1.2.0",
    description="Production-grade automation engine core managing distributed social channel buffers."
)

# --- PILLAR 1: GLOBAL MIDDLEWARE PLUGINS (CORS) ---
# Allows separate elite frontends (React, Next.js, Vite) to securely read this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In strict staging, replace with specific domain strings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PILLAR 1.5: STATIC MEDIA STORAGE ---
# Ensure the uploads directory exists
os.makedirs("backend/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

# --- SECURITY HELPER CONTROLLERS ---
def get_hashed_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRY_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Global authorization dependency check
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate session credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Active identity trace not found.")
    return user


# --- SYSTEM ROOT ROUTE ---
@app.get("/", response_class=HTMLResponse)
def serve_dashboard_ui():
    try:
        with open("backend/index.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Static layout matrix missing.")


# --- AUTHENTICATION INTERFACES ---

@app.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_identity(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_identity = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_identity:
        raise HTTPException(status_code=400, detail="Identity signature already mapped to another node.")
    
    hashed = get_hashed_password(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.TokenResponse)
def context_handshake(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    if not user:
        raise HTTPException(status_code=403, detail="Invalid access credential signature.")
    
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=403, detail="Invalid access credential signature.")
    
    access_token = create_access_token(data={"user_id": user.id, "email": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def resolve_active_session(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/admin/users", response_model=list[schemas.UserResponse])
def get_all_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    return db.query(models.User).all()

# --- PASSWORD RECOVERY ---
reset_tokens = {} # In-memory store for prototype

@app.post("/auth/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found in system.")
    
    token = secrets.token_hex(4).upper()
    reset_tokens[request.email] = token
    return {"message": "Recovery token generated.", "mock_token": token}

@app.post("/auth/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    if request.email not in reset_tokens or reset_tokens[request.email] != request.token:
        raise HTTPException(status_code=400, detail="Invalid or expired recovery token.")
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found.")
        
    user.hashed_password = get_hashed_password(request.new_password)
    db.commit()
    del reset_tokens[request.email]
    
    return {"message": "Password has been successfully reset."}

# --- CHANNELS MANAGER INTERFACES ---

@app.post("/channels", response_model=schemas.ChannelResponse, status_code=status.HTTP_201_CREATED)
def inject_channel_node(channel: schemas.ChannelCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_node = db.query(models.Channel).filter(models.Channel.handle == channel.handle).first()
    if existing_node:
        raise HTTPException(status_code=400, detail="Target handle vector already tracked inside database framework.")
    
    new_channel = models.Channel(
        platform=channel.platform, page_name=channel.page_name, handle=channel.handle, user_id=current_user.id
    )
    db.add(new_channel)
    db.commit()
    db.refresh(new_channel)
    return new_channel

@app.get("/channels", response_model=list[schemas.ChannelResponse])
def extract_assigned_nodes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Channel).filter(models.Channel.user_id == current_user.id).all()


# --- OAUTH CONNECTION INTERFACES ---

@app.get("/auth/{channel_id}/connect")
def initiate_oauth_flow(channel_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    node = db.query(models.Channel).filter(models.Channel.id == channel_id, models.Channel.user_id == current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Target terminal access block denied.")
    
    # MOCK OAUTH REDIRECT URL
    # In production, replace with: f"https://api.{node.platform.lower()}.com/oauth/authorize?client_id=..."
    redirect_url = f"http://localhost:5174/oauth-mock?channel_id={channel_id}&platform={node.platform}"
    return {"redirect_url": redirect_url}

@app.post("/auth/{channel_id}/callback")
def complete_oauth_flow(channel_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    node = db.query(models.Channel).filter(models.Channel.id == channel_id, models.Channel.user_id == current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Target terminal access block denied.")
    
    # Store mocked tokens to simulate a real OAuth completion
    node.is_connected = True
    node.oauth_token = "mock_access_token_" + str(int(time.time()))
    node.oauth_refresh_token = "mock_refresh_token"
    node.oauth_expires_at = datetime.utcnow() + timedelta(days=60)
    db.commit()
    db.refresh(node)
    return {"status": "success", "message": f"{node.platform} OAuth Handshake Complete."}


# --- MEDIA UPLOAD INTERFACES ---

@app.post("/upload")
def upload_media_payload(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    file_extension = file.filename.split(".")[-1]
    safe_filename = f"{current_user.id}_{int(time.time())}.{file_extension}"
    
    aws_key = os.getenv("AWS_ACCESS_KEY_ID")
    if aws_key:
        # S3 Enterprise Object Storage Flow
        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=aws_key,
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION", "us-east-1")
            )
            bucket = os.getenv("AWS_S3_BUCKET_NAME")
            s3.upload_fileobj(file.file, bucket, safe_filename, ExtraArgs={"ACL": "public-read"})
            return {"media_url": f"https://{bucket}.s3.amazonaws.com/{safe_filename}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"S3 Upload Failed: {str(e)}")
    else:
        # Fallback Local Storage Flow
        file_path = os.path.join("backend/uploads", safe_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"media_url": f"http://127.0.0.1:8000/uploads/{safe_filename}"}


# --- AI COPILOT ENGINE ---

@app.post("/ai/generate")
def generate_ai_copilot_content(request: schemas.AICopilotRequest, current_user: models.User = Depends(get_current_user)):
    # MOCK AI ENGINE
    # In production, uncomment the OpenAI template below and provide your API key in .env
    """
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY")
    
    system_prompt = f"You are an expert social media manager writing highly engaging content for {request.platform}."
    user_prompt = ""
    
    if request.mode == 'caption_hashtags':
        user_prompt = f"Write a captivating caption with 5 trending hashtags based on this topic: {request.prompt}"
    elif request.mode == 'professional_polish':
        user_prompt = f"Rewrite this draft to be highly professional and authoritative for LinkedIn/Twitter: {request.prompt}"
    elif request.mode == 'repurpose_thread':
        user_prompt = f"Turn this concept into a highly engaging, structured Twitter/X thread format (1/, 2/, etc.): {request.prompt}"
        
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    return {"generated_text": response.choices[0].message.content.strip()}
    """
    
    # Simulate API latency for the mock
    time.sleep(2.5)
    
    platform = request.platform
    prompt = request.prompt
    
    if request.mode == 'caption_hashtags':
        return {"generated_text": f"Here is a great {platform} caption for your post about '{prompt[:30]}...'\n\n🔥 This is going to be amazing! Stay tuned for more updates on our journey.\n\n#trending #viral #{platform.replace('/', '').lower().replace(' ', '')} #update #growth"}
    elif request.mode == 'professional_polish':
        return {"generated_text": f"We are thrilled to announce our latest developments regarding '{prompt[:30]}...'\n\nOur team has been working diligently to bring this to life, and we look forward to sharing more details with our {platform} network soon."}
    elif request.mode == 'repurpose_thread':
        return {"generated_text": f"🧵 A quick thread on: {prompt[:30]}...\n\n1/ Let's dive into the core concepts.\n\n2/ It's absolutely fascinating how this impacts the broader ecosystem.\n\n3/ What are your thoughts? Let me know below! 👇"}
    else:
        return {"generated_text": f"Generated generic {platform} content based on your prompt: {prompt}"}


# --- CRON BUFFERS AND SCHEDULER INTERFACES ---

@app.post("/channels/{channel_id}/posts", response_model=schemas.PostResponse, status_code=status.HTTP_201_CREATED)
def queue_content_payload(channel_id: int, post: schemas.PostCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    node = db.query(models.Channel).filter(models.Channel.id == channel_id, models.Channel.user_id == current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Target terminal access block denied.")
    
    if not node.is_connected:
        raise HTTPException(status_code=403, detail="OAUTH_REQUIRED: Channel must be connected via OAuth before scheduling payloads.")
    
    new_post = models.Post(
        title=post.title, caption=post.caption, media_url=post.media_url,
        content_type=post.content_type or 'post', channel_id=channel_id,
        scheduled_for=post.scheduled_for or datetime.utcnow(),
        approval_status='pending' if current_user.role == 'editor' else 'approved'
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # ── ENTERPRISE CELERY TASK DISPATCH ──
    if new_post.approval_status == 'approved':
        dispatch_post_payload.apply_async(args=[new_post.id], eta=new_post.scheduled_for)
    
    return new_post

@app.patch("/posts/{post_id}/approve", response_model=schemas.PostResponse)
def approve_post_payload(post_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Target payload not found.")
        
    post.approval_status = 'approved'
    db.commit()
    db.refresh(post)
    
    dispatch_post_payload.apply_async(args=[post.id], eta=post.scheduled_for)
    return post

@app.get("/channels/{channel_id}/posts", response_model=list[schemas.PostResponse])
def fetch_node_queue_matrix(channel_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    node = db.query(models.Channel).filter(models.Channel.id == channel_id, models.Channel.user_id == current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Target matrix access denied.")
    return db.query(models.Post).filter(models.Post.channel_id == channel_id).all()

@app.get("/posts", response_model=list[schemas.PostResponse])
def fetch_global_queue_matrix(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch all posts for channels owned by the user
    return db.query(models.Post).join(models.Channel).filter(models.Channel.user_id == current_user.id).all()





if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)