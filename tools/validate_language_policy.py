"""Reject unsupported-language extensions, including known incorrectly labelled sources.

Published content policy: Vietnamese (vi) and Chinese (zh/legacy cn) only.
Use the content language of the source, not merely its catalog locale.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
catalog=json.loads((ROOT/"plugin.json").read_text(encoding="utf-8"))
items=catalog["data"]
RETIRED={
    "omegascans","doujins","mangaread","novelbuddy","wuxiaworld","royalroad",
    "knoxt","webnovel"
}
RETIRED_HOSTS={
    "omegascans.org","doujins.com","mangaread.org","novelbuddy.me",
    "wuxiaworld.com","royalroad.com","knoxt.space","webnovel.com"
}
CHINESE={
    "qimao","acqq","manhuagui","bookqq","myrics","dingdian",
    "ciweimao","bfaloo","tadu","shuba69","uukanshu"
}
VIETNAMESE={
    "manhuavn","tienvuc","sayhentai","tranh18","hotruyen","sachhayonline"
}
expected=CHINESE|VIETNAMESE
folders={x["path"].split("/")[-2] for x in items}
assert folders==expected, f"Unexpected/missing source: {sorted(folders^expected)}"
assert len(items)==len(expected)==17
for name in RETIRED:
    assert not (ROOT/name).exists(), f"Retired source tree still exists: {name}"
for item in items:
    folder=item["path"].split("/")[-2]
    source=item["source"].lower()
    assert not any(host in source for host in RETIRED_HOSTS), item["name"]
    manifest=json.loads((ROOT/folder/"plugin.json").read_text(encoding="utf-8"))
    locale=item["locale"].lower().replace("_","-")
    actual=manifest["metadata"]["locale"].lower().replace("_","-")
    # Historic Vbook extensions use cn-CN and zh-CN for the same language.
    normalize=lambda value: "zh-"+value.split("-",1)[1] if value.startswith("cn-") else value
    assert normalize(locale)==normalize(actual), (
        f"{folder}: locale mismatch {locale} != {actual}"
    )
    if folder in VIETNAMESE:
        assert locale.startswith("vi-"), f"{folder}: expected Vietnamese, got {locale}"
    else:
        assert locale.startswith(("zh-","cn-")), f"{folder}: expected Chinese, got {locale}"
print("PASS content-language policy:",len(VIETNAMESE),"Vietnamese,",
      len(CHINESE),"Chinese; zero retired English source folders")
