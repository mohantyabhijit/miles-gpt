# MilesGPT

A lightweight MVP demo for the MilesGPT PRD: upload credit card statement CSVs, parse and categorize transactions, estimate actual vs best-case miles, and get replacement card recommendations.

## Features in this prototype

- CSV upload for one or more statements.
- Transaction normalization + category detection.
- Current miles estimation from a curated card ruleset.
- Best-case miles estimator across supported cards.
- Reward leakage analysis ("miles left on the table").
- Category-based replacement card recommendations.
- Storytelling panel with optional roast mode.

## Quick start

Because this is a static web app, no build step is required.

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173> and upload `sample-statement.csv`.

## Supported demo card set

- DBS Woman's World
- HSBC Revolution
- UOB Preferred Platinum Visa
- OCBC 90N
- Citi PremierMiles
- Generic Cashback (fallback)

> Reward calculations are estimates for demo purposes only.
