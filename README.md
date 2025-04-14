# Project Documentation: AI-Powered Escrow System

## Table of Contents

1.  [Introduction](#introduction)
2.  [Architecture](#architecture)
3.  [Components](#components)
    *   [Smart Contracts](#smart-contracts)
    *   [AI Agents](#ai-agents)
    *   [Backend API](#backend-api)
    *   [Frontend](#frontend)
4.  [Setup and Installation](#setup-and-installation)
5.  [Running the Project](#running-the-project)
6.  [Testing](#testing)
    *   [Smart Contract Testing](#smart-contract-testing)
    *   [Backend API Testing](#backend-api-testing)
    *   [AI Agent Testing](#ai-agent-testing)
7.  [AI Agents Details](#ai-agents-details)
    *   [Contract Drafter Agent](#contract-drafter-agent)
    *   [Verifiables Agent](#verifiables-agent)
    *   [Execution Monitor Agent](#execution-monitor-agent)
    *   [Dispute Resolver Agent](#dispute-resolver-agent)
    *   [Audit Logger Agent](#audit-logger-agent)
8.  [Smart Contract Details](#smart-contract-details)
9.  [Backend API Details](#backend-api-details)
10. [Conclusion](#conclusion)

## Introduction

This document provides comprehensive documentation for the AI-Powered Escrow System project. This system uses smart contracts and AI agents to automate and enhance the escrow process. The project consists of smart contracts, AI agents, a backend API, and a frontend application.

## Architecture

The architecture of the AI-Powered Escrow System can be represented as follows:
```
+-----------------+      +-----------------+      +--------------------+
| Frontend (React) | <--> | Backend (FastAPI) | <--> | Smart Contracts    |
+-----------------+      +-----------------+      +--------------------+
      ^   |                  ^    |                   ^    |
      |   v                  |    v                   |    v
+-----------------+      +-----------------+      +--------------------+
|     User        |      |    AI Agents    |      | Blockchain (EVM)   |
+-----------------+      +-----------------+      +--------------------+
```
**Key Elements:**

*   **Frontend:** A React application that provides a user interface for interacting with the system.
*   **Backend:** A FastAPI application that handles API requests, manages interactions with smart contracts, and orchestrates AI agents.
*   **Smart Contracts:** Solidity contracts deployed on the Ethereum Virtual Machine (EVM), handling escrow logic.
*   **AI Agents:** Python-based agents that interact with the backend and the blockchain, performing tasks like contract drafting, monitoring, dispute resolution, etc.
*   **Blockchain:** The EVM-compatible blockchain network (e.g., Sepolia, Mumbai) where the smart contracts are deployed.
* **User:** The end user who interact with the frontend

## Components

### Smart Contracts

*   **Language:** Solidity
*   **Location:** `contracts/Escrow.sol`
*   **Functionality:**
    *   Escrow lifecycle management (create, lock, release, dispute).
    *   Access control using modifiers (e.g., `onlyPartyA`, `onlyAI`).
    *   Security using OpenZeppelin libraries (Ownable, Pausable, ReentrancyGuard).
    *   AI agent whitelisting for specific actions.

### AI Agents

*   **Language:** Python
*   **Location:** `ai_agent/agents/*.py`
*   **Types:**
    *   **Contract Drafter Agent:** Generates contract drafts.
    *   **Verifiables Agent:** Handles verifiable data.
    *   **Execution Monitor Agent:** Monitors escrow contract execution.
    *   **Dispute Resolver Agent:** Resolves disputes.
    *   **Audit Logger Agent:** Handles escalation.

### Backend API

*   **Language:** Python
*   **Framework:** FastAPI
*   **Location:** `ai_agent/main.py`
*   **Functionality:**
    *   Proxies wallet actions.
    *   Relays user inputs to AI agents.
    *   Handles AI agent calls to smart contracts.
    *   Exposes API endpoints for frontend and agent interaction.

### Frontend

*   **Language:** JavaScript
*   **Framework:** React
*   **Functionality:**
    *   Wallet connection.
    *   Contract draft chat.
    *   Verifiables UI.
    *   Escrow lifecycle interface.
    *   Dispute resolution UI.
    *   Transaction dashboard.
    *   Notifications.
    *   Profile and contract history.

## Setup and Installation

1.  **Clone the Repository:**
```
bash
    git clone https://github.com/mbirochan/escrow_daap_with_agents.git
    cd escrow_daap_with_agents
    
```
2.  **Install Dependencies:**

    *   **Smart Contracts (Hardhat):**
```
bash
        npm install
        
```
*   **Backend & AI Agents (Python):**
```
bash
        cd ai_agent
        pip install -r requirements.txt
        
```
3. **Install python requirements:**
```
bash
pip install -r ai_agent/requirements.txt
```
## Running the Project

1.  **Start Hardhat Node (for local testing):**
```
bash
    npx hardhat node
    
```
2.  **Deploy Smart Contracts:**
```
bash
    npx hardhat run scripts/deploy.js --network localhost
    
```
3.  **Run Backend API:**
```
bash
    cd ai_agent
    uvicorn main:app --reload
    
```
4.  **Start the Frontend (React):**
```
bash
    cd frontend
    npm install
    npm start
    
```
## Testing

### Smart Contract Testing

*   **Framework:** Hardhat + Mocha + Chai
*   **Location:** `test/Escrow.test.js`
*   **How to Run:**
```
bash
    npx hardhat test
    
```
*   **Testing Strategy:**
    *   Test all smart contract functions.
    *   Verify modifiers and access control.
    *   Ensure AI agent whitelisting works.
    *   Use Hardhat fixtures for setup.
    *   Aim for 90%+ test coverage.

### Backend API Testing

*   **Framework:** Pytest
*   **Location:** `ai_agent/tests/test_main.py`
*   **How to Run:**
```
bash
    cd ai_agent
    pytest tests/test_main.py
    
```
*   **Testing Strategy:**
    *   Test API endpoints.
    *   Test interactions with smart contracts.
    *   Test relaying inputs to agents.
    *   Test agent calls to contracts.

### AI Agent Testing

*   **Framework:** Pytest
*   **Location:** `ai_agent/tests/test_agents.py`
*   **How to Run:**
```
bash
    cd ai_agent
    pytest tests/test_agents.py
    
```
*   **Testing Strategy:**
    *   Test each agent's core functionality.
    *   Simulate scenarios (Mock APIs, data).
    *   Verify agent responses and outputs.

## AI Agents Details

### Contract Drafter Agent

*   **File:** `ai_agent/agents/contract_drafter_agent.py`
*   **Endpoint:** `/api/agent/draft`
*   **Functionality:** Generates contract drafts based on user input.

### Verifiables Agent

*   **File:** `ai_agent/agents/verifiables_agent.py`
*   **Endpoint:** `/api/agent/verifiables`
*   **Functionality:** Manages verifiable data and interactions.

### Execution Monitor Agent

*   **File:** `ai_agent/agents/execution_monitor_agent.py`
*   **Endpoint:** `/api/agent/monitor/{escrowId}`
*   **Functionality:** Monitors the execution of an escrow contract, tracking events and state changes.

### Dispute Resolver Agent

*   **File:** `ai_agent/agents/dispute_resolver_agent.py`
*   **Endpoint:** `/api/agent/dispute`
*   **Functionality:** Handles and resolves disputes related to escrow contracts.

### Audit Logger Agent

*   **File:** `ai_agent/agents/audit_logger_agent.py`
*   **Endpoint:** `/api/agent/escalate/{escrowId}`
*   **Functionality:** Provides escalation services for a specific escrow contract, logging audit trails.

## Smart Contract Details

*   **File:** `contracts/Escrow.sol`
*   **Key Features:**
    *   **Modifiers:** `onlyPartyA`, `onlyPartyB`, `onlyAI` for access control.
    *   **Libraries:** OpenZeppelin's `Ownable`, `Pausable`, `ReentrancyGuard` for security.
    *   **Constructor:** Sets up `partyA`, `partyB`, and `aiAgent` addresses.
    *   **Whitelisting:** AI agent address is whitelisted for key actions.
    *   **Lifecycle Functions:** `createEscrow`, `lockFunds`, `setVerifiables`, etc.

## Backend API Details

*   **File:** `ai_agent/main.py`
*   **Framework:** FastAPI
*   **Endpoints:**
    *   `/api/smart-contract/lock`: Proxies wallet actions to lock funds.
    *   `/api/agent/draft`: Relays user input to the Contract Drafter Agent.
    *   `/api/agent/monitor/{escrowId}`: Relays user input to the Execution Monitor Agent.
    *   `/api/agent/dispute`: Relays user input to the Dispute Resolver Agent.
    *   `/api/agent/escalate/{escrowId}`: Relays user input to the Audit Logger Agent.
    *   `/api/agent/verifiables`: Relays user input to the Verifiables Agent.
    *   `/`: Test endpoint that returns "OK".
*   **Functionality:**
    *   Orchestrates communication between the frontend, smart contracts, and AI agents.
    *   Manages the flow of data and actions.

## Conclusion

This documentation provides a detailed overview of the AI-Powered Escrow System project, covering its architecture, components, setup, operation, and testing. Each component plays a critical role in creating a decentralized, automated, and intelligent escrow process. This system is designed to be robust, secure, and scalable, leveraging the power of blockchain and AI to enhance traditional escrow services.