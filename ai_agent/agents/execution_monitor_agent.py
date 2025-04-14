from fastapi import FastAPI, HTTPException
from typing import Dict

app = FastAPI()

# Mock data for demonstration purposes
escrow_contracts: Dict[str, Dict] = {}

@app.get("/api/agent/monitor/{escrowId}")
async def monitor_escrow(escrowId: str):
    """
    Monitors the execution of an escrow contract.

    Args:
        escrowId: The ID of the escrow contract.

    Returns:
        A dictionary containing the status of the escrow contract.

    Raises:
        HTTPException: If the escrow contract ID is not found.
    """
    if escrowId not in escrow_contracts:
        raise HTTPException(status_code=404, detail="Escrow contract not found")
    
    return {"escrowId": escrowId, "status": escrow_contracts[escrowId]}

# Example of how to add data
# escrow_contracts["1"] = {"status": "in progress"}
# escrow_contracts["2"] = {"status": "completed"}