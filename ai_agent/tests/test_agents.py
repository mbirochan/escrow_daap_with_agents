import pytest
from fastapi.testclient import TestClient
from ai_agent.agents import contract_drafter_agent, verifiables_agent, execution_monitor_agent, dispute_resolver_agent, audit_logger_agent

# Contract Drafter Agent Tests
def test_contract_drafter_agent():
    client = TestClient(contract_drafter_agent.app)
    response = client.post("/api/agent/draft", json={"data": "some_data"})
    assert response.status_code == 200
    assert "draft" in response.json()

# Verifiables Agent Tests
def test_verifiables_agent():
    client = TestClient(verifiables_agent.app)
    response = client.get("/api/agent/verifiables")
    assert response.status_code == 200
    assert "verifiables" in response.json()

# Execution Monitor Agent Tests
def test_execution_monitor_agent():
    client = TestClient(execution_monitor_agent.app)
    response = client.get("/api/agent/monitor/123")
    assert response.status_code == 200
    assert "status" in response.json()

def test_execution_monitor_agent_invalid():
    client = TestClient(execution_monitor_agent.app)
    response = client.get("/api/agent/monitor/abc")
    assert response.status_code == 400
    
# Dispute Resolver Agent Tests
def test_dispute_resolver_agent():
    client = TestClient(dispute_resolver_agent.app)
    response = client.post("/api/agent/dispute", json={"dispute": "some_data"})
    assert response.status_code == 200
    assert "resolution" in response.json()

# Audit Logger Agent Tests
def test_audit_logger_agent():
    client = TestClient(audit_logger_agent.app)
    response = client.post("/api/agent/escalate/123")
    assert response.status_code == 200
    assert "escalation" in response.json()
    
def test_audit_logger_agent_invalid():
    client = TestClient(audit_logger_agent.app)
    response = client.post("/api/agent/escalate/abc")
    assert response.status_code == 400