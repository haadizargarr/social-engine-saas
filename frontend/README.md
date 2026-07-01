# Social Engine SaaS Prototype

## 📝 Project Overview

A production-grade, full-stack social media automation engine built as a 3rd-year Computer Science portfolio prototype at Taylor's University. It manages distributed social channel buffers through a decoupled React SPA and Python REST API, using asynchronous task queues to handle scheduled payload dispatching.

**Current Status:** Functional Prototype

## 🛠️ Tech Stack 

- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, SQLAlchemy, bcrypt, JWT
- **DevOps & DB:** Docker Compose, PostgreSQL, Redis, Celery

## ✨ Core Features

- **User Authentication:** Secure JWT-based login with Role-Based Access Control (RBAC).
- **OAuth Channels:** Link multiple social platforms (Twitter, LinkedIn) via simulated OAuth.
- **Async Payload Dispatch:** Background Celery worker (`worker.py`) handles scheduled posts seamlessly.
- **AI Content Mock:** Generates captions, hashtags, and threads via simulated AI endpoints.
- **Analytics & Media:** Mock engagement tracking and S3-based media uploads (with local fallback).

## 💻 How to Run the Project

```bash
# 1. Start Databases
docker-compose up -d

# 2. Start Backend API
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# 3. Start Background Worker (New Terminal)
cd backend && celery -A worker celery_app worker --loglevel=info

# 4. Start Frontend (New Terminal)
cd frontend && npm install && npm run dev
```

## 📸 Visuals & Interface

*(Insert screenshots of the dashboard UI, calendar views, analytics graphs, and running terminal logs here)*