#!/bin/bash
set -euo pipefail

#bash commands to download a copy of the weekly MeTV Saturday Morning Cartoons schedule and convert it to Letterboxd list format
# I have not bothered to make this all that generic...

if [[ $# -gt 1 ]]; then
    echo "Usage: $0 [YYYY-MM-DD]" >&2
    exit 2
fi

if [[ $# -eq 1 ]]; then
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

# use lynx to parse html and output to a file
# DO NOT run this more than necessary, I don't want to abuse MeTV's server
lynx -dump "https://www.metv.com/schedule/$SCHEDULE_DATE" > mschlyn

# mangle that file with sed and grep to create a Letterboxd-ready csv file
echo "Title" > sedoutput.csv
#grep -n "10:00am" mschlyn | awk -F: '{print $1}' | xargs head mschlyn -n | sed '1,/7:00am/d' | sed '/\[/d' | sed '/0am/d' >> sedoutput.csv
sed '/  10:00am/,$d' mschlyn | sed '1,/7:00am/d' | sed '/\[/d' | sed '/0am/d' | tr -d '\r\n' | sed 's/"[^"]*"//g' | sed 's/,/\n/g' | sed 's/     /\n/g' | sed "s/’/\\'/g" >> sedoutput.csv
