import os
from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_cors import CORS
from extensions import db, login_manager  # Import db from extensions
from config import Config
from error_handlers import register_error_handlers
from auth_middleware import init_auth_middleware

import logging
logging.getLogger().setLevel(logging.DEBUG)

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(config_class)
    app.config['UPLOAD_FOLDER'] = 'static/uploads/profile_images'

    # CORS setup matching your frontend
    CORS(app, 
        resources={
            r"/api/*": {
                "origins": ["http://localhost:5173"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "expose_headers": ["Authorization"],
                "supports_credentials": True,
                "max_age": 3600
            }
        },
        supports_credentials=True
    )

    # Initialize extensions
    db.init_app(app)  # Initialize db with the app instance
    login_manager.init_app(app)
    init_auth_middleware(app)
    
    # Register auth blueprint
    try:
        from routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        logging.info("Auth blueprint registered at /api/auth")
    except ImportError as e:
        logging.error("Failed to import auth_bp: %s", e)
        raise

    # Register other blueprints
    from routes.projects import projects_bp
    from routes.clients import clients_bp
    from routes.time_entries import time_entries_bp
    from routes.invoices import invoices_bp
    from routes.documents import documents_bp
    from routes.portfolio import portfolio_bp
    
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(clients_bp, url_prefix='/api/clients')
    app.register_blueprint(time_entries_bp, url_prefix='/api/time')
    app.register_blueprint(invoices_bp, url_prefix='/api/invoices')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')

    register_error_handlers(app)

    # Log all requests and handle OPTIONS
    @app.before_request
    def log_and_handle_request():
        logging.debug("Incoming request: %s %s", request.method, request.path)
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', '3600')
            return response

    with app.app_context():
        logging.debug("Registered routes: %s", app.url_map)

    # Ensure upload directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'documents'), exist_ok=True)
    
    with app.app_context():
        db.create_all()
    
    @app.route('/api/health')
    def health_check():
        logging.debug("Health check endpoint hit")
        return jsonify({"status": "healthy"})
    
    @app.route('/static/uploads/profile_images/<path:filename>')
    def serve_profile_image(filename):
        directory = os.path.join(app.root_path, 'static/uploads/profile_images')
        response = send_from_directory(directory, filename)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='localhost', port=5001)