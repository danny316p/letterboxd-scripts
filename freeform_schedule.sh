#!/bin/bash
set -euo pipefail

URL="${1:-https://www.freeform.com/news/9cf35c19-f0cd-4104-afbf-31bb9b8e0d18/category/3444024}"
OUT="${2:-sedoutput.csv}"

python3 - "$URL" "$OUT" <<'PY'
import csv
import html
import re
import sys
import urllib.request
from collections import OrderedDict

url, out = sys.argv[1], sys.argv[2]

req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=30) as resp:
    raw = resp.read().decode("utf-8", errors="replace")

# Strip scripts/styles entirely.
raw = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", raw)
raw = re.sub(r"(?is)<[^>]+>", "\n", raw)
raw = html.unescape(raw)

# Match schedule entries such as:
# 11:30 a.m. EDT/PDT – "Edward Scissorhands"
# 8:00 p.m. EDT/PDT – "Coven Academy" (Series Premiere, Episodes 1-4)
pattern = re.compile(r'\b\d{1,2}:\d{2}\s+[ap]\.?m\.\s+EDT/PDT\s+[–-]\s+"([^"]+)"(?:\s*\((\d{4})\))?', re.IGNORECASE)
items = OrderedDict()

for title, year in pattern.findall(raw):
    title = title.strip()
    year = (year or "").strip()
    if not title:
        continue
    # Ignore obvious non-film metadata labels that show up in the page.
    if re.search(r"(Series Premiere|Episodes|Season Finale|Freeform Premiere|All programming is subject to change)", title, re.IGNORECASE):
        continue
    key = title.lower()
    if key not in items:
        items[key] = [title, year]
    elif year and not items[key][1]:
        items[key][1] = year

with open(out, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Title", "Year"])
    for title, year in items.values():
        writer.writerow([title, year])
PY
