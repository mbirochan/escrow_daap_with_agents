from fastapi import FastAPI, HTTPException
from typing import Dict
from ai_agent.agents import contract_drafter_agent, verifiables_agent, execution_monitor_agent, dispute_resolver_agent, audit_logger_agent
import requests

app = FastAPI()

@app.get("/")
async def root():
    return "OK"

@app.post("/api/smart-contract/lock")
async def lock_funds(payload: Dict):
    # Placeholder for smart contract interaction logic
    # This would involve sending a transaction to the smart contract
    # and handling the result.
    print(f"Lock funds request received: {payload}")
    
    return {"message": "Funds locked successfully (simulated)"}

@app.post("/api/agent/draft")
async def draft_contract(payload: Dict):
    try:
        # Relay user input to the contract_drafter_agent
        response = contract_drafter_agent.draft_contract(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/verifiables")
async def get_verifiables():
    try:
        response = verifiables_agent.get_verifiables()
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/monitor/{escrowId}")
async def monitor_escrow(escrowId: str):
    try:
        response = execution_monitor_agent.monitor_escrow(escrowId)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.post("/api/agent/dispute")
async def resolve_dispute(payload: Dict):
    try:
        response = dispute_resolver_agent.resolve_dispute(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/escalate/{escrowId}")
async def escalate_dispute(escrowId: str):
    try:
        response = audit_logger_agent.escalate_dispute(escrowId)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Example of how an AI agent might call back to the API
def release_funds(escrow_id):
    # This function would be called from an AI agent
    # to trigger a release of funds in the smart contract.
    url = "/api/smart-contract/release"  # Replace with the correct URL if different
    payload = {"escrowId": escrow_id}
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error releasing funds: {e}")
        return None

def resolve_dispute(escrow_id, decision):
    # This function would be called from an AI agent
    # to trigger a resolution of a dispute in the smart contract.
    url = "/api/smart-contract/resolve-dispute"  # Replace with the correct URL if different
    payload = {"escrowId": escrow_id, "decision": decision}
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error resolving dispute: {e}")
        return None