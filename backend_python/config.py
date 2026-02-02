import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    # Database configuration - uses SQLite by default, can change to PostgreSQL, MySQL, etc.
    # SQLite: sqlite:///loginpage.db
    # PostgreSQL: postgresql://user:password@localhost/loginpage
    # MySQL: mysql+pymysql://user:password@localhost/loginpage
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///loginpage.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
    JWT_EXPIRE = os.getenv('JWT_EXPIRE', '7d')
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_ENV') == 'development'
