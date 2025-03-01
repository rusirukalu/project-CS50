from flask import Blueprint, request, jsonify, url_for, make_response, current_app
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime, timedelta
import jwt
import logging

from app import db
from models.user import User
from auth_middleware import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    logging.debug("Register endpoint hit with data: %s", request.get_json())
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        logging.debug(f"Username {data['username']} already taken")
        return jsonify({"error": "Username already taken"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        logging.debug(f"Email {data['email']} already registered")
        return jsonify({"error": "Email already registered"}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        name=data.get('name', ''),
        specialization=data.get('specialization', ''),
        hourly_rate=data.get('hourly_rate', 0.0)
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    try:
        db.session.commit()
        logging.debug("User committed: %s", user.id)
    except Exception as e:
        db.session.rollback()
        logging.error("Commit failed: %s", str(e))
        return jsonify({"error": "Failed to save user"}), 500
    
    login_user(user, remember=True)
    token = generate_token(user.id)
    logging.debug(f"Generated token for user {user.username}: {token}")
    
    response = make_response(jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user.to_dict()
    }), 201)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

@auth_bp.route('/login', methods=['POST'])
def login():
    logging.debug(f"Login attempt with data: {request.get_json()}")
    
    if current_user.is_authenticated:
        logout_user()
        logging.debug(f"Logged out previous user: {current_user.username}")
    
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user is None or not user.check_password(data['password']):
        logging.debug(f"Login failed for username: {data['username']}")
        return jsonify({"error": "Invalid username or password"}), 401
    
    login_user(user, remember=data.get('remember', False))
    token = generate_token(user.id)
    logging.debug(f"Logged in user {user.username} with token: {token}")
    
    response = make_response(jsonify({"token": token, "user": user.to_dict()}), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logging.debug(f"Logging out user: {current_user.username}")
    logout_user()
    response = make_response(jsonify({"message": "Logged out successfully"}), 200)
    response.set_cookie('session', '', expires=0)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@auth_bp.route('/user', methods=['GET'])
@login_required
def get_user():
    logging.debug(f"Fetching user data for: {current_user.username}")
    response = make_response(jsonify(current_user.to_dict()), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@auth_bp.route('/user', methods=['PUT'])
@login_required
def update_user():
    logging.debug(f"Updating user {current_user.username} with data: {request.get_json()}")
    data = request.get_json()
    
    if 'name' in data:
        current_user.name = data['name']
    if 'email' in data:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != current_user.id:
            logging.debug(f"Email {data['email']} already in use by another user")
            return jsonify({"error": "Email already in use"}), 400
        current_user.email = data['email']
    if 'bio' in data:
        current_user.bio = data['bio']
    if 'specialization' in data:
        current_user.specialization = data['specialization']
    if 'hourly_rate' in data:
        current_user.hourly_rate = float(data['hourly_rate']) if data['hourly_rate'] else 0.0
    
    db.session.commit()
    logging.debug(f"User {current_user.username} updated successfully")
    
    response = make_response(jsonify({
        "message": "User updated successfully",
        "user": current_user.to_dict()
    }), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

@auth_bp.route('/user/password', methods=['PUT'])
@login_required
def change_password():
    logging.debug(f"Password change request for {current_user.username}")
    data = request.get_json()
    
    if not current_user.check_password(data['current_password']):
        logging.debug(f"Current password incorrect for {current_user.username}")
        return jsonify({"error": "Current password is incorrect"}), 400
    
    current_user.set_password(data['new_password'])
    db.session.commit()
    logging.debug(f"Password updated for {current_user.username}")
    
    response = make_response(jsonify({"message": "Password updated successfully"}), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

@auth_bp.route('/user/profile-image', methods=['POST'])
@login_required
def upload_profile_image():
    logging.debug(f"Profile image upload request for {current_user.username}")
    if 'profile_image' not in request.files:
        return jsonify({"error": "No profile image provided"}), 400
    
    file = request.files['profile_image']
    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    filename = secure_filename(file.filename)
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex}_{filename}"
    upload_folder = os.path.join(current_app.root_path, 'static/uploads/profile_images')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, unique_filename)
    
    file.save(file_path)
    logging.debug(f"Image saved at: {file_path}")
    
    image_url = f"/static/uploads/profile_images/{unique_filename}"
    current_user.profile_image = image_url
    db.session.commit()
    logging.debug(f"Updated profile_image for user {current_user.username}: {image_url}")
    
    response = make_response(jsonify({
        "message": "Profile image uploaded successfully",
        "image_url": f"http://localhost:5001{image_url}"
    }), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response