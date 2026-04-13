#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from typing import Any, Dict, Optional


SERVER_NAME = "salonbw-devil-ssh"
SERVER_VERSION = "0.1.0"


def read_message() -> Optional[Dict[str, Any]]:
    headers: Dict[str, str] = {}
    while True:
        line = sys.stdin.buffer.readline()
        if not line:
            return None
        if line in (b"\r\n", b"\n"):
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


def make_text_result(text: str) -> Dict[str, Any]:
    return {"content": [{"type": "text", "text": text}]}


def server_error(message: str) -> Dict[str, Any]:
    return {"code": -32000, "message": message}


def resolve_target() -> str:
    user = os.environ.get("MYDEVIL_SSH_USER", "").strip()
    host = os.environ.get("MYDEVIL_SSH_HOST", "").strip()
    if user and host:
        return f"{user}@{host}"
    return os.environ.get("SALONBW_DEVIL_TARGET", "devil").strip() or "devil"


def base_ssh_command() -> list[str]:
    cmd = ["ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=no"]
    key_path = os.environ.get("MYDEVIL_SSH_KEY_PATH", "").strip()
    if key_path:
      cmd.extend(["-i", key_path])
    cmd.append(resolve_target())
    return cmd


def run_remote(command: str, timeout_sec: int = 30) -> str:
    result = subprocess.run(
        base_ssh_command() + [command],
        capture_output=True,
        text=True,
        timeout=timeout_sec,
        check=False,
    )
    output = []
    output.append(f"$ ssh {resolve_target()} {command}")
    if result.stdout:
        output.append(result.stdout.rstrip())
    if result.stderr:
        output.append(result.stderr.rstrip())
    output.append(f"[exit_code={result.returncode}]")
    return "\n".join(part for part in output if part)


def handle_tool_call(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if name == "devil_target":
            text = "\n".join(
                [
                    f"target={resolve_target()}",
                    f"key_path={'set' if os.environ.get('MYDEVIL_SSH_KEY_PATH') else 'unset'}",
                ]
            )
            return make_text_result(text)

        if name == "devil_www_list":
            return make_text_result(run_remote("devil www list", timeout_sec=30))

        if name == "devil_restart_domain":
            domain = str(arguments.get("domain", "")).strip()
            if not domain:
                raise ValueError("domain is required")
            return make_text_result(
                run_remote(f"devil www restart '{domain}'", timeout_sec=60)
            )

        if name == "devil_tail_log":
            app = str(arguments.get("app", "")).strip()
            log_type = str(arguments.get("log_type", "app")).strip()
            lines = int(arguments.get("lines", 200))
            if not app:
                raise ValueError("app is required")
            if log_type not in {"app", "passenger"}:
                raise ValueError("log_type must be 'app' or 'passenger'")
            lines = max(1, min(lines, 1000))
            remote = (
                f"tail -n {lines} ~/logs/nodejs/{app}/app.log"
                if log_type == "app"
                else f"tail -n {lines} ~/logs/nodejs/{app}/passenger.log"
            )
            return make_text_result(run_remote(remote, timeout_sec=30))

        if name == "devil_exec":
            command = str(arguments.get("command", "")).strip()
            timeout_sec = int(arguments.get("timeout_sec", 30))
            if not command:
                raise ValueError("command is required")
            timeout_sec = max(1, min(timeout_sec, 300))
            return make_text_result(run_remote(command, timeout_sec=timeout_sec))

        raise ValueError(f"unknown tool: {name}")
    except subprocess.TimeoutExpired:
        return make_text_result("[timeout]")
    except Exception as exc:
        raise ValueError(str(exc)) from exc


def tools_definition() -> list[Dict[str, Any]]:
    return [
        {
            "name": "devil_target",
            "description": "Show the SSH target and whether a key path is configured.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "devil_www_list",
            "description": "Run `devil www list` on the MyDevil host.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "devil_restart_domain",
            "description": "Restart a MyDevil domain with `devil www restart <domain>`.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "domain": {"type": "string", "description": "Domain to restart."}
                },
                "required": ["domain"],
            },
        },
        {
            "name": "devil_tail_log",
            "description": "Tail app or passenger log for a MyDevil Node app.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "app": {
                        "type": "string",
                        "description": "App directory under ~/logs/nodejs, for example api_salonbw."
                    },
                    "log_type": {
                        "type": "string",
                        "enum": ["app", "passenger"],
                        "description": "Which log file to tail."
                    },
                    "lines": {
                        "type": "integer",
                        "description": "Number of lines to return.",
                        "default": 200
                    }
                },
                "required": ["app"]
            },
        },
        {
            "name": "devil_exec",
            "description": "Run an arbitrary non-interactive shell command over SSH on the MyDevil host.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell command to run remotely."},
                    "timeout_sec": {
                        "type": "integer",
                        "description": "Remote command timeout in seconds.",
                        "default": 30
                    }
                },
                "required": ["command"]
            },
        },
    ]


def handle_request(message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
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
        return {"jsonrpc": "2.0", "id": msg_id, "result": {"tools": tools_definition()}}

    if method == "tools/call":
        params = message.get("params", {})
        name = params.get("name")
        arguments = params.get("arguments", {}) or {}
        try:
            result = handle_tool_call(str(name), arguments)
            return {"jsonrpc": "2.0", "id": msg_id, "result": result}
        except ValueError as exc:
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": server_error(str(exc)),
            }

    if msg_id is not None:
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }
    return None


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--self-test":
        print(json.dumps({"target": resolve_target(), "tools": [t["name"] for t in tools_definition()]}))
        return 0

    while True:
        message = read_message()
        if message is None:
            break
        response = handle_request(message)
        if response is not None:
            write_message(response)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
