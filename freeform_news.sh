#!/bin/bash
#bash commands to download a copy of the weekly MeTV Saturday Morning Cartoons schedule and convert it to Letterboxd list format
# I have not bothered to make this all that generic...

# use lynx to parse html and output to a file
# DO NOT run this more than necessary, I don't want to abuse MeTV's server
 lynx -dump https://www.freeform.com/news/5ed9ff11-2d45-4dbd-84ef-a0ef365d21db/category/3444024 > dsch
# lynx -dump https://www.freeform.com/news/8e058db0-9e60-46e1-9488-0c26687d29a7/category/3444024 > dsch
#
#


# mangle that file with sed and grep to create a Letterboxd-ready csv file
echo "Title, Year" > sedoutput.csv
#grep -n "10:00am" mschlyn | awk -F: '{print $1}' | xargs head mschlyn -n | sed '1,/7:00am/d' | sed '/\[/d' | sed '/0am/d' >> sedoutput.csv
 
grep -i 'P*T - ' dsch | sed 's/^.*T - //' | sed 's/(Disney Animated)//' | sed 's/(Disney-Pixar)//' | sed 's/(Live Action)//' | sed 's/(Disney//' | sed 's/ (/, /' | sed 's/)//'  >> sedoutput.csv
# sed '/  10:00am/,$d' dsch | sed '1,/7:00am/d' | sed '/\[/d' | sed '/0am/d' | tr -d '\r\n' | sed 's/"[^"]*"//g' | sed 's/,/\n/g' | sed 's/     /\n/g' >> sedoutput.csv

