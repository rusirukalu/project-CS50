import os
import sys
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash

# Add the current directory to the path so we can import our app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from models.user import User
from models.client import Client
from models.project import Project
from models.time_entry import TimeEntry
from models.invoice import Invoice, InvoiceItem

def seed_database():
    """Seed the database with test data"""
    app = create_app()
    
    with app.app_context():
        print("Starting database seeding...")
        
        # Check if data already exists
        if User.query.count() > 0:
            print("Database already has data. Skipping seeding.")
            return
            
        # Create test user
        test_user = User(
            username="testuser",
            email="test@example.com",
            name="Test User",
            bio="I am a freelance web developer with 5 years of experience.",
            specialization="Web Development",
            hourly_rate=50.0,
            created_at=datetime.utcnow()
        )
        test_user.set_password("password123")
        db.session.add(test_user)
        db.session.commit()
        print(f"Created test user: {test_user.username}")
        
        # Create clients
        clients_data = [
            {
                "name": "Acme Corporation",
                "email": "contact@acme.com",
                "phone": "555-123-4567",
                "company": "Acme Corp",
                "address": "123 Business St, Suite 100, Business City, 12345",
                "notes": "Large corporation, always pays on time."
            },
            {
                "name": "Startup Innovators",
                "email": "hello@startup.co",
                "phone": "555-987-6543",
                "company": "Startup Innovators LLC",
                "address": "456 Tech Ave, Innovation Hub, Tech City, 54321",
                "notes": "Small startup, excited about new technologies."
            },
            {
                "name": "Local Business",
                "email": "owner@localbiz.com",
                "phone": "555-456-7890",
                "company": "Local Business Inc",
                "address": "789 Main St, Local Town, 67890",
                "notes": "Family owned business, needs website redesign."
            }
        ]
        
        created_clients = []
        for client_data in clients_data:
            client = Client(
                user_id=test_user.id,
                **client_data,
                created_at=datetime.utcnow()
            )
            db.session.add(client)
            created_clients.append(client)
        
        db.session.commit()
        print(f"Created {len(created_clients)} clients")
        
        # Create projects
        projects_data = [
            {
                "client_id": created_clients[0].id,
                "title": "Website Redesign",
                "description": "Complete redesign of corporate website with new branding.",
                "status": "completed",
                "start_date": (datetime.utcnow() - timedelta(days=60)).date(),
                "end_date": (datetime.utcnow() - timedelta(days=15)).date(),
                "hourly_rate": 60.0,
                "fixed_price": None,
                "is_public": True
            },
            {
                "client_id": created_clients[1].id,
                "title": "Mobile App Development",
                "description": "Developing a new mobile app for customer engagement.",
                "status": "active",
                "start_date": (datetime.utcnow() - timedelta(days=30)).date(),
                "end_date": (datetime.utcnow() + timedelta(days=60)).date(),
                "hourly_rate": 70.0,
                "fixed_price": None,
                "is_public": False
            },
            {
                "client_id": created_clients[2].id,
                "title": "E-commerce Integration",
                "description": "Adding e-commerce functionality to existing website.",
                "status": "pending",
                "start_date": (datetime.utcnow() + timedelta(days=15)).date(),
                "end_date": (datetime.utcnow() + timedelta(days=45)).date(),
                "hourly_rate": None,
                "fixed_price": 3000.0,
                "is_public": False
            }
        ]
        
        created_projects = []
        for project_data in projects_data:
            project = Project(
                user_id=test_user.id,
                **project_data,
                created_at=datetime.utcnow()
            )
            db.session.add(project)
            created_projects.append(project)
            
        db.session.commit()
        print(f"Created {len(created_projects)} projects")
        
        # Create time entries for the hourly projects
        time_entries = []
        for project in created_projects[:2]:  # Only for the hourly projects
            # Create entries for the last 2 weeks
            for day in range(14):
                # Skip weekends
                if (datetime.utcnow() - timedelta(days=day)).weekday() >= 5:
                    continue
                    
                # Create 1-3 entries per day
                for i in range(random.randint(1, 3)):
                    hours = round(random.uniform(0.5, 3.0), 1)
                    time_entry = TimeEntry(
                        project_id=project.id,
                        description=f"Work on {project.title} - Task #{i+1}",
                        date=(datetime.utcnow() - timedelta(days=day)).date(),
                        hours=hours,
                        billable=True,
                        invoiced=False,
                        created_at=datetime.utcnow() - timedelta(days=day)
                    )
                    db.session.add(time_entry)
                    time_entries.append(time_entry)
        
        db.session.commit()
        print(f"Created {len(time_entries)} time entries")
        
        # Create invoice for the completed project
        completed_project = created_projects[0]
        invoice = Invoice(
            project_id=completed_project.id,
            invoice_number=f"INV-{test_user.id}-{datetime.utcnow().year}-0001",
            issue_date=(datetime.utcnow() - timedelta(days=10)).date(),
            due_date=(datetime.utcnow() + timedelta(days=20)).date(),
            status="sent",
            notes="Payment due within 30 days. Thank you for your business!",
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        db.session.add(invoice)
        db.session.commit()
        
        # Add invoice items
        invoice_items = [
            {
                "description": "Website design",
                "quantity": 1,
                "unit_price": 1500.0
            },
            {
                "description": "Frontend development",
                "quantity": 1,
                "unit_price": 2000.0
            },
            {
                "description": "Content migration",
                "quantity": 1,
                "unit_price": 500.0
            }
        ]
        
        for item_data in invoice_items:
            item = InvoiceItem(
                invoice_id=invoice.id,
                **item_data,
                created_at=datetime.utcnow() - timedelta(days=10)
            )
            db.session.add(item)
            
        db.session.commit()
        print(f"Created invoice with {len(invoice_items)} items")
        
        print("Database seeding completed")

if __name__ == "__main__":
    seed_database()
