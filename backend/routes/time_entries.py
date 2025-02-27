from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from datetime import datetime, timedelta
from sqlalchemy import func

from app import db
from models.time_entry import TimeEntry
from models.project import Project

time_entries_bp = Blueprint('time_entries', __name__)

@time_entries_bp.route('/', methods=['GET'])
@login_required
def get_time_entries():
    """Get time entries with optional filtering"""
    # Get query parameters
    project_id = request.args.get('project_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    billable = request.args.get('billable')
    invoiced = request.args.get('invoiced')
    
    # Base query: only show entries for projects owned by current user
    query = db.session.query(TimeEntry).join(Project).filter(Project.user_id == current_user.id)
    
    # Apply filters
    if project_id:
        query = query.filter(TimeEntry.project_id == project_id)
    
    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(TimeEntry.date >= start_date)
        except ValueError:
            return jsonify({"error": "Invalid start date format. Use YYYY-MM-DD"}), 400
    
    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(TimeEntry.date <= end_date)
        except ValueError:
            return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD"}), 400
    
    if billable is not None:
        billable = billable.lower() == 'true'
        query = query.filter(TimeEntry.billable == billable)
    
    if invoiced is not None:
        invoiced = invoiced.lower() == 'true'
        query = query.filter(TimeEntry.invoiced == invoiced)
    
    # Order by date (newest first)
    time_entries = query.order_by(TimeEntry.date.desc()).all()
    
    return jsonify([entry.to_dict() for entry in time_entries]), 200

@time_entries_bp.route('/<int:entry_id>', methods=['GET'])
@login_required
def get_time_entry(entry_id):
    """Get a specific time entry"""
    # Get entry and verify it belongs to a project owned by current user
    entry = db.session.query(TimeEntry).join(Project).filter(
        TimeEntry.id == entry_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    return jsonify(entry.to_dict()), 200

@time_entries_bp.route('/', methods=['POST'])
@login_required
def create_time_entry():
    """Create a new time entry"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('project_id'):
        return jsonify({"error": "Project ID is required"}), 400
    
    if not data.get('hours'):
        return jsonify({"error": "Hours are required"}), 400
    
    if not data.get('description'):
        return jsonify({"error": "Description is required"}), 400
    
    # Verify project belongs to user
    project = Project.query.filter_by(id=data['project_id'], user_id=current_user.id).first()
    if not project:
        return jsonify({"error": "Invalid project ID"}), 400
    
    # Parse date if provided, otherwise use today
    entry_date = None
    if data.get('date'):
        try:
            entry_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    else:
        entry_date = datetime.utcnow().date()
    
    # Create time entry
    time_entry = TimeEntry(
        project_id=data['project_id'],
        description=data['description'],
        date=entry_date,
        hours=float(data['hours']),
        billable=data.get('billable', True),
        invoiced=False  # New entries are not invoiced by default
    )
    
    db.session.add(time_entry)
    db.session.commit()
    
    return jsonify({
        "message": "Time entry created successfully",
        "time_entry": time_entry.to_dict()
    }), 201

@time_entries_bp.route('/<int:entry_id>', methods=['PUT'])
@login_required
def update_time_entry(entry_id):
    """Update a time entry"""
    # Get entry and verify it belongs to a project owned by current user
    entry = db.session.query(TimeEntry).join(Project).filter(
        TimeEntry.id == entry_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    data = request.get_json()
    
    # Don't allow editing if already invoiced
    if entry.invoiced and (
        data.get('hours') != entry.hours or 
        data.get('billable') != entry.billable or 
        data.get('project_id') != entry.project_id
    ):
        return jsonify({
            "error": "Cannot modify hours, billable status, or project for an invoiced time entry"
        }), 400
    
    # Update project if provided
    if 'project_id' in data:
        # Verify project belongs to user
        project = Project.query.filter_by(id=data['project_id'], user_id=current_user.id).first()
        if not project:
            return jsonify({"error": "Invalid project ID"}), 400
        entry.project_id = data['project_id']
    
    # Update date if provided
    if 'date' in data:
        try:
            entry.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    
    # Update other fields
    if 'description' in data:
        entry.description = data['description']
    if 'hours' in data:
        entry.hours = float(data['hours'])
    if 'billable' in data:
        entry.billable = data['billable']
    if 'invoiced' in data:
        entry.invoiced = data['invoiced']
    
    db.session.commit()
    
    return jsonify({
        "message": "Time entry updated successfully",
        "time_entry": entry.to_dict()
    }), 200

@time_entries_bp.route('/<int:entry_id>', methods=['DELETE'])
@login_required
def delete_time_entry(entry_id):
    """Delete a time entry"""
    # Get entry and verify it belongs to a project owned by current user
    entry = db.session.query(TimeEntry).join(Project).filter(
        TimeEntry.id == entry_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    # Don't allow deletion if invoiced
    if entry.invoiced:
        return jsonify({"error": "Cannot delete an invoiced time entry"}), 400
    
    db.session.delete(entry)
    db.session.commit()
    
    return jsonify({"message": "Time entry deleted successfully"}), 200

@time_entries_bp.route('/summary', methods=['GET'])
@login_required
def time_summary():
    """Get time summary statistics"""
    # Get date range parameters
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    # Default to current month if not specified
    today = datetime.utcnow().date()
    start_date = datetime(today.year, today.month, 1).date()
    end_date = today
    
    # Parse dates if provided
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid start date format. Use YYYY-MM-DD"}), 400
    
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD"}), 400
    
    # Calculate summary statistics
    summary = {}
    
    # Total hours in date range
    hours_query = db.session.query(func.sum(TimeEntry.hours)).join(Project).filter(
        Project.user_id == current_user.id,
        TimeEntry.date >= start_date,
        TimeEntry.date <= end_date
    )
    
    summary['total_hours'] = hours_query.scalar() or 0
    
    # Billable hours and percentage
    billable_hours = db.session.query(func.sum(TimeEntry.hours)).join(Project).filter(
        Project.user_id == current_user.id,
        TimeEntry.date >= start_date,
        TimeEntry.date <= end_date,
        TimeEntry.billable == True
    ).scalar() or 0
    
    summary['billable_hours'] = billable_hours
    summary['billable_percentage'] = (billable_hours / summary['total_hours'] * 100) if summary['total_hours'] > 0 else 0
    
    # Hours by project
    project_hours = db.session.query(
        Project.id,
        Project.title,
        func.sum(TimeEntry.hours).label('hours')
    ).join(TimeEntry).filter(
        Project.user_id == current_user.id,
        TimeEntry.date >= start_date,
        TimeEntry.date <= end_date
    ).group_by(Project.id).all()
    
    summary['hours_by_project'] = [
        {'project_id': p.id, 'project_title': p.title, 'hours': p.hours}
        for p in project_hours
    ]
    
    # Hours by day (for charts)
    day_hours = []
    current_date = start_date
    while current_date <= end_date:
        hours = db.session.query(func.sum(TimeEntry.hours)).join(Project).filter(
            Project.user_id == current_user.id,
            TimeEntry.date == current_date
        ).scalar() or 0
        
        day_hours.append({
            'date': current_date.isoformat(),
            'hours': hours
        })
        
        current_date += timedelta(days=1)
    
    summary['hours_by_day'] = day_hours
    
    return jsonify(summary), 200
