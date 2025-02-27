import os
import sqlite3
from flask import current_app
from app import create_app, db

def run_migrations():
    """Run database migrations for schema changes"""
    app = create_app()
    
    with app.app_context():
        # Get database path from app config
        db_path = current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        
        if not os.path.exists(db_path):
            print(f"Database file doesn't exist yet: {db_path}")
            # Database will be created automatically by SQLAlchemy
            return
            
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if 'is_public' column exists in projects table
        cursor.execute("PRAGMA table_info(project)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        # Add 'is_public' column if it doesn't exist
        if 'is_public' not in column_names:
            print("Adding 'is_public' column to project table...")
            cursor.execute("ALTER TABLE project ADD COLUMN is_public BOOLEAN DEFAULT 0")
            conn.commit()
            print("Column added successfully.")
        
        # Check if documents table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='document'")
        if not cursor.fetchone():
            print("Documents table doesn't exist. It will be created by SQLAlchemy.")
        
        # Close the database connection
        conn.close()
        
        # Let SQLAlchemy create any missing tables
        db.create_all()
        print("Database migration completed successfully.")

if __name__ == "__main__":
    run_migrations()
