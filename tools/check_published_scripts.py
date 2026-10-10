#!/usr/bin/env python3
"""Check JavaScript syntax and references for every *published* Vbook reader.

Unpublished source trees are excluded because they are not distributed.
"""
import json, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
entries=json.loads((ROOT/"plugin.json").read_text(encoding="utf-8"))["data"]
errors=[]
tested=0
for item in entries:
    folder=item["path"].split("/")[-2]
    src=ROOT/folder/"src"
    files=sorted(src.rglob("*.js"))
    names={x.name for x in files}
    for file in files:
        tested+=1
        check=subprocess.run(["node","--check",str(file)],capture_output=True,text=True)
        if check.returncode:
            errors.append(f"{folder}/{file.name}: invalid JavaScript: {check.stderr[-260:]}")
        text=file.read_text(encoding="utf-8",errors="replace")
        for target in re.findall(r'\bload\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)',text):
            if target not in names:
                errors.append(f"{folder}/{file.name}: missing loaded {target}")
        for target in re.findall(r'script\s*:\s*[\'"]([^\'"]+\.js)[\'"]',text):
            if target not in names:
                errors.append(f"{folder}/{file.name}: missing linked {target}")
    meta=json.loads((ROOT/folder/"plugin.json").read_text(encoding="utf-8"))
    for target in meta.get("script",{}).values():
        if target not in names:errors.append(f"{folder}: missing manifest script {target}")
for error in errors:print("ERROR:",error)
print(f"Published readers: {len(entries)}; JavaScript files checked: {tested}; issues: {len(errors)}")
if errors:raise SystemExit(1)
print("PASS: all published scripts parse and dependencies exist")
