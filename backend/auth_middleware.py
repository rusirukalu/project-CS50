from flask import request, jsonify, current_app, g
from flask_login import login_user, logout_user
from werkzeug.local import LocalProxy
from functools import wraps
import jwt
from datetime import datetime, timedelta
from models.user import User
import logging

current_user = LocalProxy(lambda: g.get('_current_user', None))

def _get_current_user():
    """Get the current user from the JWT token in request header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logging.debug("No valid Authorization header found")
        return None
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(
            token,
            current_app.config.get('SECRET_KEY'),
            algorithms=['HS256']
        )
        exp_timestamp = payload.get('exp')
        if exp_timestamp and datetime.utcfromtimestamp(exp_timestamp) < datetime.utcnow():
            logging.debug("Token expired")
            return None
        
        user_id = payload.get('sub')
        if user_id is None:
            logging.debug("No user_id in token payload")
            return None
        
        user = User.query.get(user_id)
        if user:
            logout_user()  # Clear any existing session
            login_user(user)
            g._current_user = user
            logging.debug(f"Synced user from token: {user.username}")
        else:
            logging.debug(f"No user found for ID: {user_id}")
        return user
    except jwt.InvalidTokenError as e:
        logging.debug(f"Invalid token: {str(e)}")
        return None

def generate_token(user_id):
    """Generate a new JWT token for a user"""
    payload = {
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow(),
        'sub': user_id
    }
    token = jwt.encode(
        payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )
    return token

def jwt_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = _get_current_user()
        if user is None:
            return jsonify({
                "error": "Unauthorized",
                "message": "Valid authentication token is required"
            }), 401
        return f(*args, **kwargs)
    return decorated

def init_auth_middleware(app):
    """Initialize authentication middleware for the app"""
    @app.before_request
    def load_user():
        g._current_user = _get_current_user()