import os
import argparse
from app import create_app

def main():
    """Run the Flask application with configurable settings"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the Freelance Manager API server')
    parser.add_argument(
        '--env', 
        choices=['dev', 'test', 'prod'], 
        default='dev',
        help='Environment to run the server in (default: dev)'
    )
    parser.add_argument(
        '--port', 
        type=int, 
        default=5001,
        help='Port to run the server on (default: 5001)'
    )
    parser.add_argument(
        '--host', 
        default='127.0.0.1',
        help='Host to run the server on (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--setup-db', 
        action='store_true',
        help='Run database migrations before starting the server'
    )
    parser.add_argument(
        '--seed-db', 
        action='store_true',
        help='Seed the database with test data before starting the server'
    )
    
    args = parser.parse_args()
    
    # Set environment variables based on environment
    if args.env == 'dev':
        os.environ['FLASK_ENV'] = 'development'
        os.environ['FLASK_DEBUG'] = '1'
    elif args.env == 'test':
        os.environ['FLASK_ENV'] = 'testing'
        os.environ['FLASK_DEBUG'] = '1'
    elif args.env == 'prod':
        os.environ['FLASK_ENV'] = 'production'
        os.environ['FLASK_DEBUG'] = '0'
    
    # Run database migrations if requested
    if args.setup_db:
        print("Running database migrations...")
        from migrations import run_migrations
        run_migrations()
    
    # Seed database if requested
    if args.seed_db:
        print("Seeding database...")
        from seed import seed_database
        seed_database()
    
    # Create and run the app
    app = create_app()
    
    print(f"Starting server in {args.env} mode on {args.host}:{args.port}")
    app.run(host=args.host, port=args.port, debug=(args.env != 'prod'))

if __name__ == '__main__':
    main()
