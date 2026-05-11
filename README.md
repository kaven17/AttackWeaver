# AttackWeaver

AI-Powered Multi-Agent SOC Reconstruction Pipeline

---

# Overview

AttackWeaver is a hybrid AI-driven Security Operations Center (SOC) platform designed to transform raw security telemetry into structured attack intelligence.

Instead of producing isolated alerts, AttackWeaver reconstructs the complete attack lifecycle by combining:

* Signal fusion
* Attack path simulation
* Trust auditing
* Incident response generation
* Executive narrative reconstruction
* Blockchain-backed audit integrity

The platform operates as an AI SOC analyst capable of correlating events, reasoning over attacker behavior, and generating explainable incident intelligence.

---

# Core Features

## Multi-Agent Security Pipeline

AttackWeaver uses specialized AI agents working together:

| Agent               | Function                                                |
| ------------------- | ------------------------------------------------------- |
| Signal Fusion Agent | Correlates SIEM, EDR, firewall, cloud, and Wazuh events |
| Attack Path Agent   | Simulates attacker movement using MITRE ATT&CK          |
| Response Agent      | Generates prioritized containment actions               |
| Trust Auditor       | Performs behavioral identity analysis                   |
| Narrative Engine    | Produces executive-level incident summaries             |

---

## MITRE ATT&CK Mapping

The platform reconstructs:

* Initial access
* Privilege escalation
* Lateral movement
* Credential access
* Persistence
* Exfiltration
* Impact stages

Each edge in the attack graph contains MITRE tactics and techniques.

---

## Hybrid AI Architecture

AttackWeaver supports:

### Local AI Execution

Using:

* Ollama
* Gemma 2B
* Mistral

### Remote AI Agents

Connected through:

* Node.js AI microservices
* Wazuh integrations
* Distributed agent APIs

This hybrid model enables:

* low latency
* lower inference cost
* scalable deployment
* offline reasoning capability

---

## Blockchain Audit Trail

Every incident reconstruction can be:

* hashed
* timestamped
* written to blockchain

This provides:

* forensic integrity
* tamper detection
* immutable audit records

---

# Architecture

```text
Raw Logs
   ↓
Signal Fusion Agent
   ↓
Attack Path Simulation
   ↓
Response Generation
   ↓
Trust Audit
   ↓
Narrative Engine
   ↓
Blockchain Audit
   ↓
SOC Dashboard
```

---

# System Workflow

## Step 1 — Signal Fusion

The Signal Fusion Agent ingests logs from multiple security sources including:

* SIEM
* Wazuh
* EDR
* Firewall
* Cloud logs

It deduplicates noisy alerts, correlates related events, groups attacker activity into clusters, and filters false positives.

Output:

* Incident clusters
* Confidence scores
* Correlated attacker activity

---

## Step 2 — Attack Path Reconstruction

The Attack Path Agent simulates attacker movement across organizational infrastructure.

Capabilities:

* Maps compromised nodes
* Simulates lateral movement
* Tracks privilege escalation
* Calculates blast radius
* Estimates dwell time
* Maps MITRE ATT&CK tactics

Output:

* Attack graph
* MITRE timeline
* High-value targets reached

---

## Step 3 — Response Generation

The Response Agent generates containment and remediation actions.

Each action is scored based on:

* effectiveness
* operational disruption
* reversibility

Examples:

* isolate host
* revoke credentials
* force MFA
* block IP
* quarantine process

---

## Step 4 — Trust Auditing

The Trust Auditor performs behavioral identity analysis.

It compares user behavior against baseline patterns to identify:

* anomalous login times
* impossible travel
* privilege escalation
* unusual process spawning
* excessive data access

The system dynamically adjusts identity trust scores.

---

## Step 5 — Narrative Reconstruction

The Narrative Engine converts structured outputs into a concise executive incident summary.

The narrative explains:

* initial compromise
* attack progression
* affected systems
* immediate response priorities

This enables rapid analyst understanding.

---

