from flask import Blueprint, request, jsonify, make_response
from flask_login import current_user, login_required
from app import db
from models.user import User
from models.project import Project
import logging

# Create blueprint
portfolio_bp = Blueprint('portfolio', __name__)

def get_base_url():
    """Helper function to get the base URL dynamically using current_app."""
    from flask import current_app
    return f"http://{current_app.config['SERVER_NAME'] or 'localhost:5001'}" if current_app.config.get('SERVER_NAME') else 'http://localhost:5001'

@portfolio_bp.route('/<username>', methods=['GET'])
def get_portfolio(username):
    """Get a user's public portfolio"""
    # Find user by username
    user = User.query.filter_by(username=username).first_or_404()
    
    # Check if portfolio is public or user is authenticated
    if not user.is_public:
        if not current_user.is_authenticated or current_user.username != username:
            return jsonify({"error": "This portfolio is private"}), 404
    
    logging.debug(f"User profile_image for {username}: {user.profile_image}")
    
    # Generate profile_image URL directly, avoiding url_for for static files that start with /static
    base_url = get_base_url()
    profile_image_url = f"{base_url}{user.profile_image}" if user.profile_image else None
    
    # Get public information
    portfolio = {
        'username': user.username,
        'name': user.name,
        'bio': user.bio,
        'profile_image': profile_image_url,
        'specialization': user.specialization,
        'email': user.email,
        'is_public': user.is_public  # Include is_public in response for frontend
    }
    
    # Get completed projects that are marked as public
    public_projects = Project.query.filter(
        Project.user_id == user.id,
        Project.status == 'completed',
        Project.is_public == True
    ).order_by(Project.created_at.desc()).limit(5).all()
    
    portfolio['projects'] = [
        {
            'title': project.title,
            'description': project.description,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None,
            'total_hours': project.total_hours or 0,
            'total_billed': project.total_billed or 0,
            'category': project.status,
            'is_public': project.is_public  # Include project is_public for consistency
        } for project in public_projects
    ]
    
    response = make_response(jsonify(portfolio), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    response.headers['Content-Type'] = 'application/json'
    
    return response

@portfolio_bp.route('/settings', methods=['GET'])
@login_required
def get_portfolio_settings():
    """Get portfolio settings for the current user"""
    # Generate profile_image URL directly, avoiding url_for for static files that start with /static
    base_url = get_base_url()
    profile_image_url = f"{base_url}{current_user.profile_image}" if current_user.profile_image else None
    
    settings = {
        'username': current_user.username,
        'name': current_user.name,
        'bio': current_user.bio,
        'profile_image': profile_image_url,
        'specialization': current_user.specialization,
        'is_public': current_user.is_public  # Include is_public in response
    }
    
    # Get projects that can be shown in portfolio (completed projects, including non-public for editing)
    completed_projects = Project.query.filter_by(
        user_id=current_user.id,
        status='completed'
    ).all()
    
    settings['projects'] = [
        {
            'id': project.id,
            'title': project.title,
            'is_public': project.is_public,
            'description': project.description,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None,
            'total_hours': project.total_hours or 0,
            'total_billed': project.total_billed or 0
        } for project in completed_projects
    ]
    
    response = make_response(jsonify(settings), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    response.headers['Content-Type'] = 'application/json'
    
    return response

@portfolio_bp.route('/settings', methods=['PUT'])
@login_required
def update_portfolio_settings():
    """Update portfolio settings for the current user"""
    data = request.get_json()
    
    # Update user profile information
    if 'bio' in data:
        current_user.bio = data['bio']
    if 'specialization' in data:
        current_user.specialization = data['specialization']
    if 'is_public' in data:  # Allow updating is_public
        current_user.is_public = bool(data['is_public'])
    
    # Update project visibility
    if 'projects' in data:
        for project_data in data['projects']:
            if 'id' in project_data and 'is_public' in project_data:
                # Verify project belongs to user
                project = Project.query.filter_by(
                    id=project_data['id'],
                    user_id=current_user.id
                ).first()
                
                if project:
                    project.is_public = bool(project_data['is_public'])  # Ensure boolean conversion
    
    db.session.commit()
    
    response = make_response(jsonify({
        "message": "Portfolio settings updated successfully"
    }), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    response.headers['Content-Type'] = 'application/json'
    
    return response