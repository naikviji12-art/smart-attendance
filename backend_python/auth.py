import jwt
from functools import wraps
from flask import request, jsonify
from config import Config
from models import User

def protect(f):
    """Middleware to protect routes with JWT"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Not authorized to access this route'}), 401
        
        try:
            decoded = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            user = User.query.get(decoded['id'])
            if not user:
                return jsonify({'message': 'User not found'}), 401
            request.user = decoded
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is not valid'}), 401
    
    return decorated_function

def generate_token(user_id):
    """Generate JWT token"""
    payload = {'id': int(user_id)}
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')
    return token
