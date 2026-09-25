#!/bin/bash
set -euo pipefail

DATE="${1:-}"
OUT="${2:-sedoutput.csv}"

python3 - "$DATE" "$OUT" <<'PY'
import csv
import re
import sys
from collections import OrderedDict
from datetime import date as calendar_date, timedelta
from html.parser import HTMLParser
from urllib.request import Request, urlopen


class ScheduleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.entry = None
        self.fields = []
        self.stooges_entries = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = set(attributes.get("class", "").split())
        depth = len(self.stack) + 1
        self.stack.append((tag, classes))

        if tag == "div" and "schedule-entry" in classes:
            self.entry = {"time": "", "show": "", "episode": ""}
        if self.entry is not None:
            if tag == "span" and "schedule-on-now" in classes:
                self.fields.append((tag, depth, "time"))
            elif tag == "div" and "content-now-title-schedule" in classes:
                self.fields.append((tag, depth, "show"))
            elif tag == "div" and "schedule-entry-episode-title" in classes:
                self.fields.append((tag, depth, "episode"))

    def handle_endtag(self, tag):
        if not self.stack:
            return
        depth = len(self.stack)
        self.fields = [f for f in self.fields if not (f[0] == tag and f[1] == depth)]
        ended_tag, ended_classes = self.stack.pop()
        if ended_tag == "div" and "schedule-entry" in ended_classes and self.entry:
            show = " ".join(self.entry["show"].split())
            if show == "The Three Stooges":
                self.stooges_entries.append(self.entry)
            self.entry = None

    def handle_data(self, data):
        if self.entry is None:
            return
        for _, _, field in self.fields:
            self.entry[field] += data


date, output = sys.argv[1], sys.argv[2]
if not date:
    today = calendar_date.today()
    date = (today + timedelta(days=(5 - today.weekday()) % 7)).isoformat()
elif not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
    raise SystemExit("Date must use YYYY-MM-DD format.")

request = Request(
    f"https://www.metv.com/schedule/{date}",
    headers={"User-Agent": "Mozilla/5.0"},
)
with urlopen(request, timeout=30) as response:
    page = response.read().decode("utf-8", errors="replace")

parser = ScheduleParser()
parser.feed(page)

evening = [
    entry for entry in parser.stooges_entries
    if re.search(r"\b6:00\s*pm\b", " ".join(entry["time"].lower().split()))
]
if not evening:
    raise SystemExit(f"No 6:00pm Three Stooges schedule entry found for {date}.")

titles = OrderedDict()
for entry in evening:
    parts = [part.strip() for part in entry["episode"].split(",") if part.strip()]
    i = 0
    while i < len(parts):
        title = parts[i]
        if title.lower() == "no census" and i + 1 < len(parts) and parts[i + 1].lower() == "no feeling":
            title += ", " + parts[i + 1]
            i += 1
        titles.setdefault(title.lower(), title)
        i += 1

if not titles:
    raise SystemExit(f"The 6:00pm Three Stooges entry had no short titles for {date}.")

with open(output, "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Title"])
    writer.writerows([[title] for title in titles.values()])
PY
