import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Define base directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Create instance directory if it doesn't exist
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
os.makedirs(INSTANCE_DIR, exist_ok=True)

# Create uploads directory if it doesn't exist
UPLOADS_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(INSTANCE_DIR, 'freelance.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = UPLOADS_DIR
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
