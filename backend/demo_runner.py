"""
demo_runner.py
Run 15 diverse queries against the live GRACE API, save raw JSON,
and generate a formatted Markdown report with tables.
"""
import json
import time
import textwrap
from pathlib import Path
import urllib.request
import urllib.error

API_URL = "http://localhost:8000/chat"

# ── 15 diverse queries covering every intent and path ───────────────────────
QUERIES = [
    # ── AGENT PATH — order_lookup ──────────────────────────────────────────
    {
        "label": "Order Status (ID inline)",
        "query": "What is the current status of my order e481f51cbdc54678b7cc49136f2d6af7?",
        "order_id": "",
    },
    {
        "label": "Delivery Delay (ID in box)",
        "query": "My package is very late. Can you tell me what happened?",
        "order_id": "203096f03d82e0dffbc41ebc2e2bcfb7",
    },
    {
        "label": "Refund Eligibility (ID inline)",
        "query": "Is my order 203096f03d82e0dffbc41ebc2e2bcfb7 eligible for a refund? It arrived very late.",
        "order_id": "",
    },
    {
        "label": "Payment Details (ID in box)",
        "query": "How was the payment made for my order and what was the total amount?",
        "order_id": "e481f51cbdc54678b7cc49136f2d6af7",
    },
    {
        "label": "Delivery Date Check (ID inline)",
        "query": "When was order 83422b2b70c1aa20c57b21f09a52cf3c actually delivered versus the estimate?",
        "order_id": "",
    },
    # ── AGENT PATH — seller_analysis ──────────────────────────────────────
    {
        "label": "Seller Reliability (ID inline)",
        "query": "Is seller 1f50f920176fa81dab994f9023523100 reliable? What is their record?",
        "order_id": "",
    },
    {
        "label": "Seller Complaint Rate (ID in box)",
        "query": "What is the complaint rate and late delivery rate for this seller?",
        "order_id": "0015a82c2db000af6aaaf3ae2ecb0532",
    },
    {
        "label": "Seller Performance Flag (ID inline)",
        "query": "Is seller 3504c0cb71d7fa48d967e0e4c94d59d3 flagged for poor performance?",
        "order_id": "",
    },
    # ── RAG PATH — policy_query ────────────────────────────────────────────
    {
        "label": "Return Policy",
        "query": "How long do I have to return a product and what is the process?",
        "order_id": "",
    },
    {
        "label": "Refund Timeline",
        "query": "How long does a refund typically take after I submit a request?",
        "order_id": "",
    },
    {
        "label": "Consumer Rights",
        "query": "What are my consumer rights if a seller refuses to accept my return?",
        "order_id": "",
    },
    # ── RAG PATH — product_issue ───────────────────────────────────────────
    {
        "label": "Damaged Product",
        "query": "I received a damaged product. The screen is cracked. What should I do?",
        "order_id": "",
    },
    {
        "label": "Wrong Item Delivered",
        "query": "The item delivered to me is completely different from what I ordered. How do I resolve this?",
        "order_id": "",
    },
    # ── RAG PATH — general ─────────────────────────────────────────────────
    {
        "label": "Payment Methods",
        "query": "What payment methods are accepted on the platform?",
        "order_id": "",
    },
    {
        "label": "No ID — Clarification Expected",
        "query": "Where is my order? I need to know right now.",
        "order_id": "",
    },
]

# ── Helper ───────────────────────────────────────────────────────────────────
def call_api(query: str, order_id: str = "") -> dict:
    payload = json.dumps({
        "query": query,
        "order_id": order_id,
        "session_id": "demo_runner",
        "use_rewrite": True,
        "use_mq": False,
        "use_comp": False,
    }).encode()

    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.reason}"}
    except Exception as e:
        return {"error": str(e)}


def truncate(text: str, n: int = 180) -> str:
    text = str(text).replace("\n", " ").strip()
    return text[:n] + "…" if len(text) > n else text


def md_escape(text: str) -> str:
    return text.replace("|", "\\|")


# ── Run queries ───────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print("  GRACE Demo Runner — 15 queries")
print(f"{'='*60}\n")

