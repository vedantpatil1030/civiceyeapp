# CivicEye Backend Deployment Guide

## Option 1: MongoDB Atlas + Railway.app (Free)

### 1. MongoDB Atlas Setup
1. Go to https://www.mongodb.com/atlas
2. Sign up for free account
3. Create new cluster (M0 Sandbox - Free)
4. In Security > Network Access: Add IP (0.0.0.0/0 for now)
5. In Security > Database Access: Create user
6. Get connection string from Connect button

### 2. Update .env file
Replace your MONGODB_URI with the Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/civiceye_db?retryWrites=true&w=majority
```

### 3. Deploy to Railway.app
1. Push your backend folder to GitHub
2. Go to https://railway.app
3. Sign up with GitHub
4. Create new project from GitHub repo
5. Add environment variables in Railway dashboard
6. Deploy automatically

### 4. Update React Native API URL
In src/services/api.js, change API_BASE_URL to your Railway URL:
```
const API_BASE_URL = 'https://your-app-name.railway.app/api';
```

## Option 2: Supabase (PostgreSQL - Alternative)

### 1. Supabase Setup
1. Go to https://supabase.com
2. Create new project
3. Get your API URL and anon key
4. Update backend to use PostgreSQL instead of MongoDB

### 2. Migration needed
- Install: npm install pg
- Update models to use PostgreSQL syntax
- Update connection logic

## Testing Steps

### For Physical Device:
1. Ensure phone and laptop are on same WiFi
2. Start backend: npm run dev
3. Use laptop IP in API_BASE_URL
4. Test app on device

### For Production:
1. Deploy backend to Railway/Render
2. Use MongoDB Atlas for database
3. Update API_BASE_URL to production URL
4. Build and test app

## Current Configuration

Your current setup:
- Local IP: 192.168.222.194
- Backend Port: 3000
- Database: MongoDB (local)

Next steps:
1. Set up MongoDB Atlas
2. Test with Atlas locally
3. Deploy backend to Railway
4. Update app to use production URLs
