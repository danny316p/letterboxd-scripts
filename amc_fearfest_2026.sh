#!/bin/bash
set -euo pipefail

# Download AMC's FearFest schedule and convert movie listings to Letterboxd CSV.
# Do not run this more than necessary; it fetches AMC's page on each run.
URL="https://www.amc.com/blogs/check-out-the-full-schedule-for-amc-s-fearfest-2026--1075776"
OUT="${1:-amc_fearfest_2026.csv}"

lynx -dump -width=1000 "$URL" | awk '
BEGIN {
    print "Title,Year"
}
{
    sub(/\r$/, "")
    line = $0

    if (!in_schedule) {
        if (tolower(line) ~ /check out the detailed schedule below/) {
            in_schedule = 1
        }
        next
    }

    # AMC formats schedule entries as "11am: Film" or "1:30am: Film".
    if (tolower(line) !~ /^[[:space:]]*[0-9][0-9]?:[0-9][0-9][[:space:]]*[ap]\.?m\.?:/ &&
        tolower(line) !~ /^[[:space:]]*[0-9][0-9]?[[:space:]]*[ap]\.?m\.?:/) {
        next
    }

    sub(/^[[:space:]]*[0-9][0-9]?(:[0-9][0-9])?[[:space:]]*[ap]\.?m\.?:[[:space:]]*/, "", line)
    sub(/[[:space:]]+\[[0-9]+\]$/, "", line)
    gsub(/[’‘]/, "\047", line)
    title = line
    gsub(/[[:space:]]+/, " ", title)
    gsub(/[[:space:]]+:/, ":", title)
    sub(/^[[:space:]]+/, "", title)
    sub(/[[:space:]]+$/, "", title)
    sub(/ \([0-9]+(st|nd|rd|th) Anniversary\)$/, "", title)

    if (tolower(title) == "freddy vs jason") {
        title = "Freddy vs. Jason"
    }
    if (tolower(title) == "thir13een ghosts") {
        title = "Thir13en Ghosts"
    }

    # These listings are programming blocks or series episodes, not films.
    lower_title = tolower(title)
    if (lower_title ~ /^tna impact!?$/ ||
        lower_title ~ /^tales from the crypt marathon$/ ||
        lower_title ~ /^the terror: devil in silver episode/) {
        next
    }

    year = ""
    if (title ~ / \([12][0-9][0-9][0-9]\)$/) {
        year = substr(title, length(title) - 4, 4)
        title = substr(title, 1, length(title) - 7)
    }
    if (title == "") {
        next
    }

    key = tolower(title) SUBSEP year
    if (seen[key]++) {
        next
    }
    count++

    gsub(/"/, "\"\"", title)
    printf "\"%s\",\"%s\"\n", title, year
}
END {
    if (count == 0) {
        print "No timed schedule entries found; AMC may have changed the page format." > "/dev/stderr"
        exit 1
    }
}' > "$OUT"

echo "Wrote Letterboxd CSV to $OUT"
