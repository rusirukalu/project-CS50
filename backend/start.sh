#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print a message with a colored prefix
function print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

function print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

function print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
  print_error "Python 3 is not installed. Please install Python 3 and try again."
  exit 1
fi

# Check if virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
  print_message "Virtual environment not found. Creating..."
  python3 -m venv venv
  if [ $? -ne 0 ]; then
    print_error "Failed to create virtual environment."
    exit 1
  fi
  print_message "Virtual environment created."
else
  print_message "Using existing virtual environment."
fi

# Activate virtual environment
print_message "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
  print_error "Failed to activate virtual environment."
  exit 1
fi

# Install dependencies
print_message "Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
  print_error "Failed to install dependencies."
  exit 1
fi

# Check if .env file exists, create if it doesn't
if [ ! -f ".env" ]; then
  print_message "Creating .env file..."
  cat > .env << EOF
SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(24))")
FLASK_APP=app.py
FLASK_ENV=development
EOF
  print_message ".env file created with a random secret key."
else
  print_message "Using existing .env file."
fi

# Create necessary directories
print_message "Creating necessary directories..."
mkdir -p static/uploads
mkdir -p static/documents
mkdir -p instance

# Run database migrations
print_message "Running database migrations..."
python migrations.py
if [ $? -ne 0 ]; then
  print_warning "Database migration may have encountered issues."
fi

# Ask if user wants to seed the database
read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_message "Seeding database..."
  python seed.py
  if [ $? -ne 0 ]; then
    print_warning "Database seeding may have encountered issues."
  fi
fi

# Start the server
print_message "Starting the server..."
python run.py --host 0.0.0.0 --port 5001 --env dev

# This script won't actually reach here because the server will keep running
# But it's good practice to include deactivation
deactivate
