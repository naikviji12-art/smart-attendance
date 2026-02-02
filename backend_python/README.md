# Student Attendance System - Python Backend (SQL)

This is a Python/Flask version of the Student Attendance System backend using SQL databases.

## Setup Instructions

### 1. Install Python (if not already installed)
Download from https://www.python.org/downloads/

### 2. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# OR
source venv/bin/activate  # On macOS/Linux
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Create a `.env` file in the project root:
```
# SQLite (default)
DATABASE_URL=sqlite:///loginpage.db

# OR PostgreSQL
DATABASE_URL=postgresql://user:password@localhost/loginpage

# OR MySQL
DATABASE_URL=mysql+pymysql://user:password@localhost/loginpage

JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
PORT=5000
FLASK_ENV=development
```

### 5. Run the Server
```bash
python app.py
```

The server will start at `http://localhost:5000`

## Database Configuration

### SQLite (Default - No Setup Required)
Perfect for local development:
```
DATABASE_URL=sqlite:///loginpage.db
```

### PostgreSQL
Install PostgreSQL and create a database:
```bash
pip install psycopg2-binary
```

```
DATABASE_URL=postgresql://username:password@localhost:5432/loginpage
```

### MySQL
Install MySQL and create a database:
```bash
pip install pymysql
```

```
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/loginpage
```

## Database Initialization

Tables are automatically created when you run the app for the first time. No manual migration needed!

## API Endpoints

### Authentication Routes

#### Register
- **POST** `/api/auth/register`
- Body: `{ username, email, password, confirmPassword }`

#### Login
- **POST** `/api/auth/login`
- Body: `{ email, password }`

#### Get Current User
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`

### Student Routes (All require authentication)

#### Add Student
- **POST** `/api/students/add`
- Body: `{ name, class, image, mobileNumber, address }`

#### Get All Students
- **GET** `/api/students?search=<term>`

#### Get Single Student
- **GET** `/api/students/<studentId>`

#### Mark Attendance
- **POST** `/api/students/<studentId>/attendance`
- Body: `{ date, status }`

#### Delete Student
- **DELETE** `/api/students/<studentId>`

#### Get Statistics
- **GET** `/api/students/stats`

#### Get Class-wise Attendance
- **GET** `/api/students/class-wise`

## Key Differences from MongoDB Version

- Uses SQLAlchemy ORM instead of PyMongo
- Automatic table creation on startup
- Support for multiple databases (SQLite, PostgreSQL, MySQL)
- Referential integrity with foreign keys
- Better type safety with defined schemas
- Simpler query syntax with SQLAlchemy

## Project Structure

```
backend_python/
├── app.py                 # Main Flask application
├── config.py             # Configuration management
├── database.py           # SQLAlchemy setup
├── models.py             # User & Student ORM models
├── auth.py               # JWT authentication
├── routes_auth.py        # Auth endpoints
├── routes_students.py    # Student endpoints
├── requirements.txt      # Dependencies
├── .env.example         # Environment template
└── README.md            # This file
```

## Models

### User
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- created_at
- updated_at
- Relationship: students

### Student
- id (Primary Key)
- name
- class_name
- image
- mobile_number
- address
- user_id (Foreign Key → User)
- present (Count)
- absent (Count)
- created_at
- updated_at
- Relationship: attendance_records

### AttendanceRecord
- id (Primary Key)
- student_id (Foreign Key → Student)
- date
- status (present/absent)
- time
- created_at
