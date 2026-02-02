from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

def connect_db(app):
    """Initialize database"""
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        print('Database connected and tables created successfully')

def get_db():
    """Get database instance"""
    return db

def close_db():
    """Close database connection"""
    pass  # SQLAlchemy handles this automatically
