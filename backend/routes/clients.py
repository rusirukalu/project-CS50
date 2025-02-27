from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required

from app import db
from models.client import Client

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/', methods=['GET'])
@login_required
def get_clients():
    """Get all clients for the current user"""
    clients = Client.query.filter_by(user_id=current_user.id).all()
    return jsonify([client.to_dict() for client in clients]), 200

@clients_bp.route('/<int:client_id>', methods=['GET'])
@login_required
def get_client(client_id):
    """Get a specific client by ID"""
    client = Client.query.filter_by(id=client_id, user_id=current_user.id).first_or_404()
    return jsonify(client.to_dict()), 200

@clients_bp.route('/', methods=['POST'])
@login_required
def create_client():
    """Create a new client"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({"error": "Client name is required"}), 400
    
    # Create new client
    client = Client(
        user_id=current_user.id,
        name=data['name'],
        email=data.get('email', ''),
        phone=data.get('phone', ''),
        company=data.get('company', ''),
        address=data.get('address', ''),
        notes=data.get('notes', '')
    )
    
    db.session.add(client)
    db.session.commit()
    
    return jsonify({
        "message": "Client created successfully",
        "client": client.to_dict()
    }), 201

@clients_bp.route('/<int:client_id>', methods=['PUT'])
@login_required
def update_client(client_id):
    """Update an existing client"""
    client = Client.query.filter_by(id=client_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    # Update fields
    if 'name' in data:
        client.name = data['name']
    if 'email' in data:
        client.email = data['email']
    if 'phone' in data:
        client.phone = data['phone']
    if 'company' in data:
        client.company = data['company']
    if 'address' in data:
        client.address = data['address']
    if 'notes' in data:
        client.notes = data['notes']
    
    db.session.commit()
    
    return jsonify({
        "message": "Client updated successfully",
        "client": client.to_dict()
    }), 200

@clients_bp.route('/<int:client_id>', methods=['DELETE'])
@login_required
def delete_client(client_id):
    """Delete a client"""
    client = Client.query.filter_by(id=client_id, user_id=current_user.id).first_or_404()
    
    # Check if client has associated projects
    if client.projects.count() > 0:
        return jsonify({
            "error": "Cannot delete client with associated projects. Please delete or reassign projects first."
        }), 400
    
    db.session.delete(client)
    db.session.commit()
    
    return jsonify({"message": "Client deleted successfully"}), 200

@clients_bp.route('/search', methods=['GET'])
@login_required
def search_clients():
    """Search clients by name or company"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify([]), 200
    
    # Search by name or company
    clients = Client.query.filter(
        Client.user_id == current_user.id,
        (Client.name.ilike(f'%{query}%') | Client.company.ilike(f'%{query}%'))
    ).all()
    
    return jsonify([client.to_dict() for client in clients]), 200
