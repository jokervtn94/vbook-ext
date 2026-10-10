#!/usr/bin/env python3
"""Audit Vbook extension manifests and archives without modifying files.

Run: python tools/audit_structure.py
     python tools/audit_structure.py --json
Exit status is nonzero only for missing/invalid structural requirements.
Catalog metadata drift and package/source drift are warnings until rebuilt.
"""
import argparse
import json
import re
import sys
import zipfile
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
REQUIRED_SCRIPTS = ("detail", "toc", "chap")
OPTIONAL_SCRIPTS = ("home", "genre", "search", "page")
SCRIPT_KEYS = set(REQUIRED_SCRIPTS + OPTIONAL_SCRIPTS)
ALLOWED_TYPES = {"novel", "comic", "chinese_novel"}


def audit(root):
    errors, warnings, extensions = [], [], []
    catalog = json.loads((root / "plugin.json").read_text(encoding="utf-8"))
    published = {}
    for entry in catalog.get("data", []):
        path = entry.get("path", "")
        segments = urlparse(path).path.strip("/").split("/")
        if len(segments) >= 2:
            published[segments[-2]] = entry

    for directory in sorted(root.iterdir()):
        manifest_path = directory / "plugin.json"
        if not directory.is_dir() or not manifest_path.is_file():
            continue
        folder = directory.name
        record = {"folder": folder, "published": folder in published,
                  "errors": [], "warnings": [], "scripts": 0}
        e, w = record["errors"], record["warnings"]
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            e.append(f"invalid plugin.json: {exc}")
            extensions.append(record)
            continue

        meta, scripts = manifest.get("metadata"), manifest.get("script")
        if not isinstance(meta, dict) or not isinstance(scripts, dict):
            e.append("plugin.json requires metadata and script objects")
            extensions.append(record)
            continue
        for key in ("name", "author", "source", "regexp", "locale", "type"):
            if not isinstance(meta.get(key), str) or not meta[key].strip():
                e.append(f"metadata.{key} must be a non-empty string")
        if meta.get("type") not in ALLOWED_TYPES:
            w.append(f"unknown type {meta.get('type')!r}")
        if not isinstance(meta.get("version"), int) or meta["version"] < 1:
            e.append("metadata.version must be a positive integer")
        for key in REQUIRED_SCRIPTS:
            if not isinstance(scripts.get(key), str) or not scripts[key].strip():
                e.append(f"required script missing: {key}")
        for key, name in scripts.items():
            if key not in SCRIPT_KEYS:
                w.append(f"nonstandard script key: {key}")
            if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9_.-]+[.]js", name):
                e.append(f"invalid script path for {key}: {name!r}")
                continue
            if not (directory / "src" / name).is_file():
                e.append(f"script file not found: src/{name}")
            record["scripts"] += 1

        if not (directory / "icon.png").is_file():
            e.append("missing icon.png")
        archive = directory / "plugin.zip"
        if not archive.is_file():
            e.append("missing plugin.zip")
        else:
            try:
                with zipfile.ZipFile(archive) as z:
                    names = [p for p in z.namelist() if not p.endswith("/")]
                    if not names:
                        e.append("plugin.zip has no files")
                    # Archives may be flat or contain an enclosing extension folder.
                    for required in ("plugin.json", "icon.png"):
                        if not any(n == required or n.endswith("/" + required)
                                   for n in names):
                            w.append(f"archive may be missing {required}")
                    for key, filename in scripts.items():
                        if isinstance(filename, str) and filename.endswith(".js"):
                            if not any(n == "src/" + filename or
                                       n.endswith("/src/" + filename) or
                                       n == filename for n in names):
                                w.append(f"archive may be missing script {key}: {filename}")
                    corrupt = z.testzip()
                    if corrupt:
                        e.append(f"invalid ZIP entry: {corrupt}")
            except (OSError, zipfile.BadZipFile, RuntimeError) as exc:
                e.append(f"invalid plugin.zip: {exc}")

        entry = published.get(folder)
        if entry:
            for key, actual in (("version", meta.get("version")),
                                ("source", meta.get("source")),
                                ("type", meta.get("type"))):
                recorded = entry.get(key)
                if recorded is not None and recorded != actual:
                    w.append(f"catalog.{key}={recorded!r} != metadata.{key}={actual!r}")
        else:
            w.append("extension not published in catalog")
        extensions.append(record)

    for ext in extensions:
        for problem in ext["errors"]:
            errors.append(f"{ext['folder']}: {problem}")
        for problem in ext["warnings"]:
            warnings.append(f"{ext['folder']}: {problem}")
    for folder in sorted(set(published) - {r["folder"] for r in extensions}):
        errors.append(f"{folder}: published extension directory not found")
    return {"checked": len(extensions), "published": len(published),
            "errors": errors, "warnings": warnings, "extensions": extensions}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Output JSON audit")
    parser.add_argument("--repo-root", type=Path, default=ROOT)
    args = parser.parse_args()
    result = audit(args.repo_root.resolve())
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Audited {result['checked']} extension folders; "
              f"{result['published']} published; "
              f"{len(result['errors'])} errors; {len(result['warnings'])} warnings")
        for problem in result["errors"]:
            print("ERROR:", problem)
        for problem in result["warnings"]:
            print("WARNING:", problem)
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
