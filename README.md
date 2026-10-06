# letterboxd-scripts

This repository is for better documenting scripts for importing data into Letterboxd lists. I mostly just use lynx and sed, but not everyone knows how to do that offhand...

Documentation for the import format: https://letterboxd.com/about/importing-data/ 

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

## MeTV Saturday Three Stooges

Use `lynx` and Bash to generate a Letterboxd import CSV from the 6:00pm Three Stooges shorts in MeTV's Saturday schedule:

```sh
bash metv_saturday_stooges.sh
```

By default, this uses the current Saturday or the next Saturday and writes `metv_saturday_stooges_YYYY-MM-DD.csv`. Pass a Saturday date to choose a schedule, and optionally pass an output path:

```sh
bash metv_saturday_stooges.sh 2026-10-10 stooges.csv
```

The script requires `lynx`. It writes one `Title` row per short and does not include episode descriptions.
