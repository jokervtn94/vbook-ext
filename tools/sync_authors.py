#!/usr/bin/env python3
"""Ensure publisher and packaged VBook extension metadata match published source."""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools"))
from build_extensions import build

AUTHOR = "Jokervtn94"
INDEX = ROOT / "plugin.json"

def dump_json(path, obj):
    new = json.dumps(obj, ensure_ascii=False, indent=2) + "\n"
    if not path.exists() or path.read_text(encoding="utf-8") != new:
        path.write_text(new, encoding="utf-8")
        return True
    return False

def sync():
    catalog = json.loads(INDEX.read_text(encoding="utf-8"))
    catalog.setdefault("metadata", {})["author"] = AUTHOR
    updated = []
    for entry in catalog["data"]:
        folder = entry["path"].rstrip("/").split("/")[-2]
        path = ROOT / folder / "plugin.json"
        if not path.is_file():
            raise FileNotFoundError(f"Published extension missing manifest: {path}")
        manifest = json.loads(path.read_text(encoding="utf-8"))
        meta = manifest["metadata"]
        author_changed = meta.get("author") != AUTHOR
        if author_changed:
            meta["author"] = AUTHOR
            meta["version"] = int(meta["version"]) + 1
        if dump_json(path, manifest):
            updated.append(str(path.relative_to(ROOT)))
        entry["author"] = AUTHOR
        entry["version"] = meta["version"]
        package, _, _ = build(folder)
        target = ROOT / folder / "plugin.zip"
        if not target.exists() or target.read_bytes() != package:
            target.write_bytes(package)
            updated.append(str(target.relative_to(ROOT)))
    if dump_json(INDEX, catalog):
        updated.append("plugin.json")
    from main import render_readme
    readme = ROOT / "README.md"
    expected = render_readme(catalog)
    if not readme.is_file() or readme.read_text(encoding="utf-8") != expected:
        readme.write_text(expected, encoding="utf-8")
        updated.append("README.md")
    # Fail rather than silently publish a partly synchronized catalog.
    for entry in catalog["data"]:
        folder = entry["path"].rstrip("/").split("/")[-2]
        manifest = json.loads((ROOT / folder / "plugin.json").read_text(encoding="utf-8"))
        if entry["author"] != AUTHOR or manifest["metadata"]["author"] != AUTHOR:
            raise AssertionError(f"{folder}: publisher mismatch")
        if entry["version"] != manifest["metadata"]["version"]:
            raise AssertionError(f"{folder}: version mismatch")
    print(f"Checked {len(catalog['data'])} published extensions")
    print("Changed:", ", ".join(updated) if updated else "none")

if __name__ == "__main__":
    sync()
