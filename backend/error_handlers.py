from flask import jsonify, request
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError

def register_error_handlers(app):
    """Register error handlers for the Flask app"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "error": "Bad Request",
            "message": str(error.description) if hasattr(error, 'description') else "Invalid request"
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication required"
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            "error": "Forbidden",
            "message": "You don't have permission to access this resource"
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found"
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method Not Allowed",
            "message": f"The {request.method} method is not allowed for this endpoint"
        }), 405
    
    @app.errorhandler(422)
    def unprocessable_entity(error):
        return jsonify({
            "error": "Unprocessable Entity",
            "message": "The request was well-formed but could not be processed"
        }), 422
    
    @app.errorhandler(429)
    def too_many_requests(error):
        return jsonify({
            "error": "Too Many Requests",
            "message": "You have sent too many requests in a given amount of time"
        }), 429
    
    @app.errorhandler(500)
    def server_error(error):
        app.logger.error(f"Internal Server Error: {str(error)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred"
        }), 500
    
    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(error):
        app.logger.error(f"Database error: {str(error)}")
        return jsonify({
            "error": "Database Error",
            "message": "An error occurred while processing your request"
        }), 500
    
    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        app.logger.error(f"Unhandled exception: {str(error)}")
        return jsonify({
            "error": "Server Error",
            "message": "An unexpected error occurred"
        }), 500
        
    # Special handler for CORS preflight requests
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def handle_preflight(path):
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
