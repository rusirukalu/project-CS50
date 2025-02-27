#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message functions
function print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

function print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

function print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Activate virtual environment
if [ ! -d "venv" ]; then
  print_error "Virtual environment not found. Run start.sh first."
  exit 1
fi

source venv/bin/activate

# Check if pytest is installed
if ! python -c "import pytest" &> /dev/null; then
  print_header "Installing test dependencies"
  pip install pytest pytest-cov flake8
fi

# Run unit tests
print_header "Running Unit Tests"
python -m pytest -xvs tests/

if [ $? -eq 0 ]; then
  print_success "All tests passed!"
else
  print_error "Some tests failed."
  exit_code=1
fi

# Run code coverage
print_header "Running Test Coverage"
python -m pytest --cov=. tests/

# Run linting
print_header "Running Code Quality Checks"
flake8 --exclude=venv,migrations --max-line-length=100 .

if [ $? -eq 0 ]; then
  print_success "Code quality checks passed!"
else
  print_warning "Some code quality issues were found."
fi

# Show routes for API documentation
print_header "API Routes"
FLASK_APP=app.py python -c "
from app import create_app
app = create_app()
with app.app_context():
    for rule in app.url_map.iter_rules():
        print(f'{rule.endpoint}: {rule.methods} {rule.rule}')
"

# Deactivate virtual environment
deactivate

exit $exit_code
