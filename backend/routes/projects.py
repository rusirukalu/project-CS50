from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from datetime import datetime
import logging

from app import db
from models.project import Project
from models.client import Client

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
@login_required
def get_projects():
    status = request.args.get('status')
    client_id = request.args.get('client_id')
    is_public = request.args.get('is_public')
    
    query = Project.query.filter_by(user_id=current_user.id)
    
    if status:
        query = query.filter_by(status=status)
    if client_id:
        query = query.filter_by(client_id=client_id)
    if is_public is not None:
        is_public_bool = is_public.lower() == 'true'
        query = query.filter_by(is_public=is_public_bool)
    
    projects = query.all()
    return jsonify([project.to_dict() for project in projects]), 200

@projects_bp.route('/<int:project_id>', methods=['GET'])
@login_required
def get_project(project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
    return jsonify(project.to_dict()), 200

@projects_bp.route('/', methods=['POST'])
@login_required
def create_project():
    try:
        data = request.get_json()
        logging.debug(f"Received project data: {data}")
        
        if not data.get('title'):
            return jsonify({"error": "Project title is required"}), 400
        
        if not data.get('client_id'):
            return jsonify({"error": "Client ID is required"}), 400
        
        client = Client.query.filter_by(id=data['client_id'], user_id=current_user.id).first()
        if not client:
            return jsonify({"error": "Invalid client ID"}), 400
        
        start_date = None
        end_date = None
        
        if data.get('start_date'):
            try:
                start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid start date format. Use YYYY-MM-DD"}), 400
        
        if data.get('end_date'):
            try:
                end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD"}), 400
        
        project = Project(
            user_id=current_user.id,
            client_id=data['client_id'],
            title=data['title'],
            description=data.get('description', ''),
            status=data.get('status', 'pending'),
            start_date=start_date,
            end_date=end_date,
            hourly_rate=data.get('hourly_rate'),
            fixed_price=data.get('fixed_price'),
            total_hours=0.0,  # Explicit default
            total_billed=0.0  # Explicit default
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            "message": "Project created successfully",
            "project": project.to_dict()
        }), 201
    except Exception as e:
        logging.error(f"Error creating project: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    if 'client_id' in data:
        client = Client.query.filter_by(id=data['client_id'], user_id=current_user.id).first()
        if not client:
            return jsonify({"error": "Invalid client ID"}), 400
        project.client_id = data['client_id']
    
    if 'start_date' in data:
        try:
            project.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        except ValueError:
            return jsonify({"error": "Invalid start date format. Use YYYY-MM-DD"}), 400
    
    if 'end_date' in data:
        try:
            project.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        except ValueError:
            return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD"}), 400
    
    if 'title' in data:
        project.title = data['title']
    if 'description' in data:
        project.description = data['description']
    if 'status' in data:
        project.status = data['status']
    if 'hourly_rate' in data:
        project.hourly_rate = data['hourly_rate']
    if 'fixed_price' in data:
        project.fixed_price = data['fixed_price']
    if 'is_public' in data:
        project.is_public = data['is_public']
    
    db.session.commit()
    
    return jsonify({
        "message": "Project updated successfully",
        "project": project.to_dict()
    }), 200

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
    
    db.session.delete(project)
    db.session.commit()
    
    return jsonify({"message": "Project deleted successfully"}), 200

@projects_bp.route('/stats', methods=['GET'])
@login_required
def project_stats():
    stats = {
        'total': Project.query.filter_by(user_id=current_user.id).count(),
        'by_status': {}
    }
    
    statuses = ['pending', 'active', 'completed', 'cancelled']
    for status in statuses:
        stats['by_status'][status] = Project.query.filter_by(
            user_id=current_user.id, status=status
        ).count()
    
    recent_projects = Project.query.filter_by(user_id=current_user.id).order_by(
        Project.created_at.desc()
    ).limit(5).all()
    
    stats['recent_projects'] = [project.to_dict() for project in recent_projects]
    
    stats['public_projects_count'] = Project.query.filter_by(
        user_id=current_user.id, 
        is_public=True
    ).count()
    
    return jsonify(stats), 200

@projects_bp.route('/<int:project_id>/toggle-public', methods=['POST'])
@login_required
def toggle_project_public(project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
    
    if request.json.get('is_public') and project.status != 'completed':
        return jsonify({
            "error": "Only completed projects can be made public in your portfolio"
        }), 400
    
    project.is_public = request.json.get('is_public', not project.is_public)
    db.session.commit()
    
    return jsonify({
        "message": f"Project visibility {'enabled' if project.is_public else 'disabled'} for portfolio",
        "project": project.to_dict()
    }), 200
