# CivicEye Backend API

A backend server for the CivicEye mobile application, providing user management, issue reporting, and community feed functionality.

## Features

- User authentication (register/login)
- Issue reporting with image uploads
- Community feed with location-based filtering
- User profile management
- Issue upvoting and commenting
- Dashboard analytics
- Geospatial queries for nearby issues

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### User Endpoints

#### GET `/api/users/profile`
Get current user's profile (requires authentication)

#### PUT `/api/users/profile`
Update user profile (requires authentication)
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "bio": "Active citizen",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "pincode": "62701"
}
```

#### GET `/api/users/dashboard`
Get user dashboard data with statistics (requires authentication)

#### DELETE `/api/users/account`
Delete user account (requires authentication)
```json
{
  "password": "currentpassword"
}
```

### Issue Endpoints

#### POST `/api/issues`
Create a new issue (requires authentication)
- Supports multipart/form-data for image uploads
```json
{
  "title": "Broken streetlight",
  "description": "The streetlight on Main St is not working",
  "category": "INFRASTRUCTURE",
  "priority": "MEDIUM",
  "location": {"lat": 40.7128, "lng": -74.0060},
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "pincode": "62701",
  "visibility": "PUBLIC",
  "tags": ["streetlight", "safety"]
}
```

#### GET `/api/issues/feed`
Get personalized community feed (requires authentication)
- Query parameters: `page`, `limit`, `latitude`, `longitude`, `radius`, `category`, `includeResolved`

#### GET `/api/issues`
Get all issues with filters (requires authentication)
- Query parameters: `page`, `limit`, `category`, `status`, `priority`, `latitude`, `longitude`, `radius`, `search`, `sortBy`, `sortOrder`

#### GET `/api/issues/my`
Get current user's issues (requires authentication)
- Query parameters: `page`, `limit`, `status`, `category`, `sortBy`, `sortOrder`

#### GET `/api/issues/:id`
Get specific issue by ID (requires authentication)

#### PUT `/api/issues/:id`
Update an issue (requires authentication, user must own the issue)

#### POST `/api/issues/:id/upvote`
Upvote or remove upvote from an issue (requires authentication)

#### POST `/api/issues/:id/comment`
Add a comment to an issue (requires authentication)
```json
{
  "text": "I have the same problem in my area"
}
```

#### DELETE `/api/issues/:id`
Delete an issue (requires authentication, user must own the issue)

#### GET `/api/issues/stats/summary`
Get issue statistics (requires authentication)

#### GET `/api/issues/stats/category`
Get statistics by category (requires authentication)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update MongoDB connection string
   - Set JWT secret
   - Configure upload settings

3. **Start MongoDB**
   Make sure MongoDB is running on your system

4. **Run the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Test the API**
   The server will run on `http://localhost:3000`

## Environment Variables

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/civiceye_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Default Admin Configuration
DEFAULT_ADMIN_EMAIL=admin@civiceye.com
DEFAULT_ADMIN_PASSWORD=admin123
```

## Database Models

### User Model
- Basic info: name, email, password
- Profile: phone, bio, avatar, address
- Location: city, state, pincode, coordinates
- Preferences: notifications, privacy settings
- Stats: issue counts, verification status

### Issue Model
- Core: title, description, category, priority
- Location: coordinates, address details
- Media: image uploads support
- Social: upvotes, comments
- Tracking: status, timestamps, reporter

## Security Features

- JWT authentication
- Rate limiting
- Helmet security headers
- Input validation
- Password hashing with bcrypt
- File upload restrictions

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Issue Categories

- `INFRASTRUCTURE` - Roads, bridges, utilities
- `CLEANLINESS` - Waste, sanitation
- `SAFETY` - Crime, lighting, hazards
- `TRANSPORT` - Public transport, traffic
- `ENVIRONMENT` - Pollution, parks
- `GOVERNANCE` - Administrative issues
- `OTHER` - Miscellaneous

## Issue Priorities

- `LOW` - Minor issues
- `MEDIUM` - Moderate importance (default)
- `HIGH` - Important issues
- `CRITICAL` - Urgent issues

## Issue Status (Admin-managed)

- `PENDING` - Newly reported (default)
- `IN_PROGRESS` - Being worked on
- `RESOLVED` - Issue fixed
- `CLOSED` - Issue closed without resolution
