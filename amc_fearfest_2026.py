#!/usr/bin/env python3
"""Generate a Letterboxd import CSV from AMC's 2026 FearFest schedule."""

import csv
import sys
from pathlib import Path


# Titles are kept in their first scheduled order. Non-film programming
# (including series episodes and TNA iMPACT!) is intentionally excluded.
FILMS = [
    ("Halloween III: Season of the Witch", ""),
    ("Halloween 4: The Return of Michael Myers", ""),
    ("Halloween 5: The Revenge of Michael Myers", ""),
    ("Halloween II", "1981"),
    ("Halloween", "1978"),
    ("Insidious", ""),
    ("Insidious: Chapter 2", ""),
    ("Insidious: Chapter 3", ""),
    ("Graveyard Shift", ""),
    ("Pet Sematary", ""),
    ("Silver Bullet", ""),
    ("It", "1990"),
    ("Christine", ""),
    ("It", "2017"),
    ("Carrie", "2013"),
    ("Misery", ""),
    ("Halloween", "2007"),
    ("A Nightmare on Elm Street", "1984"),
    ("Friday the 13th", "1980"),
    ("Final Destination", "2000"),
    ("Final Destination 2", ""),
    ("The Final Destination", "2009"),
    ("Thir13en Ghosts", ""),
    ("Ghost Ship", ""),
    ("Jeepers Creepers", ""),
    ("Child's Play 3", ""),
    ("Child's Play 2", ""),
    ("Child's Play", "1988"),
    ("Bride of Chucky", ""),
    ("Seed of Chucky", ""),
    ("Curse of Chucky", ""),
    ("Cult of Chucky", ""),
    ("Halloween II", "2009"),
    ("Leprechaun", ""),
    ("Gremlins", ""),
    ("The Fly", ""),
    ("The Thing", ""),
    ("Tremors", ""),
    ("Lake Placid", ""),
    ("Cujo", ""),
    ("Children of the Corn", ""),
    ("Carrie", "1976"),
    ("A Nightmare on Elm Street 5: The Dream Child", ""),
    ("A Nightmare on Elm Street 4: The Dream Master", ""),
    ("Wes Craven's New Nightmare", ""),
    ("A Nightmare on Elm Street 3: Dream Warriors", ""),
    ("A Nightmare on Elm Street 2: Freddy's Revenge", ""),
    ("A Nightmare on Elm Street", "2010"),
    ("Freddy's Dead: The Final Nightmare", ""),
    ("House of Wax", ""),
    ("Jason Goes to Hell: The Final Friday", ""),
    ("Friday the 13th Part VIII: Jason Takes Manhattan", ""),
    ("Friday the 13th Part VI: Jason Lives", ""),
    ("Friday the 13th Part VII: The New Blood", ""),
    ("Friday the 13th Part 2", ""),
    ("Friday the 13th Part III", ""),
    ("Freddy vs. Jason", ""),
    ("From Dusk Till Dawn", ""),
    ("Friday the 13th", "2009"),
    ("The Return of the Living Dead", ""),
    ("Fright Night", ""),
    ("The Lost Boys", ""),
    ("Friday the 13th: A New Beginning", ""),
    ("The Terminator", ""),
    ("Predator", ""),
    ("Men in Black", ""),
    ("Men in Black II", ""),
    ("Jurassic World: Dominion", ""),
]


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("amc_fearfest_2026.csv")
    with output.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["Title", "Year"])
        writer.writerows(FILMS)

    print(f"Wrote {len(FILMS)} films to {output}")


if __name__ == "__main__":
    main()
