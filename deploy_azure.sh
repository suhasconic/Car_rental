#!/bin/bash
set -e

# Configuration variables
RESOURCE_GROUP="car-rental-rg-free"
RG_LOCATION="eastus"
LOCATION="centralus"
# Use the ACR created in the previous run
ACR_NAME="carrentalacr14882"
POSTGRES_SERVER="car-rental-db-free-$RANDOM"
BACKEND_APP_NAME="car-rental-backend"
FRONTEND_APP_NAME="car-rental-frontend"

echo "Starting Azure Deployment (Free Tier)..."

# 1. Create Resource Group
echo "Creating Resource Group: $RESOURCE_GROUP..."
az group create --name $RESOURCE_GROUP --location $RG_LOCATION

# 2. Create Azure Container Registry (ACR)
echo "Creating ACR: $ACR_NAME..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Login to ACR (Skipped as we don't have local docker)
# az acr login --name $ACR_NAME

# 3. Build and Push Backend Image (SKIPPED - ACR Tasks not allowed)
# echo "Building and pushing Backend Docker image..."
# az acr build --registry $ACR_NAME --image $BACKEND_APP_NAME:latest ./backend

# 4. Create Cosmos DB (MongoDB API)
COSMOS_ACCOUNT="car-rental-cosmos-17837"
echo "Creating Azure Cosmos DB Account: $COSMOS_ACCOUNT..."
# Check if it exists first
if ! az cosmosdb show --resource-group $RESOURCE_GROUP --name $COSMOS_ACCOUNT > /dev/null 2>&1; then
    az cosmosdb create \
        --name $COSMOS_ACCOUNT \
        --resource-group $RESOURCE_GROUP \
        --kind MongoDB \
        --server-version "4.0" \
        --default-consistency-level Eventual \
        --enable-free-tier true \
        --locations regionName=$LOCATION failoverPriority=0 isZoneRedundant=False
fi

# Get MongoDB Connection String
echo "Retrieving MongoDB Connection String..."
MONGODB_URL=$(az cosmosdb keys list --type connection-strings --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --query "connectionStrings[0].connectionString" -o tsv)

# 5. Create App Service Plan (Free Tier F1) and Web App
APP_SERVICE_PLAN="car-rental-plan-free"
echo "Creating App Service Plan: $APP_SERVICE_PLAN..."
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --sku F1 --is-linux --location $LOCATION

echo "Creating Web App: $BACKEND_APP_NAME..."
az webapp create --name $BACKEND_APP_NAME --plan $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --runtime "PYTHON:3.11"

# Configure Settings
echo "Configuring Web App Settings..."
az webapp config appsettings set --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP \
    --settings "MONGODB_URL=$MONGODB_URL" "DATABASE_NAME=surya_car_rental" "SECRET_KEY=super-secret-key-prod" "DEBUG=false" \
    "SCM_DO_BUILD_DURING_DEPLOYMENT=true"

# Configure Start Up Command explicitly
echo "Configuring Startup Command..."
az webapp config set --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME --startup-file "uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Deploy Backend Code (Zip Deploy)
echo "Deploying Backend Code..."
cd backend
zip -r ../backend.zip .
cd ..
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME --src backend.zip

# Get Backend URL
BACKEND_URL=$(az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)
echo "Backend URL: https://$BACKEND_URL"

# 6. Build and Deploy Frontend
echo "Building and Deploying Frontend..."
cd frontend
npm install

# Build with Environment Variables
export VITE_API_URL="https://$BACKEND_APP_NAME.azurewebsites.net/api"
echo "Building Frontend (VITE_API_URL=$VITE_API_URL)..."
# Write to .env.production to ensure Vite picks it up
echo "VITE_API_URL=$VITE_API_URL" > .env.production
npm run build
cd ..

# Create Static Web App Resource
az staticwebapp create \
    --name $FRONTEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Free

# Get Deployment Token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv)

# Deploy using SWA CLI (using npx to avoid global install)
echo "Deploying to Static Web App..."
npx -y @azure/static-web-apps-cli deploy ./frontend/dist --env production --deployment-token $DEPLOYMENT_TOKEN --app-name $FRONTEND_APP_NAME

FRONTEND_URL=$(az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" -o tsv)
echo "Frontend URL: https://$FRONTEND_URL"

# Update Backend CORS (Update Container App)
echo "Updating Backend CORS to allow Frontend..."
# JSON string for CORS policy can be tricky in CLI, will try simplest update or env var if app handles it.
# Our app handles CORS via CORS_ORIGINS env var.
# Our app handles CORS via CORS_ORIGINS env var, but we also configure App Service CORS.
az webapp cors add --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME --allowed-origins "https://$FRONTEND_URL"

echo "Deployment Script Completed!"
echo "Backend: https://$BACKEND_URL"
echo "Frontend: https://$FRONTEND_URL"
echo "Database: Cosmos DB ($COSMOS_ACCOUNT)"
