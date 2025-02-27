from flask import Blueprint, request, jsonify, current_app, send_file
from flask_login import current_user, login_required
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
import io
import pdfkit  # For PDF generation - you'll need to install this: pip install pdfkit

from app import db
from models.invoice import Invoice, InvoiceItem
from models.project import Project
from models.client import Client
from models.time_entry import TimeEntry

invoices_bp = Blueprint('invoices', __name__)

@invoices_bp.route('/', methods=['GET'])
@login_required
def get_invoices():
    """Get invoices with optional filtering"""
    # Get query parameters
    project_id = request.args.get('project_id', type=int)
    client_id = request.args.get('client_id', type=int)
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query: only show invoices for projects owned by current user
    query = db.session.query(Invoice).join(Project).filter(Project.user_id == current_user.id)
    
    # Apply filters
    if project_id:
        query = query.filter(Invoice.project_id == project_id)
    
    if client_id:
        query = query.join(Project.client).filter(Client.id == client_id)
    
    if status:
        query = query.filter(Invoice.status == status)
    
    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Invoice.issue_date >= start_date)
        except ValueError:
            return jsonify({"error": "Invalid start date format. Use YYYY-MM-DD"}), 400
    
    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Invoice.issue_date <= end_date)
        except ValueError:
            return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD"}), 400
    
    # Order by issue date (newest first)
    invoices = query.order_by(Invoice.issue_date.desc()).all()
    
    return jsonify([invoice.to_dict() for invoice in invoices]), 200

