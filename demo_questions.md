# 🎓 Demo Question Cheat Sheet — Olist RAG Agent

> All IDs are **real entries** from your `order_lookup.parquet` and `seller_kpi.parquet` files.  
> Expected answers are based on the **actual values** in your database.

---

## PATH 1 — RAG Fast Path (No ID provided → Policy / General Questions)

**How it works:** No `order_id` entered → system uses FAISS + BM25 retrieval on the knowledge base.  
**Mode shown in UI:** `rag_chain`

---

### Question 1A — Return Policy
> **"What is the return policy for products purchased on Olist?"**

**Expected Answer (verify these points):**
- Should mention a **7-day return window** after delivery
- Should explain that the **product must be unused** and in original packaging
- Should mention contacting the **seller directly** first
- Source documents should appear in the UI (≥2 documents retrieved)
- `mode` = `rag_chain`, `intent` = `return_policy` or `policy_query`

---

### Question 1B — Refund Timeline
> **"How long does it take to get a refund after I return an item?"**

**Expected Answer (verify these points):**
- Should mention refunds going back to the **original payment method**
- Credit card refunds typically take **1-2 billing cycles**
- Boleto refunds handled differently (bank transfer)
- `mode` = `rag_chain`, `intent` = `refund_request` or `policy_query`

---

### Question 1C — Product Complaint (General)
> **"I received a damaged product, what should I do?"**

**Expected Answer (verify these points):**
- Should advise **taking photos** of the damaged item
- Should recommend **opening a dispute** within 7 days
- Should mention Olist's buyer protection guarantee
- `mode` = `rag_chain`

---

## PATH 2 — Agent: `order_lookup` Tool (✅ On-Time / Good Order)

**How it works:** Enter Order ID in the ID field + ask a transactional question → agent calls `order_lookup` tool.  
**Mode shown in UI:** `agent`

---

### Question 2A — Checking a Delivered On-Time Order

**Order ID to enter in the UI field:**
```
47770eb9100c2d0c44946d9cf07ec65d
```

**Question to type:**
> **"What is the status of my order?"**

**Expected Answer (verify these values exactly):**
| Field | Value |
|---|---|
| Status | `delivered` |
| Purchased | 2018-08-08 |
| Estimated Delivery | 2018-09-04 |
| Actual Delivery | 2018-08-17 |
| Delivery Performance | **18 days early** (on time ✅) |
| Payment | Credit card, R$179.12 |
| Category | Auto parts |
| Review Score | 5/5 |

The agent should say something like:
> *"Your order `47770eb9100c2d0c44946d9cf07ec65d` has been successfully delivered! It arrived on August 17, 2018 — **18 days ahead** of the estimated September 4 date. The order was an auto parts item paid via credit card for R$179.12."*

---

## PATH 3 — Agent: `order_lookup` Tool (⚠️ Late / Problematic Order)

---

### Question 3A — Late Delivery Complaint

**Order ID to enter in the UI field:**
```
203096f03d82e0dffbc41ebc2e2bcfb7
```

**Question to type:**
> **"My order arrived very late, I'm really frustrated. Can you check what happened?"**

**Expected Answer (verify these values):**
| Field | Value |
|---|---|
| Status | `delivered` |
| Purchased | 2017-09-18 |
| Estimated Delivery | 2017-09-28 |
| Actual Delivery | 2017-10-09 |
| Delay | **11 days late** ⚠️ |
| Payment | Boleto, R$118.86 |
| Category | Health & Beauty |
| Issue Flag | `severe_delay` |
| Review Score | 2/5 |

The agent should acknowledge the delay, apologize, and offer next steps (refund/return options). It should **not** escalate since it successfully retrieved the data.

---

### Question 3B — Missing / Lost Package

**Order ID to enter in the UI field:**
```
ee64d42b8cf066f35eac1cf57de1aa85
```

**Question to type:**
> **"Where is my order? It was supposed to arrive weeks ago and I still haven't received it."**

