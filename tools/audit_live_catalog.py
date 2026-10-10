"""Read-only live HTTP probes for ALL published Vbook sources.

Results are diagnostics, not proof that JavaScript works inside the Android Vbook app.
Rate/JavaScript/Cloudflare blocking is reported separately from source closure.
Run: pip install requests beautifulsoup4 && python tools/audit_live_catalog.py
"""
import concurrent.futures
import datetime
import json
import re
from pathlib import Path
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
CATALOG = json.loads((ROOT / "plugin.json").read_text(encoding="utf-8"))["data"]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5",
    "Accept-Language": "en-US,en;q=0.8"
}


def probe(url):
    if not isinstance(url, str) or not re.match(r"^https?://", url):
        return {"result": "no-sample"}
    try:
        response = requests.get(url, headers=HEADERS, timeout=(5, 12), allow_redirects=True)
        result = {
            "result": "reachable",
            "status": response.status_code,
            "final_url": response.url,
            "content_type": response.headers.get("Content-Type", "").split(";")[0],
        }
        if response.status_code in (403, 429, 503):
            result["result"] = "blocked-or-rate-limited"
        elif response.status_code >= 400:
            result["result"] = "http-error"
        if "html" not in result["content_type"].lower():
            result["body_bytes"] = len(response.content)
            return result
        dom = BeautifulSoup(response.text[:750000], "html.parser")
        title = dom.title.get_text(" ", strip=True)[:100] if dom.title else ""
        body = dom.body.get_text(" ", strip=True) if dom.body else dom.get_text(" ", strip=True)
        marker = (title + " " + body[:800]).lower()
        result.update({
            "title": title,
            "text_chars": len(body),
            "links": len(dom.select("a[href]")),
            "images": len(dom.select("img"))
        })
        # A Cloudflare widget embedded in a fully rendered page is not itself
        # proof that the reader is blocked. Require an actual challenge title or
        # a nearly empty/error page with a verification form.
        page_title = title.lower().strip()
        challenge_title = (
            page_title.startswith(("just a moment", "checking your browser",
                                   "attention required", "验证码", "驗證碼"))
        )
        challenge_widget = bool(
            dom.select_one("#challenge-form, .cf-turnstile, #cf-challenge-running")
        )
        if challenge_title or (
            challenge_widget and (response.status_code in (403, 429, 503)
                                  or len(body) < 250)
        ):
            result["result"] = "challenge"
        elif "you need to enable javascript to run this app" in marker:
            result["result"] = "javascript-app"
        elif response.status_code == 200 and len(body) < 80:
            result["result"] = "very-thin-html"
        return result
    except requests.RequestException as exc:
        return {"result": "network-inconclusive", "error": type(exc).__name__}


def check(entry):
    folder = entry["path"].rstrip("/").split("/")[-2]
    sample_file = ROOT / folder / "src" / "test.json"
    try:
        samples = json.loads(sample_file.read_text(encoding="utf-8")) if sample_file.is_file() else {}
    except (ValueError, OSError):
        samples = {}
    row = {
        "folder": folder,
        "name": entry["name"],
        "version": entry["version"],
        "source": entry["source"],
        "home": probe(entry["source"]),
    }
    for key, filename in (("detail", "detail.js"), ("chapter", "chap.js")):
        value = samples.get(filename, "") if isinstance(samples, dict) else ""
        row[key] = probe(value)
        if isinstance(value, str) and value.startswith("http"):
            row[key]["sample_domain"] = urlparse(value).hostname
    return row


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=7) as executor:
        rows = list(executor.map(check, CATALOG))
    counts = {}
    for row in rows:
        status = row["home"]["result"]
        counts[status] = counts.get(status, 0) + 1
        print(
            "{folder:14} v{version:<3} home={home:24} detail={detail:24} "
            "chapter={chapter}".format(
                folder=row["folder"], version=row["version"],
                home=row["home"]["result"],
                detail=row["detail"]["result"],
                chapter=row["chapter"]["result"],
            ), flush=True
        )
    payload = {
        "time_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "published_count": len(CATALOG),
        "home_status_counts": counts,
        "sources": rows,
        "notes": "HTTP snapshots, not Android Vbook runtime execution. "
                 "Cloudflare, login and JavaScript rendering may need user verification."
    }
    (ROOT / "audit-live-catalog.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("PUBLISHED COUNT:", len(CATALOG))
    print("HOME STATUS:", json.dumps(counts, ensure_ascii=False))
    print("Saved audit-live-catalog.json", flush=True)


if __name__ == "__main__":
    main()
