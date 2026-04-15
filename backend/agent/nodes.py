"""
LangGraph graph node definitions — exact replica of Phase 3 Cells 15-16.
"""
from __future__ import annotations

import re

from langchain_core.messages import SystemMessage

from agent.state import AgentState
from agent.tools import TOOLS
from rag.intent import classify_intent


SYSTEM_PROMPT = '''You are an expert Olist e-commerce customer support agent with access to database and knowledge tools.

════════════════════════════════════════════
HOW TO CALL TOOLS — READ THIS FIRST
════════════════════════════════════════════
You have structured tools available via function calling.
You MUST invoke them through the function-calling interface ONLY.

NEVER do this (writing tool calls as raw text):
   seller_analysis>{"seller_id": "abc123"}
   <order_lookup>{"order_id": "abc123"}</order_lookup>
   <seller_analysis>{"seller_id": "abc123"}</function>

ALWAYS do this: use the tool button/function-call interface silently.
   Your response text should ONLY be the natural-language answer to the customer.
   The tool call itself is invisible to the customer — never print it.

If you are unsure whether to call a tool, call it. Never output raw JSON or XML.
════════════════════════════════════════════

TOOL PRIORITY — follow this order strictly. The FIRST matching rule wins:

1. order_lookup — USE FIRST when an order ID (32-char hex) is present in the message or in an [ID tag].
   This covers ANY question about that order: status, delivery date, payment, category, delays, refunds.
   INPUT: the exact order_id string.

2. seller_analysis — USE when a seller ID is present AND the question is about a seller\'s performance, complaints, or rating.
   INPUT: the exact seller_id string.

3. rag_search — USE for general policy questions, return rules, refund timelines, platform how-to questions
   where NO specific order/seller ID lookup is needed.
   Also use AFTER order_lookup if you still need policy context (e.g. refund eligibility rules).

4. escalate_to_human — USE ONLY when the issue is genuinely unresolvable after 2 tool calls,
   or the customer explicitly demands a human. Do NOT escalate prematurely.

5. Respond naturally (no tool) — USE when you already have all info from tool results, OR the message
   is a greeting / thank-you / clearly off-topic.

RESPONSE FORMAT RULES:
- Begin your response DIRECTLY with the answer. Never start with "Direct reply:", "Note:", "Based on tool results:", "Assumption:", or any other meta-label.
- Do not add caveats like "Note: the values may vary" or "Based on the assumption that...". Only state facts from the tool result.
- Be concise and warm. One clear paragraph is ideal.
- Do not repeat the same sentence twice in the same response.

CRITICAL RULES:
- An ID may be injected as "[The user has explicitly provided an ID (Order or Seller): <id>]" — treat that as the ID.
- NEVER invent order details, prices, or dates. Use only what the tool returns.
- After order_lookup or seller_analysis returns data, synthesize it into a clear, empathetic response.
- If the tool result has all the information needed — answer directly. Do NOT call rag_search unnecessarily.'''


# Regex to detect pseudo-XML tool calls the LLM writes as text instead of function-calling.
# Handles all closing tag variants the LLM uses:
#   <seller_analysis>{...}</seller_analysis>   (correct but still text)
#   <seller_analysis>{...}</function>           (llama-3 common variant)
#   <seller_analysis>{...}                      (no closing tag at all)
_PSEUDO_XML_RE = re.compile(
    r'<(seller_analysis|order_lookup|rag_search|escalate_to_human)>'
    r'\s*(.*?)\s*'
    r'(?:</[^>]+>|$)',
    re.DOTALL,
)


