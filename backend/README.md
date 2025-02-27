# Freelance Manager API (Backend)

This is the backend API for the Freelance Manager application, a comprehensive tool for freelancers to manage clients, projects, time tracking, invoicing, and portfolio.

## Features

- **Authentication**: Secure user registration, login, and profile management
- **Client Management**: Store and organize client information
- **Project Management**: Track projects, status, and details
- **Time Tracking**: Log time spent on projects with detailed descriptions
- **Invoicing**: Create and manage invoices with automatic generation from time entries
- **Document Storage**: Upload and organize project-related documents
- **Portfolio**: Showcase selected projects on a public portfolio

## Technology Stack

- **Framework**: Flask (Python)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local filesystem
- **PDF Generation**: pdfkit

## Project Structure

backend/
├── app.py # Main application entry point
├── config.py # Configuration settings
├── migrations.py # Database migration handling
├── seed.py # Database seeding script
├── auth_middleware.py # JWT authentication middleware
├── error_handlers.py # Global error handling
├── requirements.txt # Dependencies
├── models/ # Database models
│ ├── user.py # User model
│ ├── client.py # Client model
│ ├── project.py # Project model
│ ├── time_entry.py # Time tracking model
│ ├── invoice.py # Invoice models
│ └── document.py # Document model
│
├── routes/ # Route handlers (API endpoints)
│ ├── auth.py # Authentication routes
│ ├── clients.py # Client management routes
│ ├── documents.py # Document management routes
│ ├── invoices.py # Invoice generation routes
│ ├── portfolio.py # Portfolio routes
│ ├── projects.py # Project management routes
│ └── time_entries.py # Time tracking routes
│
├── static/ # Static files (uploads)
│ ├── uploads/ # User uploaded files
│ └── documents/ # Project documents
│
├── tests/ # Test suite
│ └── test_api.py # API tests
│
└── instance/ # Instance-specific data (database)

## Setup and Installation

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- Virtual environment (recommended)

### Installation Steps

1. Clone the repository:
   git clone https://github.com/yourusername/freelance-manager.git
   cd freelance-manager/backend

2. Create and activate a virtual environment:
   python -m venv venv
   source venv/bin/activate # On Windows: venv\Scripts\activate

3. Install dependencies:
   pip install -r requirements.txt

4. Set up environment variables:

- Create a `.env` file in the backend directory
- Add the following variables:
  ```
  SECRET_KEY=your-secret-key-here
  FLASK_APP=app.py
  FLASK_ENV=development
  ```

5. Initialize the database:
   python migrations.py

6. (Optional) Seed the database with test data:
   python seed.py

7. Start the development server:
   flask run

The API will be available at `http://localhost:5001`.

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (invalidates token)
- `GET /api/auth/user` - Get current user profile
- `PUT /api/auth/user` - Update user profile
- `PUT /api/auth/user/password` - Change password
- `POST /api/auth/user/profile-image` - Upload profile image

### Client Endpoints

- `GET /api/clients/` - Get all clients
- `GET /api/clients/<id>` - Get specific client
- `POST /api/clients/` - Create new client
- `PUT /api/clients/<id>` - Update client
- `DELETE /api/clients/<id>` - Delete client
- `GET /api/clients/search` - Search clients

### Project Endpoints

- `GET /api/projects/` - Get all projects
- `GET /api/projects/<id>` - Get specific project
- `POST /api/projects/` - Create new project
- `PUT /api/projects/<id>` - Update project
- `DELETE /api/projects/<id>` - Delete project
- `GET /api/projects/stats` - Get project statistics
- `POST /api/projects/<id>/toggle-public` - Toggle portfolio visibility

### Time Entry Endpoints

- `GET /api/time/` - Get time entries
- `GET /api/time/<id>` - Get specific time entry
- `POST /api/time/` - Create new time entry
- `PUT /api/time/<id>` - Update time entry
- `DELETE /api/time/<id>` - Delete time entry
- `GET /api/time/summary` - Get time summary statistics

### Invoice Endpoints

- `GET /api/invoices/` - Get all invoices
- `GET /api/invoices/<id>` - Get specific invoice
- `POST /api/invoices/` - Create new invoice
- `PUT /api/invoices/<id>` - Update invoice
- `DELETE /api/invoices/<id>` - Delete invoice
- `GET /api/invoices/<id>/pdf` - Generate PDF invoice
- `POST /api/invoices/<id>/mark-paid` - Mark invoice as paid
- `POST /api/invoices/<id>/mark-sent` - Mark invoice as sent
- `POST /api/invoices/from-time` - Create invoice from time entries
- `GET /api/invoices/stats` - Get invoice statistics

### Document Endpoints

- `GET /api/documents/` - Get all documents
- `GET /api/documents/<id>` - Get specific document
- `GET /api/documents/<id>/download` - Download a document
- `POST /api/documents/` - Upload new document
- `PUT /api/documents/<id>` - Update document metadata
- `DELETE /api/documents/<id>` - Delete document
- `GET /api/documents/types` - Get list of document types

### Portfolio Endpoints

- `GET /api/portfolio/<username>` - Get public portfolio
- `GET /api/portfolio/settings` - Get portfolio settings
- `PUT /api/portfolio/settings` - Update portfolio settings

## Running Tests

Run the test suite with pytest:
pytest tests/

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in JSON format:
{
"error": "Error Type",
"message": "Detailed error message"
}

## License

This project is licensed under the MIT License - see the LICENSE file for details.
