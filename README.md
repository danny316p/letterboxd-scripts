# letterboxd-scripts

This repository is for better documenting scripts for importing data into Letterboxd lists. I mostly just use lynx and sed, but not everyone knows how to do that offhand...

Documentation for the import format: https://letterboxd.com/about/importing-data/ 

## AMC FearFest 2026

Generate a Letterboxd import CSV from AMC's [2026 FearFest schedule](https://www.amc.com/blogs/check-out-the-full-schedule-for-amc-s-fearfest-2026--1075776):

```sh
python3 amc_fearfest_2026.py
```

This writes `amc_fearfest_2026.csv` in the current directory. Pass a path to choose another output file:

```sh
python3 amc_fearfest_2026.py fearfest.csv
```

The CSV contains each scheduled movie once, in first-airing order, with a `Title,Year` header. Non-movie programming is excluded; years are supplied where the schedule identifies a version or the title is otherwise ambiguous.
