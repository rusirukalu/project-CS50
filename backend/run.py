import os
import argparse
import logging
from app import create_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Run the Flask application with configurable settings."""
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

    # Create the app instance
    try:
        app = create_app()
    except Exception as e:
        logger.error(f"Failed to create Flask app: {str(e)}")
        raise

    # Run database migrations if requested
    if args.setup_db:
        logger.info("Running database migrations...")
        try:
            from migrations import run_migrations
            with app.app_context():  # Ensure app context for DB operations
                run_migrations()
            logger.info("Database migrations completed successfully.")
        except ImportError as e:
            logger.error(f"Failed to import run_migrations: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Database migration failed: {str(e)}")
            raise

    # Seed database if requested
    if args.seed_db:
        logger.info("Seeding database...")
        try:
            from seed import seed_database
            with app.app_context():  # Ensure app context for DB operations
                seed_database()
            logger.info("Database seeding completed successfully.")
        except ImportError as e:
            logger.error(f"Failed to import seed_database: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Database seeding failed: {str(e)}")
            raise

    # Start the server
    logger.info(f"Starting server in {args.env} mode on {args.host}:{args.port}")
    try:
        app.run(host=args.host, port=args.port, debug=(args.env != 'prod'))
    except Exception as e:
        logger.error(f"Failed to run server: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Server stopped by user (Ctrl+C).")
    except Exception as e:
        logger.error(f"Application failed: {str(e)}")
        exit(1)