## Step 6 — Blockchain Integrity

Attack reconstructions are optionally:

* hashed
* signed
* written to Ethereum Sepolia

This provides:

* immutable audit trails
* forensic verification
* tamper evidence

---

# Tech Stack

## Frontend

* Next.js
* React
* TailwindCSS

## Backend

* Node.js
* Express.js

## AI / ML

* Ollama
* Gemma 2B
* Mistral
* Local LLM orchestration

## Security

* Wazuh
* MITRE ATT&CK

## Validation

* Zod

## Blockchain

* Ethereum Sepolia

---

# Hybrid AI Design

AttackWeaver uses a distributed AI execution model.

## Local Inference

Executed on:

* Ollama
* Gemma 2B

Used for:

* Trust analysis
* Attack path reconstruction
* Lightweight reasoning

Benefits:

* lower latency
* offline capability
* cost efficiency

---

## Remote Agent Execution

Remote AI agents are exposed through Express.js APIs.

Endpoints:

```text
/api/agent/signal-fusion
/api/agent/attack-path
/api/agent/response
/api/agent/trust-auditor
/api/agent/narrative
```

These agents can run on separate systems connected to:

* Wazuh
* centralized log pipelines
* distributed infrastructure

---

# Example Incident Flow

```text
Wazuh Alert
   ↓
Signal Correlation
   ↓
Attack Reconstruction
   ↓
Trust Analysis
   ↓
Containment Strategy
   ↓
Executive Narrative
   ↓
Blockchain Logging
```

---

# Example Use Case

A user attempts privilege escalation from an unusual location.

AttackWeaver:

* correlates related events
* identifies abnormal identity behavior
* simulates attacker progression
* detects risk to critical assets
* recommends containment actions
* generates executive narrative
* logs incident hash to blockchain

All within seconds.

---

# Project Structure

```text
src/
├── ai/
│   ├── flows/
│   │   ├── signalFusionflow.ts
│   │   ├── attackPathFlow.ts
│   │   ├── ResponseFlow.ts
│   │   ├── trustAuditFlow.ts
│   │   └── narrativeFlow.ts
│   │
│   └── ollama.ts
│
├── app/
│   ├── api/
│   │   ├── orchestrator/
│   │   └── audit/
│   │
│   └── analysis/
│
├── actions/
│
└── components/
```

---

# Running Locally

## 1. Install dependencies

```bash
npm install
```

---

## 2. Start Ollama

```bash
ollama run gemma:2b
```

---

## 3. Start development server

```bash
npm run dev
```

---

# Wazuh Integration

AttackWeaver integrates with Wazuh SIEM pipelines.

Example:

```text
Wazuh Alert
   ↓
/api/wazuh/analyze
   ↓
AI Reconstruction
```

---

# Key Engineering Challenges Solved

## LLM Output Instability

Problem:

* malformed JSON
* markdown contamination
* missing fields

Solution:

* safeParse()
* normalization layers
* fallback systems
* schema validation

---

## Multi-Agent Coordination

Problem:

* inconsistent outputs between agents

Solution:

* centralized orchestrator pipeline
* standardized schemas
* shared normalization

---

## Hybrid Deployment

Problem:

* balancing cost, latency, and scalability

Solution:

* local inference + remote agents
* distributed execution architecture

---

# Future Enhancements

* Real-time streaming analysis
* Autonomous response execution
* Graph visualization engine
* Threat intelligence enrichment
* Production blockchain deployment
* Enterprise IAM integration
* Memory-aware AI agents

---

# Security Goals

AttackWeaver is designed to:

* reduce analyst workload
* accelerate threat reconstruction
* improve explainability
* automate SOC reasoning
* preserve forensic integrity

---

# Disclaimer

This project is intended for:

* cybersecurity research
* AI security experimentation
* SOC workflow enhancement
* educational use

Not intended for production critical infrastructure without additional hardening and validation.

---

# Author

Kaven P.S

Cybersecurity Researcher | AI Security Engineer | CTF Player
