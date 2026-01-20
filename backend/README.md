# Login Page Backend

A Node.js/Express backend server for user authentication with login and signup functionality.

## Features

- User registration with validation
- User login with JWT authentication
- Password hashing with bcrypt
- MongoDB database integration
- CORS enabled for frontend communication
- Protected routes with JWT middleware

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loginpage
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRE=7d
```

3. Start the server:
```bash
npm run dev    # Development with auto-reload
npm start      # Production mode
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### Register User
- **POST** `/api/auth/register`
- **Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```
- **Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Get Current User (Protected)
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-20T00:00:00.000Z",
    "updatedAt": "2024-01-20T00:00:00.000Z"
  }
}
```

#### Health Check
- **GET** `/api/health`
- **Response:**
```json
{
  "message": "Server is running"
}
```

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database configuration
├── controllers/
│   └── authController.js  # Auth logic
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   └── User.js            # User schema and model
├── routes/
│   └── auth.js            # Auth routes
├── .env.example           # Environment variables example
├── .gitignore
├── package.json
├── README.md
└── server.js              # Main server file
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRE` - JWT expiration time (default: 7d)

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing

## Error Handling

The server returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `409` - Conflict (User already exists)
- `500` - Server Error

## Notes

- Passwords are hashed using bcrypt before storing in the database
- JWT tokens expire after 7 days by default
- All timestamps are in ISO 8601 format
- Email and username must be unique
