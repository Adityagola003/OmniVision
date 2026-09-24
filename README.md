# IntelliVision

AI-powered image enhancement and private photo galleries built with React, Django REST Framework, PyTorch, Real-ESRGAN, GFPGAN, and BLIP.

## Features

- Token-based signup, login, and logout
- Private user galleries with owner-protected upload and delete operations
- AI image classification with ResNet-50
- Descriptive image captions with BLIP and a classification fallback
- Real-ESRGAN super-resolution enhancement
- GFPGAN face restoration
- GPU acceleration with CUDA when available, CPU fallback otherwise
- Original/enhanced before-and-after comparison slider
- Revocable public share links
- Automatic retention of the five newest original uploads per user

## Project layout

```text
frontend/                 React + Vite application
backend/backend/         Django project and REST API
backend/backend/api/     Auth, photo, gallery, and AI pipeline code
```

## Requirements

- Node.js 18+
- Python 3.11
- CUDA-capable NVIDIA GPU is optional

Python 3.11 is recommended because the legacy BasicSR, Real-ESRGAN, and GFPGAN packages are not reliable on Python 3.13.

## Local setup

### Backend with GPU acceleration

```powershell
cd backend/backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver
```

The GPU environment uses CUDA-enabled PyTorch. If it has not been created yet:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
python -m pip install torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cu121
```

### Backend without a GPU

```powershell
cd backend/backend
.\.venv-cpu\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API runs at `http://127.0.0.1:8000`.

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

Set a deployed backend URL with:

```text
VITE_API_URL=https://your-backend-domain.example.com
```

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/signup` | Create an account and token |
| POST | `/auth/login` | Authenticate and receive a token |
| POST | `/auth/logout` | Revoke the current token |
| POST | `/process-images` | Upload and process an image |
| GET | `/gallery` | List the current user's photos |
| DELETE | `/gallery/<id>/` | Delete an owned photo |
| POST | `/gallery/<id>/share` | Create or enable a share link |
| DELETE | `/gallery/<id>/share` | Revoke a share link |
| GET | `/share/<token>` | Public shared-photo data |

Protected endpoints require:

```text
Authorization: Token <token>
```

## Deployment

Deploy the frontend as a Vite static site on Vercel or Netlify. Deploy the backend on Render, Railway, Fly.io, or a VPS with Python 3.11. Use PostgreSQL and S3-compatible object storage in production instead of SQLite and local media storage.

Backend environment variables:

```text
SECRET_KEY=<secure-random-secret>
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.example.com
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.example.com
DATABASE_URL=<postgresql-connection-string>
```

Backend start command:

```text
gunicorn backend.wsgi:application --chdir backend
```

Frontend build settings:

```text
Build command: npm run build
Output directory: dist
Environment variable: VITE_API_URL=https://your-backend-domain.example.com
```

Configure the frontend host to rewrite all routes to `index.html` so shared links work after refresh.

## Notes

Large model weights, generated media, SQLite databases, virtual environments, `node_modules`, build output, and local documentation are intentionally excluded from Git. The full architecture and viva guide is kept locally in `docs/`.