**Expected Answer (verify these values):**
| Field | Value |
|---|---|
| Status | `shipped` (never delivered ❌) |
| Purchased | 2018-06-04 |
| Estimated Delivery | 2018-06-28 |
| Actual Delivery | **Never delivered** |
| Issue Flag | `package_lost` |
| Payment | Boleto, R$22.36 |
| Category | Health & Beauty |

The agent should flag this as a **lost package**, express urgency, and likely suggest escalation or a refund investigation.

---

## PATH 4 — Agent: `seller_analysis` Tool

**How it works:** Enter Seller ID in the ID field + ask about a seller's performance → agent calls `seller_analysis` tool.  
**Mode shown in UI:** `agent`

---

### Question 4A — Flagged / Bad Seller

**Seller ID to enter in the UI field:**
```
00fc707aaaad2d31347cf883cd2dfe10
```

**Question to type:**
> **"I keep having problems with this seller. Are they reliable?"**

**Expected Answer (verify these values):**
| Metric | Value |
|---|---|
| Avg Rating | 3.72 / 5 |
| Late Delivery Rate | 3.5% |
| Complaint Rate | **25.9%** ⚠️ |
| Total Orders | 143 |
| Flagged | **Yes** 🚩 |

The agent should warn you that this seller has a **high complaint rate of ~26%** and is **flagged** in the system, and may suggest escalating to support or avoiding this seller.

---

### Question 4B — Good / Reliable Seller

**Seller ID to enter in the UI field:**
```
003554e2dce176b5555353e4f3555ac8
```

**Question to type:**
> **"Can you check the performance of this seller before I buy from them?"**

**Expected Answer (verify these values):**
| Metric | Value |
|---|---|
| Avg Rating | **5.0 / 5** ✅ |
| Late Delivery Rate | 0% |
| Complaint Rate | 0% |
| Total Orders | 1 |
| Flagged | No 🟢 |

The agent should give a **positive assessment** — perfect rating, no complaints, no late deliveries.

---

## PATH 5 — Agent: `escalate_to_human` Tool

**How it works:** Agent triggers escalation when the issue is too complex or unresolved after tool calls.

---

### Question 5A — Forced Escalation

**Order ID to enter:**
```
ee64d42b8cf066f35eac1cf57de1aa85
```

**Question to type:**
> **"I want a full refund immediately, this is completely unacceptable. I need to speak to a human agent right now. My package has been lost and I've been waiting for months."**

**Expected Answer:**
> *"ESCALATED: This case has been flagged for human review. Reason: Customer reporting lost package and requesting immediate human assistance. A support specialist will contact you within 4 hours via email."*

- `escalated` field in UI should show `true`
- `tool_calls` should show `escalate_to_human` was called

---

## 📋 Quick Reference Table

| Screenshot # | Path | ID Required? | Intent Triggered | Tool Called | Mode |
|---|---|---|---|---|---|
| 1A | RAG | ❌ No | `policy_query` | None | `rag_chain` |
| 1B | RAG | ❌ No | `refund_request` | None | `rag_chain` |
| 1C | RAG | ❌ No | `general` | None | `rag_chain` |
| 2A | Agent | ✅ Order ID | `order_status` | `order_lookup` | `agent` |
| 3A | Agent | ✅ Order ID | `delivery_issue` | `order_lookup` | `agent` |
| 3B | Agent | ✅ Order ID | `delivery_issue` | `order_lookup` | `agent` |
| 4A | Agent | ✅ Seller ID | `seller_issue` | `seller_analysis` | `agent` |
| 4B | Agent | ✅ Seller ID | `seller_issue` | `seller_analysis` | `agent` |
| 5A | Agent | ✅ Order ID | `delivery_issue` | `escalate_to_human` | `agent` |

---

> [!TIP]
> For the best screenshots, make sure the **Reasoning Panel** or **Sources** section is visible in the UI when you take the screenshot — it will show which tools were called and how many documents were retrieved.
