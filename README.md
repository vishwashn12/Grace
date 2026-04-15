# GRACE
### Grounded Retrieval Agentic Customer support Engine

> **Paper:** *Hybrid Retrieval-Augmented Generation with Agentic Tool Orchestration for Grounded E-Commerce Customer Support*
> PES University, Department of Computer Science, Bengaluru

---

## Overview

Existing e-commerce chatbots follow rigid decision trees and produce scripted, generic responses that are disconnected from a customer's actual transaction. This system replaces that paradigm with a **hybrid Retrieval-Augmented Generation (RAG) and agentic reasoning architecture** that:

- Retrieves the **real delivery record, payment details, and delay flags** for a specific order and synthesises a grounded natural language answer
- Retrieves **relevant policy and complaint passages** for knowledge questions and cites specific rules
- **Routes deterministically** between the two paths based on whether a structured identifier (order/seller ID) is present in the query

Evaluated on 50 representative support queries using the RAGAS framework, the system achieves a **Response Groundedness of 0.77**, **Faithfulness of 0.68**, and **86% intent classification accuracy** — with all metrics improving over an unoptimized baseline.

---

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the System](#running-the-system)
- [API Endpoints](#api-endpoints)
- [How Routing Works](#how-routing-works)
- [Hybrid Retrieval Pipeline](#hybrid-retrieval-pipeline)
- [LangGraph Agent](#langgraph-agent)
- [Evaluation](#evaluation)
- [Team](#team)

---

## Architecture

```
                         User Query
                             │
                    ┌────────▼────────┐
                    │ Query Rewriter  │  (LLM converts anaphoric input to
                    │ Intent Classify │   standalone search string)
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │   ID present? (32-char hex) │
              └──────┬──────────────┬───────┘
                     │ YES          │ NO
            ┌────────▼──────┐  ┌───▼──────────────┐
            │  Agent Path   │  │  RAG Chain Path   │
            │  (LangGraph)  │  │  FAISS + BM25     │
            │               │  │  RRF + Rerank     │
            │ order_lookup  │  │  Intent prompt    │
            │ seller_analysis│  └───────┬───────────┘
            │ rag_search    │          │
            │ escalate      │          │
            └────────┬──────┘          │
                     └────────┬────────┘
                              │
                     Grounded Response
```

---

## Project Structure

```
GenAI/
├── backend/                        # FastAPI backend
│   ├── main.py                     # App entry point, lifespan startup loader
│   ├── config.py                   # All constants and configuration
│   ├── requirements.txt
│   ├── .env                        # API keys (not committed)
│   │
│   ├── agent/                      # LangGraph agentic layer
│   │   ├── graph.py                # State machine definition (nodes + edges)
│   │   ├── nodes.py                # Node implementations (extract_metadata, agent, tools)
│   │   ├── state.py                # TypedDict AgentState schema
│   │   └── tools.py                # Tool definitions (order_lookup, seller_analysis, rag_search, escalate)
│   │
│   ├── rag/                        # RAG chain components
│   │   ├── intent.py               # 7-class LLM intent classifier + keyword fallback
│   │   ├── prompts.py              # Registry of 7 intent-specific prompt templates
│   │   ├── rewriter.py             # LLM query rewriter chain
│   │   ├── multi_query.py          # Multi-query expansion chain
│   │   ├── compressor.py           # Context compression chain
│   │   ├── context.py              # Context window formatter
│   │   └── multi_hop.py            # Multi-hop retrieval (partial)
│   │
│   ├── retrievers/                 # Retrieval components
│   │   ├── faiss_retriever.py      # FAISS dense retriever (all-MiniLM-L6-v2)
│   │   ├── bm25_builder.py         # BM25 sparse index builder
│   │   └── hybrid_retriever.py     # RRF fusion + ms-marco cross-encoder reranker
│   │
│   ├── core/
│   │   └── rag_system.py           # OlistRAGSystem — orchestrates routing, retrieval, generation
│   │
│   ├── services/
│   │   ├── rag_client.py           # Thin wrapper: route → rag_system.ask()
│   │   ├── data_service.py         # Parquet/CSV loader utilities
│   │   ├── operations_service.py   # Analytics dashboard payload builder
│   │   └── seller_service.py       # Seller KPI lookup logic
│   │
│   ├── routes/
│   │   ├── chat.py                 # POST /chat
│   │   ├── analytics.py            # GET  /analytics
│   │   └── insights.py             # GET  /insights
│   │
│   ├── memory/
│   │   └── conversation.py         # Sliding-window per-session conversation memory
│   │
│   ├── embeddings/
│   │   └── embed_model.py          # Singleton loader for all-MiniLM-L6-v2
│   │
│   └── preprocessing/              # Data preparation scripts (run once offline)
│
├── frontend/                       # React + Vite SPA
│   ├── src/
│   │   ├── components/             # Chat UI, analytics dashboard
│   │   └── App.jsx
│   └── package.json
│
├── faiss_indexes/                  # Pre-built FAISS indexes (not committed to git)
│   ├── main_index/
│   ├── complaints_index/
│   └── policy_index/
│
├── processed_dataset/              # Processed Parquet files (not committed)
│   ├── order_lookup.parquet        # Per-order: status, dates, delay, payment, review
│   └── seller_kpi.parquet          # Per-seller: rating, late rate, complaint rate
│
├── embeddings/                     # Embedding notebooks / cached embeddings
├── results/                        # RAGAS evaluation outputs
├── paper/                          # IEEE conference paper (LaTeX)
│   ├── main.tex
│   ├── Architecture.png
│   ├── LangGraph.png
│   └── Presentation.pptx
└── embeddings-vector-db.ipynb      # Notebook for building FAISS indexes
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| Groq API key | Free tier sufficient |

> **Note:** No GPU is required. All retrieval and reranking runs on CPU. The Groq API handles LLM inference remotely.

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd GenAI
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

---

## Configuration

Create a `.env` file inside the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com).

All other configuration (model names, retrieval parameters, memory window size) is in `backend/config.py`.

Key settings:

```python
MEMORY_MAX_TURNS   = 5        # Sliding window conversation turns per session
LLM_MODEL          = "llama-3.1-8b-instant"
LLM_TEMPERATURE    = 0.1
LLM_MAX_TOKENS     = 600
RERANKER_MODEL     = "cross-encoder/ms-marco-MiniLM-L-6-v2"
EMBED_MODEL        = "all-MiniLM-L6-v2"
TOP_K_RETRIEVAL    = 5
```

---

## Running the System

### Start the backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

On first start, the server loads all heavy components into memory (takes ~30–60 seconds):

```
============================================================
  LOADING RAG SYSTEM — this may take 30-60 seconds...
============================================================
✓ HybridRetriever ready (FAISS + BM25 + RRF + CrossEncoder)
✓ LLM configured (Groq llama-3.1-8b-instant)
✓ OlistRAGSystem ready
============================================================
  ✓ ALL SYSTEMS LOADED — SERVER READY
============================================================
```

### Start the frontend

```bash
cd frontend
npm run dev
```

The app is available at `http://localhost:5173`.

---

## API Endpoints

### `POST /chat`

Main query endpoint.

```json
{
  "query": "What is the status of my order?",
  "order_id": "e481f51cbdc54678b7cc49136f2d6af7",
  "session_id": "user-123",
  "use_rewrite": true,
  "use_mq": false,
  "use_comp": false
}
```

**Response:**
```json
{
  "answer": "Your order was delivered on October 9, 2017...",
  "intent": "order_status",
  "path": "agent",
  "sources": [...]
}
```

- `order_id` is optional — if provided (or found in the query text), the agent path activates automatically
- `session_id` maintains conversation memory across turns

### `GET /analytics`

Returns aggregate KPIs for the analytics dashboard: total queries, intent distribution, average scores.

### `GET /insights`

Returns qualitative insights derived from recent support interactions.

### `GET /health`

```json
{ "status": "ok", "rag_system_loaded": true, "version": "2.0.0" }
```

---

## How Routing Works

Every incoming query passes through three steps:

1. **Query rewriting** — an LLM transforms conversational or anaphoric input (e.g. *"what about the payment?"*) into a standalone, retrieval-optimised search string.

2. **Intent classification** — an LLM-backed classifier assigns one of seven labels:
   `order_status` · `delivery_issue` · `refund_request` · `product_issue` · `policy_query` · `seller_issue` · `general`
   A keyword-rule fallback handles malformed LLM output.

3. **Routing decision** — a single deterministic rule:
   - **32-character hexadecimal identifier present** → **Agent Path** (unconditionally)
   - **No identifier** → **RAG Chain Path**

This binary rule eliminates the failure mode where intent misclassification sends order-specific queries to the knowledge base.

---

## Hybrid Retrieval Pipeline

Used for all queries routed to the RAG chain path (no identifier present).

```
Query Embedding
     │
     ├──► FAISS Dense Retrieval    ─────┐
     │    (all-MiniLM-L6-v2, top-5)     │
     │                                  ▼
     └──► BM25 Sparse Retrieval   ──► RRF Fusion (c=60)
          (rank-bm25, top-5)            │
                                        ▼
                            Cross-Encoder Rerank
                            (ms-marco-MiniLM-L-6-v2)
                                        │
                                 Top-5 chunks (≤2000 chars)
                                        │
                              Intent-specific LLM prompt
                                        │
                                  Grounded response
```

**Index sizes:**

| Index | Vectors | Source |
|---|---|---|
| Main corpus | 130,913 | Olist customer reviews + synthetic tickets |
| Complaints corpus | 113,268 | Amazon review text (broader complaint vocabulary) |
| Policy corpus | 11 | Curated return/refund/CDC policy document |
| **Total** | **244,192** | 384-dimensional (all-MiniLM-L6-v2) |

---

## LangGraph Agent

Used when a structured identifier is detected. Implements a 3-node state machine:

```
START
  │
  ▼
extract_metadata_node   ← parses hex ID via regex, classifies intent
  │
  ▼
agent_node (LLM)        ← selects tool using 5-priority policy
  │
  ├─► tools_node        ← executes selected tool
  │       │
  │       └── loop back to agent_node (max 3 iterations)
  │
  └─► END               ← when no tool call produced, or escalation flag set
```

**Available tools:**

| Tool | Triggers when |
|---|---|
| `order_lookup` | Order ID present |
| `seller_analysis` | Seller ID present |
| `rag_search` | No direct data lookup sufficient |
| `escalate_to_human` | Two failed tool attempts |

**Safety bounds:** maximum 3 tool-call iterations; escalation flag triggers immediate termination. Every query is guaranteed a final response.

---

## Evaluation

The system is evaluated using [RAGAS](https://github.com/explodinggradients/ragas) — an automated framework that uses an LLM judge to assess retrieval-grounded answer quality without manual annotation.

### Results (50 test queries, 7 intent categories)

| Metric | Baseline | Optimised | Gain |
|---|---|---|---|
| Faithfulness | 0.5916 | **0.6790** | +8.7 pp |
| Answer Relevancy | 0.3283 | **0.3551** | +2.7 pp |
| Answer Correctness | 0.4202 | **0.4787** | +5.8 pp |
| Semantic Similarity | 0.5135 | **0.5331** | +2.0 pp |
| Response Groundedness | 0.7500 | **0.7650** | +1.5 pp |
| Intent Accuracy | 80.0% | **86.0%** | +6.0 pp |

**Note on Answer Relevancy (0.36):** When a customer asks *"Where is my order?"* without providing an ID, the correct system response is to ask for one. RAGAS penalises this clarification dialogue as low relevancy — this is a known limitation of single-turn metrics applied to conversational systems, not a system defect.

### Running the evaluation

```bash
cd backend
python evaluation/ragas_eval.py
```

Results are saved to `results/`.

---

## Team

| Name | SRN | Contribution |
|---|---|---|
| **Yashas J** | PES1UG23CS714 | Data preprocessing · FAISS index construction · RAG chain · Intent-specific prompt templates |
| **Vishwas H N** | PES1UG23CS701 | LangGraph state machine · Tool definitions · Routing rule · System-prompt engineering · Robustness mechanisms |
| **Vignesh B Nayak** | PES1UG23CS684 | FAISS dense retriever · BM25 sparse retriever · RRF fusion · Cross-encoder reranker · RAGAS evaluation pipeline |

---

## Latency

| Path | Average response time |
|---|---|
| RAG chain path | ~9.3 s |
| Agent path | ~18.9 s |

Agent latency is attributable to two sequential LLM calls: tool selection and response synthesis. The system is optimised for asynchronous support channels (chat, email-style). Real-time voice applications would require response streaming and speculative tool prefetching.

---

## License

Academic project — PES University. Not licensed for commercial use.
