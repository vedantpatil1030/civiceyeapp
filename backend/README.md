# Quick Setup Instructions

## Option 1: Install MongoDB Locally (Recommended)
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run automatically on localhost:27017

## Option 2: Use MongoDB Atlas (Cloud - Free)
1. Go to https://www.mongodb.com/atlas
2. Create free account
3. Create a free cluster
4. Get connection string and update .env file

## Starting the Backend
1. Open a new terminal
2. Navigate to backend folder: `cd backend`
3. Start the server: `npm run dev` or `npm start`

## Testing the API
The backend will run on http://localhost:3000

### Test endpoints:
- GET http://localhost:3000/ (health check)
- POST http://localhost:3000/api/auth/register
- POST http://localhost:3000/api/auth/login

## React Native Configuration
- For Android Emulator: Use `http://localhost:3000/api`
- For Physical Device: Replace `localhost` with your computer's IP address in src/services/api.js

## Troubleshooting
- If MongoDB connection fails, the server will still start but database operations will fail
- Check that port 3000 is not in use
- Make sure Metro bundler (React Native) is running on port 8081
