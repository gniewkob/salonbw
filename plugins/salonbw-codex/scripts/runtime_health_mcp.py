#!/usr/bin/env python3
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, Optional


SERVER_NAME = "salonbw-runtime-health"
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


def targets() -> Dict[str, str]:
    return {
        "api": os.environ.get("SALONBW_API_URL", "https://api.salon-bw.pl").rstrip("/"),
        "landing": os.environ.get("SALONBW_LANDING_URL", "https://dev.salon-bw.pl").rstrip("/"),
        "panel": os.environ.get("SALONBW_PANEL_URL", "https://panel.salon-bw.pl").rstrip("/"),
        "legacy": os.environ.get("SALONBW_LEGACY_URL", "https://salon-bw.pl").rstrip("/"),
    }


def http_check(url: str, timeout_sec: int = 15) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "salonbw-runtime-health/0.1.0"})
    try:
        with urllib.request.urlopen(request, timeout=timeout_sec) as response:
            body = response.read(1200).decode("utf-8", errors="replace")
            return "\n".join(
                [
                    f"GET {url}",
                    f"status={response.status}",
                    body.strip(),
                ]
            ).strip()
    except urllib.error.HTTPError as exc:
        body = exc.read(1200).decode("utf-8", errors="replace")
        return "\n".join(
            [
                f"GET {url}",
                f"status={exc.code}",
                body.strip(),
            ]
        ).strip()
    except Exception as exc:
        return "\n".join([f"GET {url}", f"error={exc}"])


def tool_call(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    env_targets = targets()

    if name == "runtime_targets":
        return result_text("\n".join(f"{k}={v}" for k, v in env_targets.items()))

    if name == "probe_url":
        url = str(arguments.get("url", "")).strip()
        if not url:
            raise ValueError("url is required")
        timeout_sec = max(1, min(int(arguments.get("timeout_sec", 15)), 60))
        return result_text(http_check(url, timeout_sec))

    if name == "probe_surface":
        surface = str(arguments.get("surface", "")).strip()
        path = str(arguments.get("path", "/")).strip() or "/"
        if surface not in env_targets:
            raise ValueError(f"surface must be one of: {', '.join(env_targets)}")
        if not path.startswith("/"):
            path = f"/{path}"
        return result_text(http_check(f"{env_targets[surface]}{path}"))

    if name == "probe_default_stack":
        checks = [
            ("api", "/healthz"),
            ("landing", "/"),
            ("panel", "/"),
            ("legacy", "/"),
        ]
        output = []
        for surface, path in checks:
            output.append(http_check(f"{env_targets[surface]}{path}"))
            output.append("---")
        return result_text("\n".join(output[:-1]))

    if name == "env_inventory":
        keys = [
            "SALONBW_API_URL",
            "SALONBW_LANDING_URL",
            "SALONBW_PANEL_URL",
            "SALONBW_LEGACY_URL",
            "GRAFANA_URL",
            "PROMETHEUS_URL",
            "LOKI_QUERY_URL",
            "GRAFANA_API_KEY",
            "LOKI_BASIC_AUTH",
            "MYDEVIL_SSH_HOST",
            "MYDEVIL_SSH_USER",
            "MYDEVIL_SSH_KEY_PATH",
        ]
        lines = []
        for key in keys:
            value = os.environ.get(key)
            if value:
                display = "set"
                if key.endswith("_URL"):
                    display = value
                lines.append(f"{key}={display}")
            else:
                lines.append(f"{key}=unset")
        return result_text("\n".join(lines))

    raise ValueError(f"unknown tool: {name}")


def tools() -> list[Dict[str, Any]]:
    return [
        {
            "name": "runtime_targets",
            "description": "Show default runtime target URLs for API, landing, panel, and legacy.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "probe_url",
            "description": "Probe any URL and return status plus a short body preview.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {"type": "string"},
                    "timeout_sec": {"type": "integer", "default": 15},
                },
                "required": ["url"],
            },
        },
        {
            "name": "probe_surface",
            "description": "Probe a known SalonBW surface by symbolic name and path.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "surface": {
                        "type": "string",
                        "enum": ["api", "landing", "panel", "legacy"]
                    },
                    "path": {"type": "string", "default": "/"}
                },
                "required": ["surface"],
            },
        },
        {
            "name": "probe_default_stack",
            "description": "Run the default smoke probes for API health and the three public surfaces.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "env_inventory",
            "description": "Show whether runtime, observability, and SSH-related environment variables are set locally.",
            "inputSchema": {"type": "object", "properties": {}},
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
