import uvicorn
import logging
from fastapi import FastAPI
from .agents.main import app
from .config import Config

# Configure logging
logging.basicConfig(
    level=Config.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    try:
        # Validate configuration
        Config.validate()
        
        # Start the FastAPI application
        logger.info(f"Starting AI Agent service on {Config.API_HOST}:{Config.API_PORT}")
        uvicorn.run(
            app,
            host=Config.API_HOST,
            port=Config.API_PORT,
            log_level=Config.LOG_LEVEL.lower()
        )
    except Exception as e:
        logger.error(f"Failed to start AI Agent service: {str(e)}")
        raise

if __name__ == "__main__":
    main() 