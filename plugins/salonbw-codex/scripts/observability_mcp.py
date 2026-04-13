#!/usr/bin/env python3
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional


SERVER_NAME = "salonbw-observability"
SERVER_VERSION = "0.1.0"


def read_message() -> Optional[Dict[str, Any]]:
    headers: Dict[str, str] = {}
    while True:
        line = sys.stdin.buffer.readline()
        if not line:
            return None
        if line in (b"\n", b"\r\n"):
            break
        key, _, value = line.decode("utf-8").partition(":")
        headers[key.strip().lower()] = value.strip()
    length = int(headers.get("content-length", "0"))
    if length <= 0:
        return None
    body = sys.stdin.buffer.read(length)
    if not body:
        return None
    return json.loads(body.decode("utf-8"))


def write_message(payload: Dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    sys.stdout.buffer.write(f"Content-Length: {len(body)}\r\n\r\n".encode("utf-8"))
    sys.stdout.buffer.write(body)
    sys.stdout.buffer.flush()


def result_text(text: str) -> Dict[str, Any]:
    return {"content": [{"type": "text", "text": text}]}


def error_payload(message: str) -> Dict[str, Any]:
    return {"code": -32000, "message": message}


def build_headers(auth_mode: str = "none") -> Dict[str, str]:
    headers = {"User-Agent": "salonbw-codex-observability/0.1.0"}
    if auth_mode == "grafana":
        token = os.environ.get("GRAFANA_API_KEY", "").strip()
        if not token:
            raise ValueError("GRAFANA_API_KEY is not set")
        headers["Authorization"] = f"Bearer {token}"
    elif auth_mode == "loki-basic":
        secret = os.environ.get("LOKI_BASIC_AUTH", "").strip()
        if not secret:
            raise ValueError("LOKI_BASIC_AUTH is not set")
        encoded = base64.b64encode(secret.encode("utf-8")).decode("ascii")
        headers["Authorization"] = f"Basic {encoded}"
    return headers


def http_get(url: str, auth_mode: str = "none", timeout_sec: int = 20) -> str:
    request = urllib.request.Request(url, headers=build_headers(auth_mode))
    try:
        with urllib.request.urlopen(request, timeout=timeout_sec) as response:
            body = response.read().decode("utf-8", errors="replace")
            return "\n".join(
                [
                    f"GET {url}",
                    f"status={response.status}",
                    body.strip(),
                ]
            ).strip()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return "\n".join(
            [
                f"GET {url}",
                f"status={exc.code}",
                body.strip(),
            ]
        ).strip()


def resolve_api_url() -> str:
    return os.environ.get("SALONBW_API_URL", "https://api.salon-bw.pl").strip()


def resolve_grafana_url() -> str:
    value = os.environ.get("GRAFANA_URL", "").strip()
    if not value:
        raise ValueError("GRAFANA_URL is not set")
    return value.rstrip("/")


def resolve_prometheus_url() -> str:
    value = os.environ.get("PROMETHEUS_URL", "").strip()
    if not value:
        raise ValueError("PROMETHEUS_URL is not set")
    return value.rstrip("/")


def resolve_loki_query_url() -> str:
    value = os.environ.get("LOKI_QUERY_URL", "").strip()
    if value:
        return value.rstrip("/")
    grafana_base = os.environ.get("GRAFANA_URL", "").strip().rstrip("/")
    if grafana_base:
        return f"{grafana_base}/loki"
    raise ValueError("LOKI_QUERY_URL or GRAFANA_URL must be set")


def tool_call(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if name == "obs_targets":
        return result_text(
            "\n".join(
                [
                    f"SALONBW_API_URL={resolve_api_url()}",
                    f"GRAFANA_URL={'set' if os.environ.get('GRAFANA_URL') else 'unset'}",
                    f"PROMETHEUS_URL={'set' if os.environ.get('PROMETHEUS_URL') else 'unset'}",
                    f"LOKI_QUERY_URL={'set' if os.environ.get('LOKI_QUERY_URL') else 'unset'}",
                    f"GRAFANA_API_KEY={'set' if os.environ.get('GRAFANA_API_KEY') else 'unset'}",
                    f"LOKI_BASIC_AUTH={'set' if os.environ.get('LOKI_BASIC_AUTH') else 'unset'}",
                ]
            )
        )

    if name == "api_metrics":
        path = str(arguments.get("path", "/metrics")).strip() or "/metrics"
        if not path.startswith("/"):
            path = f"/{path}"
        return result_text(http_get(f"{resolve_api_url().rstrip('/')}{path}"))

    if name == "prometheus_query":
        query = str(arguments.get("query", "")).strip()
        if not query:
            raise ValueError("query is required")
        encoded = urllib.parse.quote(query, safe="")
        url = f"{resolve_prometheus_url()}/api/v1/query?query={encoded}"
        return result_text(http_get(url))

    if name == "loki_query":
        query = str(arguments.get("query", "")).strip()
        limit = int(arguments.get("limit", 100))
        if not query:
            raise ValueError("query is required")
        limit = max(1, min(limit, 1000))
        encoded = urllib.parse.quote(query, safe="")
        url = f"{resolve_loki_query_url()}/loki/api/v1/query_range?query={encoded}&limit={limit}"
        return result_text(http_get(url, auth_mode="loki-basic"))

    if name == "grafana_health":
        return result_text(http_get(f"{resolve_grafana_url()}/api/health", auth_mode="grafana"))

    if name == "grafana_search_dashboards":
        query = str(arguments.get("query", "")).strip()
        if not query:
            raise ValueError("query is required")
        encoded = urllib.parse.quote(query, safe="")
        return result_text(
            http_get(f"{resolve_grafana_url()}/api/search?query={encoded}", auth_mode="grafana")
        )

    raise ValueError(f"unknown tool: {name}")


def tools() -> list[Dict[str, Any]]:
    return [
        {
            "name": "obs_targets",
            "description": "Show which observability endpoints and credentials are configured in the local environment.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "api_metrics",
            "description": "Fetch raw metrics text from the SalonBW API metrics endpoint.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "default": "/metrics"}
                },
            },
        },
        {
            "name": "prometheus_query",
            "description": "Run an instant PromQL query against the configured Prometheus server.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"],
            },
        },
        {
            "name": "loki_query",
            "description": "Run a LogQL query against the configured Loki query endpoint using basic auth from env.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "limit": {"type": "integer", "default": 100}
                },
                "required": ["query"],
            },
        },
        {
            "name": "grafana_health",
            "description": "Check Grafana health using the configured Grafana API key.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "grafana_search_dashboards",
            "description": "Search Grafana dashboards by query using the configured Grafana API key.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"],
            },
        },
    ]


def handle(message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    method = message.get("method")
    msg_id = message.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
                "capabilities": {"tools": {}},
            },
        }

    if method == "notifications/initialized":
        return None

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": msg_id, "result": {"tools": tools()}}

    if method == "tools/call":
        params = message.get("params", {})
        try:
            result = tool_call(str(params.get("name")), params.get("arguments", {}) or {})
            return {"jsonrpc": "2.0", "id": msg_id, "result": result}
        except Exception as exc:
            return {"jsonrpc": "2.0", "id": msg_id, "error": error_payload(str(exc))}

    if msg_id is not None:
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }
    return None


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--self-test":
        print(json.dumps({"server": SERVER_NAME, "tools": [t["name"] for t in tools()]}))
        return 0
    while True:
        message = read_message()
        if message is None:
            break
        response = handle(message)
        if response is not None:
            write_message(response)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
