import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Google Cloud Platform Configuration
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
    GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")
    
    # API Configuration
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    
    # Model Configuration
    MODEL_NAME = os.getenv("MODEL_NAME", "gemini-pro")
    
    # External Service APIs
    SHIPPING_API_KEY = os.getenv("SHIPPING_API_KEY")
    DOCUMENT_VERIFICATION_API_KEY = os.getenv("DOCUMENT_VERIFICATION_API_KEY")
    
    # Blockchain Configuration
    BLOCKCHAIN_RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL")
    ESCROW_CONTRACT_ADDRESS = os.getenv("ESCROW_CONTRACT_ADDRESS")
    
    # Monitoring Configuration
    POLLING_INTERVAL = int(os.getenv("POLLING_INTERVAL", "300"))  # 5 minutes
    
    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def validate(cls):
        required_vars = [
            "GCP_PROJECT_ID",
            "BLOCKCHAIN_RPC_URL",
            "ESCROW_CONTRACT_ADDRESS"
        ]
        
        missing_vars = [var for var in required_vars if not getattr(cls, var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}") 