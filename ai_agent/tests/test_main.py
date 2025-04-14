import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from ai_agent.main import app  # Assuming your FastAPI app is in main.py
from ai_agent.agents import contract_drafter_agent, verifiables_agent, execution_monitor_agent, dispute_resolver_agent, audit_logger_agent

client = TestClient(app)

# --- Unit Tests ---

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == "OK"

@patch.object(contract_drafter_agent, 'create_contract_draft')
def test_draft_endpoint_unit(mock_create_contract):
    mock_create_contract.return_value = {"draft": "Sample Contract Draft"}
    response = client.post("/api/agent/draft")
    assert response.status_code == 200
    assert response.json() == {"draft": "Sample Contract Draft"}
    mock_create_contract.assert_called_once()

@patch.object(verifiables_agent, 'get_verifiables')
def test_verifiables_endpoint_unit(mock_get_verifiables):
    mock_get_verifiables.return_value = {"verifiables": ["verifiable1", "verifiable2"]}
    response = client.get("/api/agent/verifiables")
    assert response.status_code == 200
    assert response.json() == {"verifiables": ["verifiable1", "verifiable2"]}
    mock_get_verifiables.assert_called_once()

@patch.object(execution_monitor_agent, 'monitor_escrow')
def test_monitor_endpoint_unit(mock_monitor_escrow):
    mock_monitor_escrow.return_value = {"status": "active"}
    response = client.get("/api/agent/monitor/123")
    assert response.status_code == 200
    assert response.json() == {"status": "active"}
    mock_monitor_escrow.assert_called_once_with("123")

@patch.object(dispute_resolver_agent, 'resolve_dispute')
def test_dispute_endpoint_unit(mock_resolve_dispute):
    mock_resolve_dispute.return_value = {"resolution": "Resolved"}
    response = client.post("/api/agent/dispute")
    assert response.status_code == 200
    assert response.json() == {"resolution": "Resolved"}
    mock_resolve_dispute.assert_called_once()

@patch.object(audit_logger_agent, 'escalate_escrow')
def test_escalate_endpoint_unit(mock_escalate_escrow):
    mock_escalate_escrow.return_value = {"status": "escalated"}
    response = client.post("/api/agent/escalate/123")
    assert response.status_code == 200
    assert response.json() == {"status": "escalated"}
    mock_escalate_escrow.assert_called_once_with("123")

# --- Integration Tests ---

def test_draft_endpoint_integration():
    response = client.post("/api/agent/draft")
    assert response.status_code == 200

def test_verifiables_endpoint_integration():
    response = client.get("/api/agent/verifiables")
    assert response.status_code == 200

def test_monitor_endpoint_integration():
    response = client.get("/api/agent/monitor/123")
    assert response.status_code == 200

def test_dispute_endpoint_integration():
    response = client.post("/api/agent/dispute")
    assert response.status_code == 200

def test_escalate_endpoint_integration():
    response = client.post("/api/agent/escalate/123")
    assert response.status_code == 200

def test_proxy_lock_integration():
    response = client.post("/api/smart-contract/lock")
    assert response.status_code == 200
    