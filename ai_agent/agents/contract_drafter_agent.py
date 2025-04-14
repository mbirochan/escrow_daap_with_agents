from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json

app = FastAPI()

class ContractDraftRequest(BaseModel):
    contract_name: str
    parties: list
    terms: str

@app.post("/api/agent/draft")
async def create_contract_draft(request: ContractDraftRequest):
    try:
        contract_data = {
            "contract_name": request.contract_name,
            "parties": request.parties,
            "terms": request.terms
        }
        
        return contract_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))