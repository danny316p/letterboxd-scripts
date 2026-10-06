#!/bin/bash
set -euo pipefail

if [[ $# -gt 2 ]]; then
    echo "Usage: $0 [YYYY-MM-DD [OUTPUT.csv]]" >&2
    exit 2
fi

if [[ $# -ge 1 ]]; then
    SCHEDULE_DATE="$1"
    if [[ ! "$SCHEDULE_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] ||
        ! PARSED_DATE=$(date -d "$SCHEDULE_DATE" +%F 2>/dev/null) ||
        [[ "$PARSED_DATE" != "$SCHEDULE_DATE" ]]; then
        echo "Invalid date: $SCHEDULE_DATE (expected YYYY-MM-DD)." >&2
        exit 2
    fi
    if [[ $(date -d "$SCHEDULE_DATE" +%u) != 6 ]]; then
        echo "Date must be a Saturday: $SCHEDULE_DATE" >&2
        exit 2
    fi
else
    TODAY=$(date +%F)
    DAYS_UNTIL_SATURDAY=$(((6 - $(date +%u)) % 7))
    SCHEDULE_DATE=$(date -d "$TODAY + $DAYS_UNTIL_SATURDAY days" +%F)
fi

URL="https://www.metv.com/schedule/$SCHEDULE_DATE"
OUT="${2:-metv_saturday_stooges_${SCHEDULE_DATE}.csv}"
TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT

if ! lynx -dump -width=1000 "$URL" > "$TMP_FILE"; then
    echo "Failed to fetch MeTV schedule: $URL" >&2
    exit 1
fi

EPISODE_TITLES=$(awk '
    /^[[:space:]]*[0-9][0-9]?:[0-9][0-9](am|pm)[[:space:]]*$/ {
        target_time = ($0 ~ /^[[:space:]]*6:00pm[[:space:]]*$/)
        waiting_for_titles = 0
        next
    }
    target_time && /^[[:space:]]*\[[0-9]+\]The Three Stooges[[:space:]]*$/ {
        waiting_for_titles = 1
        next
    }
    waiting_for_titles {
        sub(/^[[:space:]]+/, "")
        sub(/[[:space:]]+$/, "")
        print
        exit
    }
' "$TMP_FILE")

if [[ -z "$EPISODE_TITLES" ]]; then
    echo "No 6:00pm Three Stooges listing found for $SCHEDULE_DATE." >&2
    exit 1
fi

printf '%s\n' "$EPISODE_TITLES" |
    sed 's/No Census, No Feeling/No Census__METV_TITLE_COMMA__ No Feeling/g; s/, */\n/g; s/__METV_TITLE_COMMA__/,/g' |
    awk '
BEGIN {
    print "Title"
}
{
    title = $0
    sub(/^[[:space:]]+/, "", title)
    sub(/[[:space:]]+$/, "", title)
    if (title == "") {
        next
    }
    gsub(/"/, "\"\"", title)
    printf "\"%s\"\n", title
    written++
}
END {
    if (written == 0) {
        print "No short titles found in the 6:00pm Three Stooges listing." > "/dev/stderr"
        exit 1
    }
}' > "$OUT"

echo "Wrote Letterboxd CSV to $OUT"
