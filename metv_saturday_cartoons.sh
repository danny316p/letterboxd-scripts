#!/bin/bash
#bash commands to download a copy of the weekly MeTV Saturday Morning Cartoons schedule and convert it to Letterboxd list format
# I have not bothered to make this all that generic...

# use lynx to parse html and output to a file
# DO NOT run this more than necessary, I don't want to abuse MeTV's server
lynx -dump https://www.metv.com/schedule/2026-01-03 > mschlyn

# mangle that file with sed and grep to create a Letterboxd-ready csv file
echo "Title" > sedoutput.csv
#grep -n "10:00am" mschlyn | awk -F: '{print $1}' | xargs head mschlyn -n | sed '1,/7:00am/d' | sed '/\[/d' | sed '/0am/d' >> sedoutput.csv
sed '/  10:00am/,$d' mschlyn | sed '1,/7:00am/d' | sed '/\[/d' | sed '/0am/d' | tr -d '\r\n' | sed 's/"[^"]*"//g' | sed 's/,/\n/g' | sed 's/     /\n/g' | sed "s/’/\\'/g" >> sedoutput.csv

