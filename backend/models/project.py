from app import db
from datetime import datetime

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    hourly_rate = db.Column(db.Float)
    fixed_price = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    total_hours = db.Column(db.Float, default=0.0)
    total_billed = db.Column(db.Float, default=0.0)
    is_public = db.Column(db.Boolean, default=False)
    
    time_entries = db.relationship('TimeEntry', backref='project', lazy='dynamic', cascade="all, delete-orphan")
    invoices = db.relationship('Invoice', backref='project', lazy='dynamic', cascade="all, delete-orphan")
    documents = db.relationship('Document', backref='project', lazy='dynamic', cascade="all, delete-orphan")
    
    def total_hours_method(self):
        return sum(entry.hours for entry in self.time_entries)
    
    def total_billed_method(self):
        if self.fixed_price:
            return self.fixed_price
        return self.total_hours * (self.hourly_rate or 0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'client_id': self.client_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'hourly_rate': self.hourly_rate,
            'fixed_price': self.fixed_price,
            'created_at': self.created_at.isoformat(),
            'total_hours': self.total_hours,
            'total_billed': self.total_billed,
            'is_public': self.is_public
        }