results = []
for i, q in enumerate(QUERIES, 1):
    print(f"[{i:02d}/15] {q['label']}...")
    t0 = time.time()
    resp = call_api(q["query"], q.get("order_id", ""))
    wall = round(time.time() - t0, 2)

    entry = {
        "id": i,
        "label": q["label"],
        "query": q["query"],
        "order_id_provided": q.get("order_id", ""),
        "intent": resp.get("intent", "—"),
        "path": resp.get("mode", "—"),
        "tools_called": resp.get("reasoning", {}).get("tool_calls", []),
        "answer": resp.get("answer", resp.get("error", "ERROR")),
        "latency_s": resp.get("latency", wall),
        "docs_used": resp.get("documents_retrieved", 0),
        "error": resp.get("error"),
    }
    results.append(entry)
    status = "OK" if not entry["error"] else "ERR"
    print(f"       {status}  intent={entry['intent']}  path={entry['path']}  latency={entry['latency_s']}s")
    time.sleep(1)  # avoid rate-limit spikes

print(f"\n{'='*60}")
print("  All queries complete.")
print(f"{'='*60}\n")

# ── Save raw JSON ─────────────────────────────────────────────────────────────
out_dir = Path(__file__).parent.parent / "results"
out_dir.mkdir(exist_ok=True)
json_path = out_dir / "demo_results.json"
json_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
print(f"Raw JSON saved -> {json_path}")

# ── Generate Markdown report ──────────────────────────────────────────────────
md_lines = []

md_lines += [
    "# GRACE — Demo Query Results",
    "",
    "> **System:** Grounded Retrieval Agentic Customer Support Engine  ",
    "> **Queries run:** 15  ",
    f"> **API endpoint:** `{API_URL}`  ",
    "",
    "---",
    "",
    "## Summary Table",
    "",
    "| # | Label | Intent | Path | Tools Called | Latency | Docs |",
    "|---|-------|--------|------|--------------|---------|------|",
]

for r in results:
    tools = ", ".join(r["tools_called"]) if r["tools_called"] else "—"
    md_lines.append(
        f"| {r['id']} | {md_escape(r['label'])} "
        f"| `{r['intent']}` "
        f"| **{r['path'].upper()}** "
        f"| `{tools}` "
        f"| {r['latency_s']}s "
        f"| {r['docs_used']} |"
    )

md_lines += [
    "",
    "---",
    "",
    "## Detailed Results",
    "",
]

for r in results:
    tools = ", ".join(r["tools_called"]) if r["tools_called"] else "—"
    answer_wrapped = textwrap.fill(r["answer"], width=100)

    md_lines += [
        f"### {r['id']}. {r['label']}",
        "",
        f"| Field | Value |",
        f"|-------|-------|",
        f"| **Prompt** | {md_escape(r['query'])} |",
        f"| **Order/Seller ID supplied** | `{r['order_id_provided'] or '—'}` |",
        f"| **Intent Classified** | `{r['intent']}` |",
        f"| **Path Used** | **{r['path'].upper()}** |",
        f"| **Tools Called** | `{tools}` |",
        f"| **Latency** | {r['latency_s']} s |",
        f"| **Docs Retrieved** | {r['docs_used']} |",
        "",
        "**Answer Generated:**",
        "",
        f"> {md_escape(truncate(r['answer'], 400))}",
        "",
        "---",
        "",
    ]

# Stats section
agent_count = sum(1 for r in results if r["path"] == "agent")
rag_count   = sum(1 for r in results if r["path"] == "rag_chain")
avg_lat     = round(sum(r["latency_s"] for r in results) / len(results), 2)
errors      = sum(1 for r in results if r.get("error"))

intents = {}
for r in results:
    intents[r["intent"]] = intents.get(r["intent"], 0) + 1

md_lines += [
    "## Aggregate Statistics",
    "",
    f"| Metric | Value |",
    f"|--------|-------|",
    f"| Total Queries | {len(results)} |",
    f"| Agent Path | {agent_count} |",
    f"| RAG Chain Path | {rag_count} |",
    f"| Average Latency | {avg_lat} s |",
    f"| Errors | {errors} |",
    "",
    "**Intent Distribution:**",
    "",
    "| Intent | Count |",
    "|--------|-------|",
]
for k, v in sorted(intents.items(), key=lambda x: -x[1]):
    md_lines.append(f"| `{k}` | {v} |")

md_lines += ["", "---", "", "*Generated by `demo_runner.py`*", ""]

md_path = out_dir / "demo_results.md"
md_path.write_text("\n".join(md_lines), encoding="utf-8")
print(f"Markdown report saved -> {md_path}")
print("\nDone.")
