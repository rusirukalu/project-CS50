from app import db
from datetime import datetime

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))
    file_size = db.Column(db.Integer)  # Size in bytes
    document_type = db.Column(db.String(20))  # contract, proposal, invoice, other
    description = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'document_type': self.document_type,
            'description': self.description,
            'uploaded_at': self.uploaded_at.isoformat()
        }
