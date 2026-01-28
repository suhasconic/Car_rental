# Azure Cosmos DB Setup & Deployment Guide

## Why MongoDB Client for Cosmos DB?

**Azure Cosmos DB** supports multiple APIs, including the **MongoDB API**. When you choose MongoDB API:
- Use the standard `pymongo` Python library
- Same code works locally (MongoDB) and in production (Cosmos DB)
- Just change the connection string!

```
Local:      mongodb://localhost:27017
Cosmos DB:  mongodb://your-account:key@your-account.mongo.cosmos.azure.com:10255/?ssl=true&...
```

---

## Step 1: Create Azure Cosmos DB Account

### Via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → Search "Azure Cosmos DB"
3. Select **Azure Cosmos DB for MongoDB**
4. Click **Create**

### Configuration

| Setting | Value |
|---------|-------|
| **Subscription** | Your subscription |
| **Resource Group** | Create new or use existing |
| **Account Name** | `surya-car-rental-db` (must be globally unique) |
| **Location** | Choose nearest region (e.g., Central India) |
| **Capacity mode** | **Serverless** (Free tier) or Provisioned |

5. Click **Review + Create** → **Create**
6. Wait 5-10 minutes for deployment

### Get Connection String

1. Go to your Cosmos DB account
2. **Settings** → **Connection strings**
3. Copy **PRIMARY CONNECTION STRING**

It looks like:
```
mongodb://surya-car-rental-db:LONG_KEY_HERE@surya-car-rental-db.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@surya-car-rental-db@
```

---

## Step 2: Configure Backend

### Update `.env` file

```env
# Azure Cosmos DB Connection String
MONGODB_URL=mongodb://your-account:your-key@your-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@your-account@

# Database name
DATABASE_NAME=surya_car_rental

# JWT Secret (generate a secure random string)
SECRET_KEY=your-super-secret-key-minimum-32-characters-long

# Debug mode
DEBUG=False
```

### Test Locally with Cosmos DB

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit http://localhost:8000/api/docs to test the API.

---

## Step 3: Create Azure App Service (Backend)

### Via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → **Web App**
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `surya-car-rental-api` (must be globally unique) |
| **Publish** | Code |
| **Runtime stack** | Python 3.11 |
| **Operating System** | Linux |
| **Region** | Same as Cosmos DB |
| **Pricing Plan** | Free F1 (for testing) or B1 (for production) |

4. Click **Review + Create** → **Create**

### Configure App Service

1. Go to your App Service
2. **Settings** → **Configuration** → **Application settings**
3. Add these settings:

| Name | Value |
|------|-------|
| `MONGODB_URL` | Your Cosmos DB connection string |
| `DATABASE_NAME` | `surya_car_rental` |
| `SECRET_KEY` | Your secure secret key |
| `DEBUG` | `False` |

4. **General settings** → **Startup Command**:
```
gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

5. Click **Save**

### Deploy Backend

**Option A: Azure CLI**
```powershell
cd backend
az login
az webapp up --name surya-car-rental-api --resource-group your-resource-group --runtime "PYTHON:3.11"
```

**Option B: GitHub Actions (Recommended)**

Create `.github/workflows/backend-deploy.yml`:
```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: surya-car-rental-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: backend
```

---

## Step 4: Create Azure Static Web App (Frontend)

### Via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → **Static Web App**
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `surya-car-rental` |
| **Plan type** | Free |
| **Source** | GitHub |
| **Organization/Repository** | Your repo |
| **Branch** | main |

4. Build Details:

| Setting | Value |
|---------|-------|
| **Build Presets** | React |
| **App location** | `/frontend` |
| **Output location** | `dist` |

5. Click **Review + Create** → **Create**

### Configure Environment Variable

1. Go to your Static Web App
2. **Settings** → **Configuration**
3. Add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://surya-car-rental-api.azurewebsites.net/api` |

---

## Step 5: Update CORS

In your backend App Service:

1. Go to **Settings** → **CORS**
2. Add allowed origins:
   - `https://your-static-web-app.azurestaticapps.net`
   - `http://localhost:5173` (for local development)

---

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Azure Cloud                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐        ┌─────────────────────────┐│
│  │  Azure Static Web   │        │   Azure Cosmos DB       ││
│  │       App           │        │   (MongoDB API)         ││
│  │                     │        │                         ││
│  │  React Frontend     │        │  • users collection     ││
│  │  (Vite build)       │        │  • cars collection      ││
│  │                     │        │  • bookings collection  ││
│  └─────────┬───────────┘        │  • auctions collection  ││
│            │                    │  • bids collection      ││
│            │ HTTPS              └───────────┬─────────────┘│
│            │                                │              │
│            ▼                                │              │
│  ┌─────────────────────┐                    │              │
│  │  Azure App Service  │◄───────────────────┘              │
│  │                     │     MongoDB Wire Protocol         │
│  │  FastAPI Backend    │                                   │
│  │  (Python + Gunicorn)│                                   │
│  │                     │                                   │
│  └─────────────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Test Credentials

After deployment, the database is seeded with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@surya.com | admin123 |
| User | rahul@example.com | password123 |
| User | priya@example.com | password123 |

---

## Troubleshooting

### Connection Errors
- Ensure `ssl=true` is in connection string
- Check firewall rules in Cosmos DB (allow Azure services)

### 500 Errors on App Service
- Check **Log stream** in App Service
- Verify all environment variables are set

### Frontend Can't Connect
- Check CORS settings in App Service
- Verify `VITE_API_URL` is correct in Static Web App

---

## Cost Estimate (Free Tier)

| Service | Monthly Cost |
|---------|--------------|
| Cosmos DB (Serverless, 1000 RU/s free) | $0 |
| App Service (F1 Free) | $0 |
| Static Web App (Free) | $0 |
| **Total** | **$0** |

> **Note**: Free tier has limitations. For production, consider B1 App Service ($13/month) and provisioned Cosmos DB.
