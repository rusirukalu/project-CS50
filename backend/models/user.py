from extensions import db, login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import logging

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    name = db.Column(db.String(100))
    bio = db.Column(db.Text)
    profile_image = db.Column(db.String(200))
    specialization = db.Column(db.String(100))
    hourly_rate = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=True)
    
    clients = db.relationship('Client', backref='user', lazy='dynamic')
    projects = db.relationship('Project', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        logging.debug(f"Set password for user {self.username}")
        
    def check_password(self, password):
        result = check_password_hash(self.password_hash, password)
        logging.debug(f"Password check for {self.username}: {'success' if result else 'failed'}")
        return result
    
    def to_dict(self):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'bio': self.bio,
            'profile_image': self.profile_image,
            'specialization': self.specialization,
            'hourly_rate': self.hourly_rate,
            'created_at': self.created_at.isoformat(),
            'is_public': self.is_public
        }
        logging.debug(f"User {self.username} to_dict: {data}")
        return data

@login_manager.user_loader
def load_user(id):
    user = User.query.get(int(id))
    logging.debug(f"Loaded user by ID {id}: {user.username if user else 'None'}")
    return user