# GRACE — Demo Query Results

> **System:** Grounded Retrieval Agentic Customer Support Engine  
> **Queries run:** 15  
> **API endpoint:** `http://localhost:8000/chat`  

---

## Summary Table

| # | Label | Intent | Path | Tools Called | Latency | Docs |
|---|-------|--------|------|--------------|---------|------|
| 1 | Order Status (ID inline) | `order_status` | **AGENT** | `order_lookup` | 1.911s | 0 |
| 2 | Delivery Delay (ID in box) | `order_status` | **AGENT** | `order_lookup` | 30.94s | 0 |
| 3 | Refund Eligibility (ID inline) | `refund_request` | **AGENT** | `order_lookup, rag_search` | 13.701s | 0 |
| 4 | Payment Details (ID in box) | `policy_query` | **AGENT** | `order_lookup` | 34.509s | 0 |
| 5 | Delivery Date Check (ID inline) | `policy_query` | **AGENT** | `order_lookup` | 31.85s | 0 |
| 6 | Seller Reliability (ID in box) | `seller_issue` | **AGENT** | `seller_analysis` | 4.636s | 0 |
| 7 | Seller Complaint Rate (ID in box) | `policy_query` | **AGENT** | `seller_analysis` | 39.219s | 0 |
| 8 | Seller Performance Flag (ID inline) | `policy_query` | **AGENT** | `seller_analysis` | 38.089s | 0 |
| 9 | Return Policy | `policy_query` | **RAG CHAIN** | `none` | 17.991s | 5 |
| 10 | Refund Timeline | `policy_query` | **RAG CHAIN** | `none` | 20.519s | 5 |
| 11 | Consumer Rights | `policy_query` | **RAG CHAIN** | `none` | 24.152s | 5 |
| 12 | Damaged Product | `product_issue` | **RAG CHAIN** | `none` | 3.427s | 5 |
| 13 | Wrong Item Delivered | `product_issue` | **RAG CHAIN** | `none` | 24.972s | 5 |
| 14 | Payment Methods | `policy_query` | **RAG CHAIN** | `none` | 3.58s | 5 |
| 15 | No ID — Clarification Expected | `order_status` | **RAG CHAIN** | `none` | 17.648s | 5 |

---

## Detailed Results

### 1. Order Status (ID inline)

| Field | Value |
|-------|-------|
| **Prompt** | What is the current status of my order e481f51cbdc54678b7cc49136f2d6af7? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `order_status` |
| **Path Used** | **AGENT** |
| **Tools Called** | `order_lookup` |
| **Latency** | 1.911 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> Your order e481f51cbdc54678b7cc49136f2d6af7 has been delivered on time. It was purchased on October 2nd, 2017, and the estimated delivery date was October 18th, 2017. However, it was actually delivered on October 10th, 2017. The payment method used was a credit card for R$18.12, and the category of the item is housewares.

---

### 2. Delivery Delay (ID in box)

| Field | Value |
|-------|-------|
| **Prompt** | My package is very late. Can you tell me what happened? |
| **ID Supplied** | `203096f03d82e0dffbc41ebc2e2bcfb7` |
| **Intent Classified** | `order_status` |
| **Path Used** | **AGENT** |
| **Tools Called** | `order_lookup` |
| **Latency** | 30.94 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> Your order 203096f03d82e0dffbc41ebc2e2bcfb7 was delivered 11 days late. The estimated delivery date was September 28th, 2017, but it was actually delivered on October 9th, 2017.

---

### 3. Refund Eligibility (ID inline)

| Field | Value |
|-------|-------|
| **Prompt** | Is order 83422b2b70c1aa20c57b21f09a52cf3c eligible for a refund? It arrived very late. |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `refund_request` |
| **Path Used** | **AGENT** |
| **Tools Called** | `order_lookup, rag_search` |
| **Latency** | 13.701 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> Unfortunately, we couldn't find any information about your order 83422b2b70c1aa20c57b21f09a52cf3c in our system. However, based on our general refund policy, if your order was delivered late, you may be eligible for a refund. Please contact our support team so we can look into this further and assist you with your issue.

---

### 4. Payment Details (ID in box)

