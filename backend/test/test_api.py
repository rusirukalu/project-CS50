import os
import sys
import pytest
import json
from datetime import datetime

# Add the parent directory to the path so we can import our app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from models.user import User
from models.client import Client
from models.project import Project

@pytest.fixture
def app():
    """Create and configure a Flask app for testing"""
    # Create the app with a test configuration
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test-key',
        'WTF_CSRF_ENABLED': False
    })
    
    # Create the database and the database tables
    with app.app_context():
        db.create_all()
        
        # Create a test user
        test_user = User(
            username="testuser",
            email="test@example.com",
            name="Test User",
            specialization="Web Development",
            hourly_rate=50.0
        )
        test_user.set_password("password123")
        db.session.add(test_user)
        db.session.commit()
        
        # Create a test client
        test_client = Client(
            user_id=test_user.id,
            name="Test Client",
            email="client@example.com",
            company="Test Company"
        )
        db.session.add(test_client)
        db.session.commit()
    
    yield app
    
    # Clean up
    with app.app_context():
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app"""
    return app.test_client()

@pytest.fixture
def auth_header(client):
    """Get auth header with valid token"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    token = json.loads(response.data)['token']
    return {'Authorization': f'Bearer {token}'}

def test_health_check(client):
    """Test the health check endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'

def test_login(client):
    """Test login endpoint"""
    # Test with valid credentials
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data
    assert data['user']['username'] == 'testuser'
    
    # Test with invalid credentials
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401

def test_get_user(client, auth_header):
    """Test getting user profile"""
    response = client.get('/api/auth/user', headers=auth_header)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['username'] == 'testuser'

def test_get_clients(client, auth_header):
    """Test getting clients"""
    response = client.get('/api/clients/', headers=auth_header)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]['name'] == 'Test Client'

def test_create_project(client, auth_header, app):
    """Test creating a project"""
    # Get client ID
    with app.app_context():
        client_id = Client.query.first().id
    
    # Create a project
    response = client.post('/api/projects/', 
        headers=auth_header,
        json={
            'title': 'Test Project',
            'client_id': client_id,
            'description': 'A test project',
            'status': 'active',
            'hourly_rate': 60.0
        }
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['project']['title'] == 'Test Project'
    
    # Verify it was saved
    with app.app_context():
        project = Project.query.first()
        assert project is not None
        assert project.title == 'Test Project'
        assert project.status == 'active'

def test_unauthorized_access(client):
    """Test that endpoints require authentication"""
    response = client.get('/api/clients/')
    assert response.status_code == 401
    
    response = client.get('/api/projects/')
    assert response.status_code == 401
    
    response = client.get('/api/auth/user')
    assert response.status_code == 401
