from app import db
from datetime import datetime

class TimeEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    hours = db.Column(db.Float, nullable=False)
    billable = db.Column(db.Boolean, default=True)
    invoiced = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'hours': self.hours,
            'billable': self.billable,
            'invoiced': self.invoiced,
            'created_at': self.created_at.isoformat()
        }
