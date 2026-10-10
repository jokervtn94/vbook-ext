#!/usr/bin/env python3
"""Synchronize VBook extension publisher metadata before a release."""
import json
import pathlib
import zipfile
import io

ROOT = pathlib.Path(__file__).resolve().parents[1]
AUTHOR = "Jokervtn94"

def edit_json(path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    changed = False
    if path == ROOT / "plugin.json":
        metadata = data.get("metadata", {})
        if isinstance(metadata, dict) and metadata.get("author") != AUTHOR:
            metadata["author"] = AUTHOR
            changed = True
        for item in data.get("data", []):
            if isinstance(item, dict) and item.get("author") != AUTHOR:
                item["author"] = AUTHOR
                changed = True
    else:
        metadata = data.get("metadata")
        if isinstance(metadata, dict) and metadata.get("author") != AUTHOR:
            metadata["author"] = AUTHOR
            changed = True
    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed

def repack_zip(path):
    try:
        with zipfile.ZipFile(path, "r") as zf:
            if "plugin.json" not in zf.namelist():
                return False
            data = json.loads(zf.read("plugin.json").decode("utf-8"))
            if not isinstance(data.get("metadata"), dict) or data["metadata"].get("author") == AUTHOR:
                return False
            data["metadata"]["author"] = AUTHOR
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w") as out:
                for info in zf.infolist():
                    payload = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8") if info.filename == "plugin.json" else zf.read(info.filename)
                    out.writestr(info, payload)
        path.write_bytes(buffer.getvalue())
        return True
    except (OSError, ValueError, zipfile.BadZipFile, UnicodeDecodeError):
        return False

if __name__ == "__main__":
    changed = [str(p.relative_to(ROOT)) for p in ROOT.glob("*/plugin.json") if edit_json(p)]
    index = ROOT / "plugin.json"
    if index.exists() and edit_json(index):
        changed.append("plugin.json")
    changed += [str(p.relative_to(ROOT)) for p in ROOT.glob("*/plugin.zip") if repack_zip(p)]
    print("Normalized publisher:", AUTHOR)
    print("Updated:", ", ".join(changed) if changed else "none")
