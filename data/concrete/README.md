# Concrete Compressive Strength &mdash; sample dataset

**File:** `concrete_strength.csv` &nbsp;&middot;&nbsp; **Rows:** 600 &nbsp;&middot;&nbsp; **Size:** ~27 KB &nbsp;&middot;&nbsp; **License:** CC0 (public-domain dedication)

A small, ready-to-load CSV that mirrors the shape of the canonical
[**UCI Concrete Compressive Strength**](https://archive.ics.uci.edu/dataset/165/concrete+compressive+strength) dataset
([Yeh, 1998](<https://doi.org/10.1016/S0008-8846(98)00165-3>)).
Values are **synthetically generated** with a seeded RNG and a toy mechanistic model
(Abrams' law + SCM substitution + ACI&#8209;209 age factor + Gaussian noise),
so the file is reproducible from `tools/_gen_datasets.ps1` and contains no third-party data.

> Use this dataset for in-browser demos and notebook tutorials. For real research, pull the
> original 1 030&#8209;row UCI table from the link above.

## Columns

| #   | Column                   | Unit       | Description                                                |
| --- | ------------------------ | ---------- | ---------------------------------------------------------- |
| 1   | `cement_kg_m3`           | kg/m&sup3; | Portland cement content per cubic metre of mix             |
| 2   | `blast_slag_kg_m3`       | kg/m&sup3; | Ground-granulated blast-furnace slag                       |
| 3   | `fly_ash_kg_m3`          | kg/m&sup3; | Class&nbsp;F or Class&nbsp;C fly ash                       |
| 4   | `water_kg_m3`            | kg/m&sup3; | Free water                                                 |
| 5   | `superplasticizer_kg_m3` | kg/m&sup3; | High-range water reducer (HRWR)                            |
| 6   | `coarse_agg_kg_m3`       | kg/m&sup3; | Coarse aggregate (typically 10&ndash;20 mm)                |
| 7   | `fine_agg_kg_m3`         | kg/m&sup3; | Fine aggregate (sand)                                      |
| 8   | `age_days`               | days       | Curing age at the test (1, 3, 7, 14, 28, 56, 90, 180, 365) |
| 9   | `strength_mpa`           | MPa        | **Target** &mdash; compressive strength at the given age   |

## Quick-start

### Pandas

```python
import pandas as pd
df = pd.read_csv("data/concrete/concrete_strength.csv")
print(df.describe())
# Add the w/(c+SCM) ratio civil engineers actually use
df["wcr"] = df.water_kg_m3 / (df.cement_kg_m3 + 0.7*df.blast_slag_kg_m3 + 0.8*df.fly_ash_kg_m3)
df.plot.scatter("wcr", "strength_mpa", c="age_days", colormap="viridis")
```

### scikit-learn baseline

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

X = df.drop(columns="strength_mpa")
y = df.strength_mpa
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
rf = RandomForestRegressor(n_estimators=300, random_state=42).fit(Xtr, ytr)
print("MAE:", mean_absolute_error(yte, rf.predict(Xte)), "R^2:", r2_score(yte, rf.predict(Xte)))
```

### In the browser

The CSV is small enough to load directly into [explorer.html](../../explorer.html) or
[lab.html](../../lab.html) via the file picker.

## Regenerate

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/_gen_datasets.ps1
```
