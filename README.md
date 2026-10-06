# letterboxd-scripts

This repository is for better documenting scripts for importing data into Letterboxd lists. I mostly just use lynx and sed, but not everyone knows how to do that offhand...

Documentation for the import format: https://letterboxd.com/about/importing-data/ 

## MeTV Three Stooges

`metv_saturday_stooges.sh` extracts the 6:00 p.m. Three Stooges shorts from a MeTV daily schedule page and writes them as a Letterboxd CSV with a `Title` column. By default, it uses the current or next Saturday and writes `sedoutput.csv`.

```bash
bash metv_saturday_stooges.sh
bash metv_saturday_stooges.sh 2026-09-26 stooges.csv
```

## AMC FearFest 2026

Use `lynx` and Bash to generate a Letterboxd import CSV from AMC's [2026 FearFest schedule](https://www.amc.com/blogs/check-out-the-full-schedule-for-amc-s-fearfest-2026--1075776):

```sh
bash amc_fearfest_2026.sh
```

This writes `amc_fearfest_2026.csv` in the current directory. Pass a path to choose another output file:

```sh
bash amc_fearfest_2026.sh fearfest.csv
```

The script requires `lynx`. It extracts timed movie listings in schedule order, skips non-movie programming, and writes a `Title,Year` CSV. Repeated screenings with the same title and year are included once; years are included when AMC specifies them.

## MeTV Three Stooges

`metv_saturday_stooges.sh` extracts the 6:00 p.m. Three Stooges shorts from a MeTV daily schedule page and writes them as a Letterboxd CSV with a `Title` column. By default, it uses the current or next Saturday and writes `sedoutput.csv`.

```bash
bash metv_saturday_stooges.sh
bash metv_saturday_stooges.sh 2026-09-26 stooges.csv
```