| Field | Value |
|-------|-------|
| **Prompt** | How was the payment made for my order and what was the total amount? |
| **ID Supplied** | `e481f51cbdc54678b7cc49136f2d6af7` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **AGENT** |
| **Tools Called** | `order_lookup` |
| **Latency** | 34.509 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> The payment for your order e481f51cbdc54678b7cc49136f2d6af7 was made using a credit card for a total amount of R$18.12.

---

### 5. Delivery Date Check (ID inline)

| Field | Value |
|-------|-------|
| **Prompt** | When was order e481f51cbdc54678b7cc49136f2d6af7 actually delivered versus the estimate? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **AGENT** |
| **Tools Called** | `order_lookup` |
| **Latency** | 31.85 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> Your order e481f51cbdc54678b7cc49136f2d6af7 was actually delivered on time, on 2017-10-10 21:25:13, which is before the estimated delivery date of 2017-10-18 00:00:00.

---

### 6. Seller Reliability (ID in box)

| Field | Value |
|-------|-------|
| **Prompt** | Please analyse this seller and tell me if they are trustworthy and what their performance looks like. |
| **ID Supplied** | `1f50f920176fa81dab994f9023523100` |
| **Intent Classified** | `seller_issue` |
| **Path Used** | **AGENT** |
| **Tools Called** | `seller_analysis` |
| **Latency** | 4.636 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> This seller has an average rating of 4.0 out of 5, which suggests they are generally well-regarded by customers. However, their late delivery rate is 8.2%, which is slightly higher than average, and their complaint rate is 18.2%, which is also higher than average. This may indicate some issues with their shipping or customer service. Despite this, they have a large number of total orders (2017) and have not been flagged as a potentially untrustworthy seller.

---

### 7. Seller Complaint Rate (ID in box)

| Field | Value |
|-------|-------|
| **Prompt** | What is the complaint rate and late delivery rate for this seller? |
| **ID Supplied** | `0015a82c2db000af6aaaf3ae2ecb0532` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **AGENT** |
| **Tools Called** | `seller_analysis` |
| **Latency** | 39.219 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> Note: The seller has a high complaint rate and no late deliveries, but a low average rating.

---

### 8. Seller Performance Flag (ID inline)

| Field | Value |
|-------|-------|
| **Prompt** | Is seller 1f50f920176fa81dab994f9023523100 flagged for poor performance? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **AGENT** |
| **Tools Called** | `seller_analysis` |
| **Latency** | 38.089 s |
| **Docs Retrieved** | 0 |

**Answer Generated:**

> The seller 1f50f920176fa81dab994f9023523100 has an average rating of 4.0 out of 5, a late delivery rate of 8.2%, and a complaint rate of 18.2%. They have completed a total of 2017 orders and are not currently flagged for poor performance.

---

### 9. Return Policy

| Field | Value |
|-------|-------|
| **Prompt** | How long do I have to return a product and what is the process? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **RAG CHAIN** |
| **Tools Called** | `none` |
| **Latency** | 17.991 s |
| **Docs Retrieved** | 5 |

**Answer Generated:**

> Hello, I'd be happy to help you with your question about returning a product.   According to our platform policy (Source 1), you have the right to return any product within 7 (seven) calendar days of receiving the item, in accordance with Article 49 of the Brazilian Consumer Defense Code (Codigo de Defesa do Consumidor - CDC) (Source 5). This right applies to purchases made online without the need to provide a reason.  If the product is defective or damaged, the return window is extended to 30 d...

---

### 10. Refund Timeline

| Field | Value |
|-------|-------|
| **Prompt** | How long does a refund typically take after I submit a request? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **RAG CHAIN** |
| **Tools Called** | `none` |
| **Latency** | 20.519 s |
| **Docs Retrieved** | 5 |

**Answer Generated:**

> Hello, I'd be happy to help you with your question about refund processing time.   According to our platform policy (Source 1), the refund processing timeline varies depending on the payment method used. For credit card payments, it takes 5-10 business days (up to 2 billing cycles) to process the refund. For Boleto bancario, it takes 3-5 business days to the registered bank account. For debit payments, it takes 3-7 business days, and for gift vouchers, it takes 1-2 business days (reissued as sto...

