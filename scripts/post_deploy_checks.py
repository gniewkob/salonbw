#!/usr/bin/env python3
"""
GitHub Actions helper that runs post-deploy smoke checks with retry/backoff and
appends a summary to the job output.
"""
from __future__ import annotations

import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Iterable, List, Optional


DEFAULT_MAX_ATTEMPTS = int(os.environ.get("CHECK_MAX_ATTEMPTS", "4"))
DEFAULT_INITIAL_BACKOFF = float(os.environ.get("CHECK_BACKOFF_INITIAL", "2"))


class CheckSpec(Dict[str, Any]):
    pass


def _build_default_checks(target: str, run_id: str) -> List[CheckSpec]:
    target = target.lower()
    if target == "api":
        subject = f"Deploy smoke check #{run_id}"
        return [
            {"name": "GET /healthz", "method": "GET", "path": "/healthz"},
            {"name": "GET /health", "method": "GET", "path": "/health"},
            {
                "name": "POST /emails/send",
                "method": "POST",
                "path": "/emails/send",
                "json": {
                    "to": os.environ.get("SMOKE_EMAIL_TO", "kontakt@salon-bw.pl"),
                    "subject": subject,
                    "template": "Deploy smoke check for Salon Black & White",
                    "data": {
                        "trigger": "github-actions",
                        "run_id": run_id,
                    },
                },
                "expected_status": [200, 201],
            },
        ]
    if target == "public":
        return [
            {"name": "GET /", "method": "GET", "path": "/"},
            {"name": "GET /robots.txt", "method": "GET", "path": "/robots.txt"},
        ]
    if target in {"dashboard", "admin"}:
        return [
            {"name": "GET /", "method": "GET", "path": "/"},
        ]
    return []


def _load_checks(run_id: str) -> List[CheckSpec]:
    explicit = os.environ.get("CHECKS_JSON")
    target = os.environ.get("DEPLOY_TARGET", "")
    if explicit:
        try:
            checks = json.loads(explicit)
            if not isinstance(checks, list):
                raise ValueError("CHECKS_JSON must be a list")
            return checks  # type: ignore[return-value]
        except json.JSONDecodeError as exc:
            raise SystemExit(f"Failed to parse CHECKS_JSON: {exc}") from exc
    return _build_default_checks(target, run_id)


def _append_summary(lines: Iterable[str]) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return
    with open(summary_path, "a", encoding="utf-8") as handle:
        for line in lines:
            handle.write(f"{line}\n")
        handle.write("\n")


def _serialise_body(spec: CheckSpec) -> Optional[bytes]:
    if "body" in spec:
        body = spec["body"]
        if isinstance(body, bytes):
            return body
        if isinstance(body, str):
            return body.encode("utf-8")
        raise TypeError("body must be str or bytes")
    if "json" in spec:
        return json.dumps(spec["json"]).encode("utf-8")
    return None


def _expected_statuses(spec: CheckSpec) -> Optional[List[int]]:
    statuses = spec.get("expected_status")
    if statuses is None:
        return None
    if isinstance(statuses, int):
        return [statuses]
    if isinstance(statuses, list):
        return [int(status) for status in statuses]
    raise TypeError("expected_status must be an int or list of ints")


def run_checks() -> int:
    host = os.environ.get("TARGET_HOST", "").strip()
    scheme = os.environ.get("TARGET_SCHEME", "https")
    target = os.environ.get("DEPLOY_TARGET", "").lower() or "unknown"
    run_id = os.environ.get("GITHUB_RUN_ID", "local")

    if not host:
        message = "Target host not provided; skipping smoke checks."
        print(message)
        _append_summary(
            [
                f"### Post-deploy smoke checks ({target})",
                "",
                f"- ⚠️ {message}",
            ]
        )
        return 0

    checks = _load_checks(run_id)
    if not checks:
        print("No checks configured; exiting without action.")
        _append_summary(
            [
                f"### Post-deploy smoke checks ({target})",
                "",
                "- ⚠️ No checks configured.",
            ]
        )
        return 0

    max_attempts = DEFAULT_MAX_ATTEMPTS
    initial_backoff = DEFAULT_INITIAL_BACKOFF
    context = ssl.create_default_context()

    results: List[Dict[str, Any]] = []
    failures = 0

    for spec in checks:
        name = spec.get("name") or f"{spec.get('method', 'GET')} {spec.get('path', '')}"
        method = spec.get("method", "GET").upper()
        path = spec.get("path", "/")
        headers: Dict[str, str] = {
            key: value
            for key, value in spec.get("headers", {}).items()
        }
        body = _serialise_body(spec)
        if body is not None and "Content-Type" not in headers:
            headers["Content-Type"] = "application/json"

        expected_status = _expected_statuses(spec)

        attempt = 0
        success = False
        status_code: Optional[int] = None
        error_message: Optional[str] = None
        duration_seconds: Optional[float] = None
        backoff = initial_backoff

        while attempt < max_attempts and not success:
            attempt += 1
            start = time.perf_counter()
            url = f"{scheme}://{host}{path}"
            request = urllib.request.Request(url=url, method=method)
            for header_key, header_value in headers.items():
                request.add_header(header_key, header_value)
            if body is not None:
                request.data = body

            try:
                with urllib.request.urlopen(request, timeout=15, context=context) as response:
                    status_code = response.status
                    duration_seconds = time.perf_counter() - start
                    if 200 <= status_code < 400 and (
                        expected_status is None or status_code in expected_status
                    ):
                        success = True
                    else:
                        error_message = f"unexpected status {status_code}"
            except urllib.error.HTTPError as exc:
                status_code = exc.code
                duration_seconds = time.perf_counter() - start
                error_message = f"http error {exc.code}"
            except Exception as exc:  # pylint: disable=broad-except
                duration_seconds = time.perf_counter() - start
                error_message = str(exc)

            if success:
                break

            if attempt < max_attempts:
                time.sleep(backoff)
                backoff *= 2

        result = {
            "name": name,
            "attempts": attempt,
            "success": success,
            "status": status_code,
            "error": error_message,
            "duration": duration_seconds,
        }
        if not success:
            failures += 1
        results.append(result)

    summary_lines = [
        f"### Post-deploy smoke checks ({target} → {scheme}://{host})",
        "",
    ]
    for result in results:
        status_fragment = (
            f"status {result['status']}" if result.get("status") is not None else "no status"
        )
        attempts_fragment = (
            f"{result['attempts']} attempt(s)"
        )
        duration_fragment = (
            f"{result['duration']:.2f}s"
            if isinstance(result.get("duration"), (float, int))
            else "n/a"
        )
        if result["success"]:
            summary_lines.append(
                f"- ✅ {result['name']} ({status_fragment}, {duration_fragment}, {attempts_fragment})"
            )
        else:
            summary_lines.append(
                f"- ❌ {result['name']} failed ({status_fragment}, {attempts_fragment}): {result.get('error')}"
            )

    _append_summary(summary_lines)

    for result in results:
        if result["success"]:
            print(f"[ok] {result['name']} ({result['status']})")
        else:
            print(f"[fail] {result['name']}: {result.get('error')} (status={result.get('status')})", file=sys.stderr)

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(run_checks())
