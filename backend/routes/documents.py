from flask import Blueprint, request, jsonify, current_app, send_file
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

from app import db
from models.document import Document
from models.project import Project

documents_bp = Blueprint('documents', __name__)

# Helper function to check allowed file extensions
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('/', methods=['GET'])
@login_required
def get_documents():
    """Get documents with optional filtering"""
    # Get query parameters
    project_id = request.args.get('project_id', type=int)
    document_type = request.args.get('document_type')
    
    # Base query: only show documents for projects owned by current user
    query = db.session.query(Document).join(Project).filter(Project.user_id == current_user.id)
    
    # Apply filters
    if project_id:
        query = query.filter(Document.project_id == project_id)
    
    if document_type:
        query = query.filter(Document.document_type == document_type)
    
    # Order by most recently uploaded
    documents = query.order_by(Document.uploaded_at.desc()).all()
    
    return jsonify([document.to_dict() for document in documents]), 200

@documents_bp.route('/<int:document_id>', methods=['GET'])
@login_required
def get_document(document_id):
    """Get a specific document"""
    # Get document and verify it belongs to a project owned by current user
    document = db.session.query(Document).join(Project).filter(
        Document.id == document_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    return jsonify(document.to_dict()), 200

@documents_bp.route('/<int:document_id>/download', methods=['GET'])
@login_required
def download_document(document_id):
    """Download a document file"""
    # Get document and verify it belongs to a project owned by current user
    document = db.session.query(Document).join(Project).filter(
        Document.id == document_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    # Check if file exists
    if not os.path.isfile(document.file_path):
        return jsonify({"error": "File not found"}), 404
    
    # Return file for download
    return send_file(
        document.file_path,
        as_attachment=True,
        download_name=document.name
    )

@documents_bp.route('/', methods=['POST'])
@login_required
def upload_document():
    """Upload a new document"""
    # Check if project_id is provided
    project_id = request.form.get('project_id')
    if not project_id:
        return jsonify({"error": "Project ID is required"}), 400
    
    # Verify project belongs to user
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()
    if not project:
        return jsonify({"error": "Invalid project ID"}), 400
    
    # Check if file part exists
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    # Check if file was selected
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400
    
    # Create unique filename
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    
    # Ensure upload directory exists
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'documents')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the file
    file_path = os.path.join(upload_dir, unique_filename)
    file.save(file_path)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Create document record
    document = Document(
        project_id=project_id,
        name=request.form.get('name') or original_filename,
        file_path=file_path,
        file_type=file_extension,
        file_size=file_size,
        document_type=request.form.get('document_type', 'other'),
        description=request.form.get('description', '')
    )
    
    db.session.add(document)
    db.session.commit()
    
    return jsonify({
        "message": "Document uploaded successfully",
        "document": document.to_dict()
    }), 201

@documents_bp.route('/<int:document_id>', methods=['PUT'])
@login_required
def update_document(document_id):
    """Update document metadata"""
    # Get document and verify it belongs to a project owned by current user
    document = db.session.query(Document).join(Project).filter(
        Document.id == document_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    data = request.get_json()
    
    # Update fields
    if 'name' in data:
        document.name = data['name']
    if 'document_type' in data:
        document.document_type = data['document_type']
    if 'description' in data:
        document.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        "message": "Document updated successfully",
        "document": document.to_dict()
    }), 200

@documents_bp.route('/<int:document_id>', methods=['DELETE'])
@login_required
def delete_document(document_id):
    """Delete a document"""
    # Get document and verify it belongs to a project owned by current user
    document = db.session.query(Document).join(Project).filter(
        Document.id == document_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    # Get file path before deleting record
    file_path = document.file_path
    
    # Delete from database
    db.session.delete(document)
    db.session.commit()
    
    # Delete file from filesystem
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError as e:
        # Log the error but don't fail the request
        print(f"Error deleting file: {e}")
    
    return jsonify({"message": "Document deleted successfully"}), 200

@documents_bp.route('/types', methods=['GET'])
@login_required
def get_document_types():
    """Get list of document types"""
    # Common document types for freelance work
    types = [
        "contract",
        "proposal",
        "invoice",
        "specification",
        "design",
        "report",
        "other"
    ]
    
    return jsonify(types), 200
