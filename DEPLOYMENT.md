# Surya Car Rental - Multi-Cloud Deployment Guide

This guide provides step-by-step instructions to deploy the Surya Car Rental application on **Azure**, **AWS**, or **GCP**.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Azure Deployment](#azure-deployment)
- [AWS Deployment](#aws-deployment)
- [GCP Deployment](#gcp-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment Verification](#post-deployment-verification)

---

## Architecture Overview

The application consists of three main components:

1. **Frontend**: React + Vite static web application
2. **Backend**: FastAPI (Python) REST API with Uvicorn (ASGI)
3. **Database**: MongoDB-compatible database

---

## Prerequisites

### General Requirements
- Git installed
- Node.js 18+ and npm
- Python 3.11+
- Basic knowledge of cloud platforms

### Cloud CLI Tools
- **Azure**: [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- **AWS**: [AWS CLI](https://aws.amazon.com/cli/)
- **GCP**: [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

### Clone the Repository
```bash
git clone <your-repo-url>
cd Car_rental
```

---

## Azure Deployment

### Services Used
- **Frontend**: Azure Static Web Apps (Free Tier)
- **Backend**: Azure App Service (Free Tier F1)
- **Database**: Azure Cosmos DB for MongoDB (Free Tier)

### Step 1: Install Azure CLI
```bash
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Step 2: Login to Azure
```bash
az login
```

### Step 3: Set Subscription (if you have multiple)
```bash
az account list --output table
az account set --subscription "<your-subscription-id>"
```

### Step 4: Create Resource Group
```bash
RESOURCE_GROUP="car-rental-rg"
LOCATION="centralus"

az group create --name $RESOURCE_GROUP --location $LOCATION
```

### Step 5: Create Cosmos DB (MongoDB API)
```bash
COSMOS_ACCOUNT="car-rental-cosmos-$(date +%s)"

az cosmosdb create \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --kind MongoDB \
  --server-version "4.0" \
  --default-consistency-level Eventual \
  --enable-free-tier true \
  --locations regionName=$LOCATION failoverPriority=0 isZoneRedundant=False

# Get connection string
MONGODB_URL=$(az cosmosdb keys list --type connection-strings \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "connectionStrings[0].connectionString" -o tsv)
```

### Step 6: Deploy Backend to App Service
```bash
BACKEND_APP_NAME="car-rental-backend-$(date +%s)"
APP_SERVICE_PLAN="car-rental-plan"

# Create App Service Plan
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku F1 \
  --is-linux \
  --location $LOCATION

# Create Web App
az webapp create \
  --name $BACKEND_APP_NAME \
  --plan $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --runtime "PYTHON:3.11"

# Configure environment variables
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "MONGODB_URL=$MONGODB_URL" \
    "DATABASE_NAME=surya_car_rental" \
    "SECRET_KEY=$(openssl rand -hex 32)" \
    "DEBUG=false" \
    "SCM_DO_BUILD_DURING_DEPLOYMENT=true"

# Set startup command
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --startup-file "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Deploy backend code
cd backend
zip -r ../backend.zip .
cd ..
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --src backend.zip

# Get backend URL
BACKEND_URL=$(az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)
echo "Backend URL: https://$BACKEND_URL"
```

### Step 7: Deploy Frontend to Static Web Apps
```bash
FRONTEND_APP_NAME="car-rental-frontend"

# Create Static Web App
az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free

# Build frontend with backend URL
cd frontend
echo "VITE_API_URL=https://$BACKEND_URL/api" > .env.production
npm install
npm run build
cd ..

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.apiKey" -o tsv)

# Deploy using SWA CLI
npx -y @azure/static-web-apps-cli deploy ./frontend/dist \
  --env production \
  --deployment-token $DEPLOYMENT_TOKEN \
  --app-name $FRONTEND_APP_NAME

# Get frontend URL
FRONTEND_URL=$(az staticwebapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "defaultHostname" -o tsv)

echo "Frontend URL: https://$FRONTEND_URL"
```

### Step 8: Configure CORS
```bash
az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --allowed-origins "https://$FRONTEND_URL"
```

---

## AWS Deployment

### Services Used
- **Frontend**: AWS Amplify or S3 + CloudFront
- **Backend**: AWS Elastic Beanstalk or ECS
- **Database**: Amazon DocumentDB (MongoDB-compatible)

### Step 1: Install AWS CLI
```bash
# macOS
brew install awscli

# Windows
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Step 2: Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### Step 3: Create DocumentDB Cluster
```bash
# Create VPC and Security Group first (simplified example)
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --query 'Subnet.SubnetId' --output text)
SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --query 'Subnet.SubnetId' --output text)

# Create DB Subnet Group
aws docdb create-db-subnet-group \
  --db-subnet-group-name car-rental-subnet-group \
  --db-subnet-group-description "Car Rental DB Subnet Group" \
  --subnet-ids $SUBNET_1 $SUBNET_2

# Create DocumentDB Cluster
aws docdb create-db-cluster \
  --db-cluster-identifier car-rental-docdb \
  --engine docdb \
  --master-username admin \
  --master-user-password "YourSecurePassword123!" \
  --db-subnet-group-name car-rental-subnet-group

# Create DB Instance
aws docdb create-db-instance \
  --db-instance-identifier car-rental-instance \
  --db-instance-class db.t3.medium \
  --engine docdb \
  --db-cluster-identifier car-rental-docdb

# Get connection string
DOCDB_ENDPOINT=$(aws docdb describe-db-clusters \
  --db-cluster-identifier car-rental-docdb \
  --query 'DBClusters[0].Endpoint' --output text)

MONGODB_URL="mongodb://admin:YourSecurePassword123!@$DOCDB_ENDPOINT:27017/?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
```

### Step 4: Deploy Backend with Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
cd backend
eb init -p python-3.11 car-rental-backend --region us-east-1

# Create environment
eb create car-rental-env \
  --envvars MONGODB_URL="$MONGODB_URL",DATABASE_NAME=surya_car_rental,SECRET_KEY=$(openssl rand -hex 32),DEBUG=false

# Deploy
eb deploy

# Get backend URL
BACKEND_URL=$(eb status | grep "CNAME" | awk '{print $2}')
echo "Backend URL: http://$BACKEND_URL"
```

### Step 5: Deploy Frontend with Amplify
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in frontend
cd ../frontend
amplify init

# Build frontend
echo "VITE_API_URL=http://$BACKEND_URL/api" > .env.production
npm install
npm run build

# Add hosting
amplify add hosting
# Choose: Hosting with Amplify Console
# Choose: Manual deployment

# Publish
amplify publish

# Get frontend URL (shown in output)
```

---

## GCP Deployment

### Services Used
- **Frontend**: Firebase Hosting or Cloud Storage + Cloud CDN
- **Backend**: Cloud Run or App Engine
- **Database**: MongoDB Atlas (recommended) or Cloud Firestore

### Step 1: Install Google Cloud SDK
```bash
# macOS
brew install --cask google-cloud-sdk

# Windows
# Download from https://cloud.google.com/sdk/docs/install

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Initialize GCP
```bash
gcloud init
gcloud auth login
gcloud config set project <your-project-id>
```

### Step 3: Set Up MongoDB Atlas (Free Tier)
Since GCP doesn't have a native MongoDB service, use MongoDB Atlas:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Whitelist your IP: `0.0.0.0/0` (for testing)
4. Create database user
5. Get connection string

```bash
MONGODB_URL="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
```

### Step 4: Deploy Backend to Cloud Run
```bash
cd backend

# Create Dockerfile if not exists
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
EOF

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/<your-project-id>/car-rental-backend

# Deploy to Cloud Run
gcloud run deploy car-rental-backend \
  --image gcr.io/<your-project-id>/car-rental-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URL="$MONGODB_URL",DATABASE_NAME=surya_car_rental,SECRET_KEY=$(openssl rand -hex 32),DEBUG=false

# Get backend URL
BACKEND_URL=$(gcloud run services describe car-rental-backend --region us-central1 --format 'value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

### Step 5: Deploy Frontend to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in frontend
cd ../frontend
firebase init hosting
# Choose your project
# Public directory: dist
# Single-page app: Yes
# Automatic builds: No

# Build frontend
echo "VITE_API_URL=$BACKEND_URL/api" > .env.production
npm install
npm run build

# Deploy
firebase deploy --only hosting

# Get frontend URL (shown in output)
```

---

## Environment Variables

### Backend Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://...` |
| `DATABASE_NAME` | Database name | `surya_car_rental` |
| `SECRET_KEY` | JWT secret key (32+ chars) | Generate with `openssl rand -hex 32` |
| `DEBUG` | Debug mode | `false` for production |

### Frontend Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.com/api` |

---

## Post-Deployment Verification

### 1. Test Backend API
```bash
# Health check
curl https://your-backend-url/api/health

# Get cars
curl https://your-backend-url/api/cars

# Test login
curl -X POST "https://your-backend-url/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@surya.com&password=admin123"
```

### 2. Test Frontend
1. Open frontend URL in browser
2. Navigate to "Browse Cars" - should show 6 cars
3. Try logging in with:
   - Email: `admin@surya.com`
   - Password: `admin123`

### 3. Check Database Seeding
The application automatically seeds the database on first startup with:
- 6 users (1 admin, 5 regular users)
- 6 cars with various configurations

---

## Troubleshooting

### Backend Issues

**Problem**: Backend returns 404 for all `/api/*` routes
- **Solution**: Ensure startup command uses Uvicorn (ASGI), not Gunicorn (WSGI)
- **Azure**: Set startup file to `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`

**Problem**: PyMongo version error with Cosmos DB
- **Solution**: Use PyMongo `>=4.3.0,<4.6.0` for MongoDB 4.0 compatibility

**Problem**: Database connection timeout
- **Solution**: Check firewall rules, ensure database allows connections from your backend IP

### Frontend Issues

**Problem**: Cars not loading, "Failed to load cars" message
- **Solution**: Check that `VITE_API_URL` is set correctly and frontend was rebuilt after setting it

**Problem**: CORS errors in browser console
- **Solution**: Configure CORS on backend to allow your frontend domain

### Database Issues

**Problem**: Database not seeding
- **Solution**: Check backend logs for connection errors, verify `MONGODB_URL` is correct

---

## Cost Optimization

### Free Tier Limits
- **Azure**: Cosmos DB (1000 RU/s), App Service (F1), Static Web Apps (100 GB bandwidth)
- **AWS**: DocumentDB (not free), Elastic Beanstalk (t2.micro free for 12 months)
- **GCP**: Cloud Run (2M requests/month), Firebase Hosting (10 GB storage)

### Recommendations
- Use MongoDB Atlas Free Tier (512 MB) for development
- Monitor usage to avoid unexpected charges
- Set up billing alerts on all platforms

---

## Security Best Practices

1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Use strong passwords**: Generate with `openssl rand -hex 32`
3. **Enable HTTPS**: All cloud platforms provide free SSL certificates
4. **Restrict CORS**: Only allow your frontend domain
5. **Database security**: 
   - Use strong passwords
   - Enable SSL/TLS
   - Whitelist only necessary IPs
6. **Regular updates**: Keep dependencies up to date

---

## Additional Resources

- [Azure Documentation](https://docs.microsoft.com/azure)
- [AWS Documentation](https://docs.aws.amazon.com)
- [GCP Documentation](https://cloud.google.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review cloud provider documentation
3. Check application logs for error details
4. Verify all environment variables are set correctly

---

**Last Updated**: February 2026
