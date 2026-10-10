#!/usr/bin/env python3
"""Create a Letterboxd CSV for the videos in C-SPAN's Reel America archive."""

import argparse
import csv
from html.parser import HTMLParser
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen


ARCHIVE_URL = "https://www.c-span.org/ahtv/?reelAmerica"
EXPECTED_COUNT = 912
MAX_PAGES = 200
REQUEST_DELAY = 0.5
VIDEO_ID = re.compile(r"/(\d+)/?$")
PAGINATION_QUERY_KEYS = {"page", "p", "pageno", "pagenumber", "start", "offset", "from", "skip"}
PAGINATION_CLASSES = {"page", "pagination", "pagination-link", "pager", "next", "previous"}


class ArchiveParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.anchors = []
        self.current_anchor = None

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        attributes = dict(attrs)
        href = attributes.get("href")
        if href:
            classes = set(attributes.get("class", "").split())
            self.current_anchor = {
                "href": href,
                "title_class": "title" in classes,
                "classes": classes,
                "rel": set(attributes.get("rel", "").lower().split()),
                "aria_label": attributes.get("aria-label", ""),
                "text": [],
            }

    def handle_data(self, data):
        if self.current_anchor is not None:
            self.current_anchor["text"].append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.current_anchor is not None:
            self.anchors.append(self.current_anchor)
            self.current_anchor = None


def fetch_page(url):
    request = Request(
        url,
        headers={
            "Accept": "text/html",
            "User-Agent": "Mozilla/5.0 (compatible; ReelAmericaLetterboxdCSV/1.0)",
        },
    )
    try:
        with urlopen(request, timeout=30) as response:
            body = response.read()
            status = response.status
    except HTTPError as error:
        if error.code == 202:
            raise RuntimeError(
                "C-SPAN returned an AWS verification challenge (HTTP 202). "
                "The archive cannot be scraped until the challenge is cleared."
            ) from error
        raise RuntimeError(f"C-SPAN returned HTTP {error.code} for {url}") from error
    except URLError as error:
        raise RuntimeError(f"Could not access C-SPAN at {url}: {error.reason}") from error

    if status == 202 or not body:
        raise RuntimeError(
            "C-SPAN returned an empty response or AWS verification challenge. "
            "No CSV was written."
        )
    return body.decode("utf-8", errors="replace")


def parse_archive_page(url, document):
    parser = ArchiveParser()
    parser.feed(document)
    videos = {}
    pages = []

    for anchor in parser.anchors:
        target = urljoin(url, anchor["href"])
        parsed = urlparse(target)
        if parsed.netloc.lower() not in {"www.c-span.org", "c-span.org"}:
            continue

        path = parsed.path.rstrip("/")
        match = VIDEO_ID.search(path)
        if "/program/" in path and match:
            video_id = match.group(1)
            title = " ".join("".join(anchor["text"]).split())
            if title:
                candidate = (anchor["title_class"], len(title), title)
                previous = videos.get(video_id)
                if previous is None or candidate[:2] > previous[:2]:
                    videos[video_id] = candidate
            continue

        if path != "/ahtv" and not path.startswith("/ahtv/"):
            continue

        query = parse_qsl(parsed.query, keep_blank_values=True)
        query_keys = {key.lower() for key, _ in query}
        is_reel_america_page = (
            "reelamerica" in parsed.path.lower()
            or any(key.lower() == "reelamerica" for key, _ in query)
        )
        is_pagination_link = bool(query_keys & PAGINATION_QUERY_KEYS)
        is_pagination_link |= any(
            css_class in PAGINATION_CLASSES
            or css_class.startswith(("page-", "page_", "pagination-", "pager-", "next", "previous"))
            for css_class in anchor["classes"]
        )
        is_pagination_link |= "next" in anchor["rel"]
        link_text = " ".join(
            (anchor["aria_label"], "".join(anchor["text"]))
        ).strip().lower()
        is_pagination_link |= link_text.startswith(("next", "older"))
        is_pagination_link |= link_text.isdigit()

        if is_reel_america_page or is_pagination_link:
            if not is_reel_america_page and path == "/ahtv":
                query.append(("reelAmerica", ""))
            pages.append(
                urlunparse(
                    parsed._replace(query=urlencode(query))
                )
            )

    return videos, pages


def collect_videos():
    pending = [ARCHIVE_URL]
    visited = set()
    videos = {}

    while pending:
        url = pending.pop(0)
        if url in visited:
            continue
        if len(visited) >= MAX_PAGES:
            raise RuntimeError(f"Stopped after {MAX_PAGES} archive pages; refusing a partial CSV.")

        if visited:
            time.sleep(REQUEST_DELAY)
        document = fetch_page(url)
        visited.add(url)

        page_videos, page_links = parse_archive_page(url, document)
        for video_id, candidate in page_videos.items():
            previous = videos.get(video_id)
            if previous is None or candidate[:2] > previous[:2]:
                videos[video_id] = candidate
        pending.extend(link for link in page_links if link not in visited and link not in pending)

    return [videos[video_id][2] for video_id in videos]


def main():
    argument_parser = argparse.ArgumentParser(
        description="Create a Letterboxd import CSV from C-SPAN's Reel America archive."
    )
    argument_parser.add_argument(
        "output",
        nargs="?",
        default="cspan_reel_america.csv",
        help="output CSV path (default: cspan_reel_america.csv)",
    )
    argument_parser.add_argument(
        "--expected-count",
        type=int,
        default=EXPECTED_COUNT,
        help=f"required number of distinct videos (default: {EXPECTED_COUNT}; use 0 to disable)",
    )
    args = argument_parser.parse_args()

    try:
        titles = collect_videos()
        if args.expected_count and len(titles) != args.expected_count:
            raise RuntimeError(
                f"Found {len(titles)} distinct videos, expected {args.expected_count}. "
                "No CSV was written; check whether C-SPAN changed the archive or pagination."
            )
        if not titles:
            raise RuntimeError("No Reel America video titles were found. No CSV was written.")

        with open(args.output, "w", newline="", encoding="utf-8") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(["Title"])
            writer.writerows([title] for title in titles)
    except (OSError, RuntimeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Wrote {len(titles)} videos to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
