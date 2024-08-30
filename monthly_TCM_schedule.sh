#!/bin/bash
#bash commands to download a copy of the monthly TCM schedule and convert it to Letterboxd list format
# I have not bothered to make this all that generic...

# use lynx to parse html and output to a file
# DO NOT run this more than necessary, I don't know who runs this server and I don't want to abuse it
lynx -dump http://escapepress.com/tcmsched/tcmbig_08.htm > tschlyn

# mangle that file with sed and grep to create a Letterboxd-ready csv file
echo "Title, Year" > sedoutput.csv; grep "\[[0-9]" tschlyn | grep -v "TCM Schedule" | grep -v "web counter" | sed -E 's/^.*\](.*) \(([1-2][0-9][0-9][0-9])\)/\"\1\", \2/' | sed -E 's/(^.*\])//' >> sedoutput.csv
