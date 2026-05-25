# Soil Profiles &mdash; Kathmandu Valley boreholes (flat table)

**File:** `soil_samples.csv` &nbsp;&middot;&nbsp; **Rows:** 318 &nbsp;&middot;&nbsp; **Size:** ~20 KB &nbsp;&middot;&nbsp; **License:** CC&#8209;BY&#8209;4.0

One row per borehole, derived from the layered profiles in [`data/soil_profiles.json`](../soil_profiles.json) &mdash;
the same dataset that powers [compare.html](../../compare.html). 318 real boreholes collected
across the Kathmandu&nbsp;Valley (JICA&nbsp;2002 &amp; 2014, JRAP&nbsp;2016, Bagmati Bridge,
Bhanimandal/Hatiban/Kritipur/Naxal/etc., plus published academic profiles).

> The full layered profiles live in `soil_profiles.json` (~1 MB). This CSV is the
> **flat, ready-to-fit** version &mdash; useful for V<sub>s30</sub> regression, NEHRP site-class
> classification or soil-type clustering.

## Columns

| #   | Column                    | Unit       | Description                                                                |
| --- | ------------------------- | ---------- | -------------------------------------------------------------------------- |
| 1   | `borehole_id`             | &mdash;    | Stable ID matching the key in `soil_profiles.json`                         |
| 2   | `site`                    | &mdash;    | Project or area name extracted from the ID                                 |
| 3   | `total_depth_m`           | m          | Sum of layer thicknesses                                                   |
| 4   | `n_layers`                | count      | Number of distinct soil layers logged                                      |
| 5   | `top3m_avg_density_kg_m3` | kg/m&sup3; | Thickness-weighted &rho; in the top 3 m                                    |
| 6   | `top3m_avg_vs_m_s`        | m/s        | Thickness-weighted V<sub>s</sub> in the top 3 m                            |
| 7   | `vs30_m_s`                | m/s        | NEHRP shear-wave velocity to 30 m (harmonic mean)                          |
| 8   | `nehrp_class`             | A&ndash;E  | Site class per ASCE 7-22 &sect;20.4 / IS&nbsp;1893&#8209;2016 Annex&nbsp;F |
| 9   | `clay_frac`               | 0&ndash;1  | Thickness fraction logged as clay                                          |
| 10  | `sand_frac`               | 0&ndash;1  | &hellip; as sand                                                           |
| 11  | `gravel_frac`             | 0&ndash;1  | &hellip; as gravel                                                         |
| 12  | `silt_frac`               | 0&ndash;1  | &hellip; as silt                                                           |

### NEHRP class thresholds

| Class | V<sub>s30</sub> range (m/s) | Description                 |
| ----- | --------------------------- | --------------------------- |
| A     | &ge; 1500                   | Hard rock                   |
| B     | 760 &ndash; 1499            | Rock                        |
| C     | 360 &ndash; 759             | Very dense soil / soft rock |
| D     | 180 &ndash; 359             | Stiff soil                  |
| E     | &lt; 180                    | Soft clay / very soft soil  |

## Quick-start

```python
import pandas as pd
df = pd.read_csv("data/soil/soil_samples.csv")
df["nehrp_class"].value_counts().plot.bar()  # most of KTM is D and E
```

### Train the in-browser comparison model

[compare.html](../../compare.html) trains a ridge regression on cheap inputs
(thickness, density, soil-type fractions, top-3 m summary) to predict V<sub>s30</sub>
without a shear-wave survey &mdash; this CSV is the exact feature table it uses.

## Regenerate

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/_gen_datasets.ps1
```

## Source

Original layered profiles compiled from public Department of Mines &amp; Geology
(DMG, Nepal) reports, JICA 2002 / 2014 microzonation studies, JRAP 2016 and
published peer-reviewed borehole logs. See `soil_profiles.json` for per-layer
&rho;, V<sub>s</sub> and soil-type tags.