---

### 11. Consumer Rights

| Field | Value |
|-------|-------|
| **Prompt** | What are my consumer rights if a seller refuses to accept my return? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **RAG CHAIN** |
| **Tools Called** | `none` |
| **Latency** | 24.152 s |
| **Docs Retrieved** | 5 |

**Answer Generated:**

> Hello, I'd be happy to help you with your question about consumer rights if a seller refuses to accept your return.  According to our platform policy (Source 1), you have the right to return any product within 7 (seven) calendar days of receiving the item, in accordance with Article 49 of the Brazilian Consumer Defense Code (Codigo de Defesa do Consumidor - CDC). This right applies to purchases made online without the need to provide a reason.  If a seller refuses to accept your return, you may ...

---

### 12. Damaged Product

| Field | Value |
|-------|-------|
| **Prompt** | I received a damaged product. The screen is cracked. What should I do? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `product_issue` |
| **Path Used** | **RAG CHAIN** |
| **Tools Called** | `none` |
| **Latency** | 3.427 s |
| **Docs Retrieved** | 5 |

**Answer Generated:**

> Hello, I'm here to help you with your damaged product issue.   Based on our platform policy (Source 1), you have the right to return any product within 7 (seven) calendar days of receiving the item, in accordance with Article 49 of the Brazilian Consumer Defense Code.   If your product is damaged, you can choose to either request a replacement or a refund. To initiate the return process, please contact our customer support team with your Order ID so we can assist you further.

---

### 13. Wrong Item Delivered

| Field | Value |
|-------|-------|
| **Prompt** | The item delivered to me is completely different from what I ordered. How do I resolve this? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `product_issue` |
| **Path Used** | **RAG CHAIN** |
| **Tools Called** | `none` |
| **Latency** | 24.972 s |
| **Docs Retrieved** | 5 |

**Answer Generated:**

> Hello, I'm here to help you with your product issue.   Based on our platform policy (Source 1), you have the right to return any product within 7 (seven) calendar days of receiving the item, in accordance with Article 49 of the Brazilian Consumer Defense Code.   If your product is not as described, you have two resolution options: replacement or refund. To proceed, please provide your Order ID so I can assist you further.

---

### 14. Payment Methods

| Field | Value |
|-------|-------|
| **Prompt** | What payment methods are accepted on the platform? |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `policy_query` |
| **Path Used** | **RAG CHAIN** |
| **Tools Called** | `none` |
| **Latency** | 3.58 s |
| **Docs Retrieved** | 5 |

**Answer Generated:**

> Hello, I'd be happy to help you with your question about payment methods on our platform.  According to our platform policy, we accept various payment methods, including cash and installments (Source 1). However, I couldn't find any specific information on the accepted payment methods, their timeframes, or eligibility conditions in the provided sources.   To provide a more precise answer, I would need additional information, such as the specific payment method you're interested in or any relevan...

---

### 15. No ID — Clarification Expected

| Field | Value |
|-------|-------|
| **Prompt** | Where is my order? I need to know right now. |
| **ID Supplied** | `none (detected inline or absent)` |
| **Intent Classified** | `order_status` |
| **Path Used** | **RAG CHAIN** |
| **Tools Called** | `none` |
| **Latency** | 17.648 s |
| **Docs Retrieved** | 5 |

**Answer Generated:**

> Hello, I'd be happy to help you with your question about your order status.   Based on our platform policy (Source 1), we strive to deliver orders on time. However, I couldn't find any specific information on your order status without the Order ID. Could you please provide the Order ID so I can assist you further?

---

## Aggregate Statistics

| Metric | Value |
|--------|-------|
| Total Queries | 15 |
| Agent Path | 8 |
| RAG Chain Path | 7 |
| Average Latency | 20.48 s |
| Errors | 0 |

**Intent Distribution:**

| Intent | Count |
|--------|-------|
| `policy_query` | 8 |
| `order_status` | 3 |
| `product_issue` | 2 |
| `refund_request` | 1 |
| `seller_issue` | 1 |

---

*Generated by GRACE `demo_runner.py`*