@invoices_bp.route('/<int:invoice_id>', methods=['GET'])
@login_required
def get_invoice(invoice_id):
    """Get a specific invoice"""
    # Get invoice and verify it belongs to a project owned by current user
    invoice = db.session.query(Invoice).join(Project).filter(
        Invoice.id == invoice_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    return jsonify(invoice.to_dict()), 200

@invoices_bp.route('/', methods=['POST'])
@login_required
def create_invoice():
    """Create a new invoice"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('project_id'):
        return jsonify({"error": "Project ID is required"}), 400
    
    # Verify project belongs to user
    project = Project.query.filter_by(id=data['project_id'], user_id=current_user.id).first()
    if not project:
        return jsonify({"error": "Invalid project ID"}), 400
    
    # Generate unique invoice number (format: INV-{user_id}-{current_year}-{sequential_number})
    # Get the count of invoices for this user this year
    current_year = datetime.utcnow().year
    invoice_count = db.session.query(Invoice).join(Project).filter(
        Project.user_id == current_user.id,
        Invoice.invoice_number.like(f'INV-{current_user.id}-{current_year}-%')
    ).count()
    
    invoice_number = f'INV-{current_user.id}-{current_year}-{invoice_count + 1:04d}'
    
    # Parse dates
    issue_date = datetime.utcnow().date()
    if data.get('issue_date'):
        try:
            issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid issue date format. Use YYYY-MM-DD"}), 400
    
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid due date format. Use YYYY-MM-DD"}), 400
    
    # Create invoice
    invoice = Invoice(
        project_id=data['project_id'],
        invoice_number=invoice_number,
        issue_date=issue_date,
        due_date=due_date,
        status=data.get('status', 'draft'),
        notes=data.get('notes', '')
    )
    
    db.session.add(invoice)
    db.session.commit()
    
    # Add invoice items
    if data.get('items'):
        for item_data in data['items']:
            item = InvoiceItem(
                invoice_id=invoice.id,
                description=item_data.get('description', ''),
                quantity=item_data.get('quantity', 1),
                unit_price=item_data.get('unit_price', 0)
            )
            db.session.add(item)
    
    # Optionally add time entries as invoice items
    if data.get('include_time_entries') and data.get('time_entry_ids'):
        time_entries = TimeEntry.query.filter(
            TimeEntry.id.in_(data['time_entry_ids']),
            TimeEntry.project_id == project.id,
            ~TimeEntry.invoiced
        ).all()
        
        for entry in time_entries:
            # Add as invoice item
            item = InvoiceItem(
                invoice_id=invoice.id,
                description=f"Time: {entry.description} ({entry.date.isoformat()})",
                quantity=entry.hours,
                unit_price=project.hourly_rate or current_user.hourly_rate or 0
            )
            db.session.add(item)
            
            # Mark time entry as invoiced
            entry.invoiced = True
    
    db.session.commit()
    
    return jsonify({
        "message": "Invoice created successfully",
        "invoice": invoice.to_dict()
    }), 201

@invoices_bp.route('/<int:invoice_id>', methods=['PUT'])
@login_required
def update_invoice(invoice_id):
    """Update an invoice"""
    # Get invoice and verify it belongs to a project owned by current user
    invoice = db.session.query(Invoice).join(Project).filter(
        Invoice.id == invoice_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    data = request.get_json()
    
    # Don't allow editing if invoice is paid
    if invoice.status == 'paid' and data.get('status') != 'paid':
        return jsonify({"error": "Cannot modify a paid invoice"}), 400
    
    # Update fields
    if 'issue_date' in data:
        try:
            invoice.issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid issue date format. Use YYYY-MM-DD"}), 400
    
    if 'due_date' in data:
        try:
            invoice.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
        except ValueError:
            return jsonify({"error": "Invalid due date format. Use YYYY-MM-DD"}), 400
    
    if 'status' in data:
        invoice.status = data['status']
    
    if 'notes' in data:
        invoice.notes = data['notes']
    
    # Update items if provided
    if 'items' in data:
        # Remove existing items
        for item in invoice.items:
            db.session.delete(item)
        
        # Add new items
        for item_data in data['items']:
            item = InvoiceItem(
                invoice_id=invoice.id,
                description=item_data.get('description', ''),
                quantity=item_data.get('quantity', 1),
                unit_price=item_data.get('unit_price', 0)
            )
            db.session.add(item)
    
    db.session.commit()
    
    return jsonify({
        "message": "Invoice updated successfully",
        "invoice": invoice.to_dict()
    }), 200

@invoices_bp.route('/<int:invoice_id>', methods=['DELETE'])
@login_required
def delete_invoice(invoice_id):
    """Delete an invoice"""
    # Get invoice and verify it belongs to a project owned by current user
    invoice = db.session.query(Invoice).join(Project).filter(
        Invoice.id == invoice_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    # Don't allow deletion if invoice is paid
    if invoice.status == 'paid':
        return jsonify({"error": "Cannot delete a paid invoice"}), 400
    
    # Unmark time entries as invoiced
    for item in invoice.items:
        # Check if this item was from a time entry (description starts with "Time:")
        if item.description.startswith("Time:"):
            # Extract date from the description
            try:
                # Format: "Time: description (YYYY-MM-DD)"
                date_str = item.description.split('(')[1].split(')')[0]
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                
                # Find time entries that match
                time_entries = TimeEntry.query.filter(
                    TimeEntry.project_id == invoice.project_id,
                    TimeEntry.date == date,
                    TimeEntry.invoiced == True
                ).all()
                
                for entry in time_entries:
                    entry.invoiced = False
            except (IndexError, ValueError):
                pass
    
    db.session.delete(invoice)
    db.session.commit()
    
    return jsonify({"message": "Invoice deleted successfully"}), 200

@invoices_bp.route('/<int:invoice_id>/pdf', methods=['GET'])
@login_required
def generate_invoice_pdf(invoice_id):
    """Generate a PDF invoice"""
    # Get invoice and verify it belongs to a project owned by current user
    invoice = db.session.query(Invoice).join(Project).filter(
        Invoice.id == invoice_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    # Get project and client info
    project = Project.query.get(invoice.project_id)
    client = Client.query.get(project.client_id)
    
    # Generate HTML for the PDF
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .invoice-header {{ display: flex; justify-content: space-between; }}
            .invoice-title {{ font-size: 24px; font-weight: bold; margin-bottom: 20px; }}
            .section {{ margin-bottom: 20px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
            .total {{ font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="invoice-header">
            <div>
                <div class="invoice-title">INVOICE</div>
                <div>Invoice #: {invoice.invoice_number}</div>
                <div>Issue Date: {invoice.issue_date.strftime('%B %d, %Y')}</div>
                <div>Due Date: {invoice.due_date.strftime('%B %d, %Y') if invoice.due_date else 'N/A'}</div>
            </div>
            <div>
                <div><strong>{current_user.name}</strong></div>
                <div>{current_user.email}</div>
            </div>
        </div>
        
        <div class="section">
            <div><strong>Bill To:</strong></div>
            <div>{client.name}</div>
            <div>{client.company}</div>
            <div>{client.address}</div>
            <div>{client.email}</div>
        </div>
        
        <div class="section">
            <div><strong>Project:</strong> {project.title}</div>
        </div>
        
        <div class="section">
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    # Add invoice items to HTML
    for item in invoice.items:
        html += f"""
                    <tr>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>${item.unit_price:.2f}</td>
                        <td>${item.total:.2f}</td>
                    </tr>
        """
    
    # Add total and notes
    html += f"""
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="total">Total</td>
                        <td class="total">${invoice.total_amount:.2f}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="section">
            <div><strong>Notes:</strong></div>
            <div>{invoice.notes}</div>
        </div>
    </body>
    </html>
    """
    
    # Generate PDF from HTML
    try:
        pdf = pdfkit.from_string(html, False)
        
        # Return PDF file
        return send_file(
            io.BytesIO(pdf),
            mimetype='application/pdf',
            download_name=f'invoice_{invoice.invoice_number}.pdf',
            as_attachment=True
        )
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {str(e)}"}), 500

@invoices_bp.route('/stats', methods=['GET'])
@login_required
def invoice_stats():
    """Get statistics about invoices"""
    # Total invoiced amount
    total_invoiced = db.session.query(
        db.func.sum(InvoiceItem.quantity * InvoiceItem.unit_price)
    ).join(Invoice).join(Project).filter(
        Project.user_id == current_user.id
    ).scalar() or 0
    
    # Total paid amount
    total_paid = db.session.query(
        db.func.sum(InvoiceItem.quantity * InvoiceItem.unit_price)
    ).join(Invoice).join(Project).filter(
        Project.user_id == current_user.id,
        Invoice.status == 'paid'
    ).scalar() or 0
    
        # Count invoices by status
    status_counts = {}
    for status in ['draft', 'sent', 'paid', 'overdue']:
        count = db.session.query(Invoice).join(Project).filter(
            Project.user_id == current_user.id,
            Invoice.status == status
        ).count()
        status_counts[status] = count
    
    # Recent invoices
    recent_invoices = db.session.query(Invoice).join(Project).filter(
        Project.user_id == current_user.id
    ).order_by(Invoice.issue_date.desc()).limit(5).all()
    
    # Overdue invoices
    today = datetime.utcnow().date()
    overdue_invoices = db.session.query(Invoice).join(Project).filter(
        Project.user_id == current_user.id,
        Invoice.status.in_(['sent']),
        Invoice.due_date < today
    ).all()
    
    stats = {
        'total_invoiced': total_invoiced,
        'total_paid': total_paid,
        'pending_payment': total_invoiced - total_paid,
        'by_status': status_counts,
        'recent_invoices': [inv.to_dict() for inv in recent_invoices],
        'overdue_invoices': [inv.to_dict() for inv in overdue_invoices],
        'overdue_count': len(overdue_invoices)
    }
    
    return jsonify(stats), 200

@invoices_bp.route('/<int:invoice_id>/mark-paid', methods=['POST'])
@login_required
def mark_invoice_paid(invoice_id):
    """Mark an invoice as paid"""
    # Get invoice and verify it belongs to a project owned by current user
    invoice = db.session.query(Invoice).join(Project).filter(
        Invoice.id == invoice_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    # Update status to paid
    invoice.status = 'paid'
    db.session.commit()
    
    return jsonify({
        "message": "Invoice marked as paid",
        "invoice": invoice.to_dict()
    }), 200

@invoices_bp.route('/<int:invoice_id>/mark-sent', methods=['POST'])
@login_required
def mark_invoice_sent(invoice_id):
    """Mark an invoice as sent"""
    # Get invoice and verify it belongs to a project owned by current user
    invoice = db.session.query(Invoice).join(Project).filter(
        Invoice.id == invoice_id,
        Project.user_id == current_user.id
    ).first_or_404()
    
    # Update status to sent
    invoice.status = 'sent'
    db.session.commit()
    
    return jsonify({
        "message": "Invoice marked as sent",
        "invoice": invoice.to_dict()
    }), 200

@invoices_bp.route('/from-time', methods=['POST'])
@login_required
def create_invoice_from_time():
    """Create an invoice from unbilled time entries"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('project_id'):
        return jsonify({"error": "Project ID is required"}), 400
    
    # Verify project belongs to user
    project = Project.query.filter_by(id=data['project_id'], user_id=current_user.id).first()
    if not project:
        return jsonify({"error": "Invalid project ID"}), 400
    
    # Find unbilled time entries for this project
    query = TimeEntry.query.filter(
        TimeEntry.project_id == project.id,
        TimeEntry.billable == True,
        TimeEntry.invoiced == False
    )
    
    # Apply date range filter if provided
    if data.get('start_date'):
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            query = query.filter(TimeEntry.date >= start_date)
        except ValueError:
            return jsonify({"error": "Invalid start date format. Use YYYY-MM-DD"}), 400
    
    if data.get('end_date'):
        try:
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            query = query.filter(TimeEntry.date <= end_date)
        except ValueError:
            return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD"}), 400
    
    time_entries = query.all()
    
    if not time_entries:
        return jsonify({"error": "No unbilled time entries found for this project"}), 400
    
    # Generate unique invoice number
    current_year = datetime.utcnow().year
    invoice_count = db.session.query(Invoice).join(Project).filter(
        Project.user_id == current_user.id,
        Invoice.invoice_number.like(f'INV-{current_user.id}-{current_year}-%')
    ).count()
    
    invoice_number = f'INV-{current_user.id}-{current_year}-{invoice_count + 1:04d}'
    
    # Create invoice
    invoice = Invoice(
        project_id=project.id,
        invoice_number=invoice_number,
        issue_date=datetime.utcnow().date(),
        due_date=(datetime.utcnow() + timedelta(days=30)).date(),
        status='draft',
        notes=data.get('notes', f'Invoice for time worked on {project.title}')
    )
    
    db.session.add(invoice)
    db.session.commit()
    
    # Group time entries by date for better organization
    entries_by_date = {}
    for entry in time_entries:
        date_str = entry.date.strftime('%Y-%m-%d')
        if date_str not in entries_by_date:
            entries_by_date[date_str] = []
        entries_by_date[date_str].append(entry)
    
    # Add time entries as invoice items, grouped by date
    for date_str, entries in entries_by_date.items():
        total_hours = sum(entry.hours for entry in entries)
        descriptions = [entry.description for entry in entries]
        
        # Create a single invoice item for each date
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=f"Work on {date_str}: {', '.join(descriptions)}",
            quantity=total_hours,
            unit_price=project.hourly_rate or current_user.hourly_rate or 0
        )
        db.session.add(item)
        
        # Mark all time entries as invoiced
        for entry in entries:
            entry.invoiced = True
    
    db.session.commit()
    
    return jsonify({
        "message": "Invoice created successfully from time entries",
        "invoice": invoice.to_dict()
    }), 201