def build_agent_node(llm_with_tools):
    """Create the agent_node closure with the bound LLM."""

    def agent_node(state: AgentState) -> dict:
        """Main reasoning node — decides what tools to call or generates
        final answer."""
        messages = ([SystemMessage(content=SYSTEM_PROMPT)]
                    + list(state['messages']))
        response = llm_with_tools.invoke(messages)

        # Guard: detect when llama emits pseudo-XML tool calls as plain text
        content = getattr(response, 'content', '')
        if (content and _PSEUDO_XML_RE.search(content)
                and not (hasattr(response, 'tool_calls') and response.tool_calls)):
            # LLM wrote tool calls as text — force a proper tool call
            from langchain_core.messages import AIMessage
            import json as _json

            xml_match = _PSEUDO_XML_RE.search(content)
            tool_name = xml_match.group(1)
            raw_body = xml_match.group(0)

            # Try to extract JSON args from the pseudo-XML body
            args = {}
            json_match = re.search(r'\{[^}]+\}', raw_body)
            if json_match:
                try:
                    args = _json.loads(json_match.group(0))
                except _json.JSONDecodeError:
                    pass

            # If no JSON args found, try to extract quoted values
            if not args:
                # Extract the ID from state if available
                order_id = state.get('order_id', '')
                if tool_name == 'seller_analysis' and order_id:
                    args = {'seller_id': order_id}
                elif tool_name == 'order_lookup' and order_id:
                    args = {'order_id': order_id}
                elif tool_name == 'rag_search':
                    last_user = state['messages'][-1].content if state['messages'] else ''
                    args = {'query': last_user}
                elif tool_name == 'escalate_to_human':
                    args = {'reason': 'Unable to resolve after multiple tool calls.'}

            # Build a proper AIMessage with tool_calls
            response = AIMessage(
                content='',
                tool_calls=[{
                    'name': tool_name,
                    'args': args,
                    'id': f'fix_{tool_name}_{state.get("tool_call_count", 0)}',
                }],
            )

        return {
            'messages': [response],
            'tool_call_count': state.get('tool_call_count', 0),
        }

    return agent_node


def extract_metadata_node(state: AgentState) -> dict:
    """Extract order/seller ID and intent from the latest user message."""
    last_msg = (state['messages'][-1].content
                if state['messages'] else '')

    # Extract any 32-char hex ID (works for both order and seller IDs)
    order_match = re.search(r'\b([a-f0-9]{32})\b', last_msg)
    # Also check the injected [ID tag] that _agent_answer appends
    tag_match = re.search(
        r'\[The user has explicitly provided an ID.*?:\s*([a-f0-9]{32})\]',
        last_msg,
    )
    order_id = (tag_match.group(1) if tag_match
                else order_match.group(1) if order_match
                else state.get('order_id', ''))

    intent = classify_intent(last_msg).value

    return {'order_id': order_id, 'intent': intent}


def build_tools_node():
    """Create the tools execution node."""
    from langgraph.prebuilt import ToolNode

    tool_executor = ToolNode(TOOLS)

    def tools_node(state: AgentState) -> dict:
        """Execute tool calls, increment counter, check escalation."""
        result = tool_executor.invoke(state)
        count = state.get('tool_call_count', 0) + 1
        # Check if escalation was triggered
        last_msg = result.get('messages', [{}])[-1]
        escalated = 'ESCALATED' in str(getattr(last_msg, 'content', ''))
        return {**result, 'tool_call_count': count, 'escalated': escalated}

    return tools_node


# ── Routing functions (conditional edges) ─────────────────────


def should_continue(state: AgentState) -> str:
    """
    After the agent node, decide:
    - 'tools'    → agent wants to call a tool
    - 'end'      → agent is done, return answer
    """
    last_msg = state['messages'][-1]
    count = state.get('tool_call_count', 0)

    # Guard: max 3 tool calls per query to prevent infinite loops
    if count >= 3:
        return 'end'

    # If escalated, stop
    if state.get('escalated', False):
        return 'end'

    # Check if the LLM made tool calls
    if hasattr(last_msg, 'tool_calls') and last_msg.tool_calls:
        return 'tools'

    return 'end'


def after_tools(state: AgentState) -> str:
    """After tools execute, always return to agent for synthesis."""
    if state.get('escalated', False):
        return 'end'
    return 'agent'
