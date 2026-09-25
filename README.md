# letterboxd-scripts

This repository is for better documenting scripts for importing data into Letterboxd lists. I mostly just use lynx and sed, but not everyone knows how to do that offhand...

Documentation for the import format: https://letterboxd.com/about/importing-data/ 

## MeTV Three Stooges

`metv_saturday_stooges.sh` extracts the 6:00 p.m. Three Stooges shorts from a MeTV daily schedule page and writes them as a Letterboxd CSV with a `Title` column. By default, it uses the current or next Saturday and writes `sedoutput.csv`.

```bash
bash metv_saturday_stooges.sh
bash metv_saturday_stooges.sh 2026-09-26 stooges.csv
```
