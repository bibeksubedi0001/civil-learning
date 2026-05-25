# Traffic Flow &mdash; hourly urban corridor (synthetic)

**File:** `traffic_flow.csv` &nbsp;&middot;&nbsp; **Rows:** 720 (24 h &times; 30 days) &nbsp;&middot;&nbsp; **Size:** ~30 KB &nbsp;&middot;&nbsp; **License:** CC0

A synthetic month-long flow trace for a **single urban arterial lane** at 1-hour resolution.
The shape (AM + PM peaks, weekend dip, weather penalties, random incidents) is calibrated
against the typical PeMS detector profile, but every value is procedurally generated &mdash;
no real data are mirrored here.

> Use this for time-series exercises (LSTM / Transformer / TFT), classical
> seasonal-naive baselines, anomaly detection of incidents, or simple weather-aware
> regression. For a real benchmark, see
> [Caltrans PeMS](https://pems.dot.ca.gov/) or the
> [METR-LA](https://github.com/liyaguang/DCRNN) / [PEMS-BAY](https://github.com/liyaguang/DCRNN) graphs.

## Columns

| #   | Column          | Unit       | Description                                                  |
| --- | --------------- | ---------- | ------------------------------------------------------------ |
| 1   | `timestamp`     | ISO-8601   | Local time at the start of the hour (`yyyy-MM-ddTHH:mm:ss`)  |
| 2   | `day_of_week`   | 0&ndash;6  | 0 = Sunday &hellip; 6 = Saturday                             |
| 3   | `hour`          | 0&ndash;23 | Hour of day                                                  |
| 4   | `flow_veh_h`    | veh/h      | Vehicles past the detector in that hour                      |
| 5   | `occupancy_pct` | 0&ndash;95 | Lane occupancy (% of time a vehicle is over the loop)        |
| 6   | `avg_speed_kmh` | km/h       | Average speed over the hour (free-flow ~65)                  |
| 7   | `weather`       | enum       | `clear` (~57%), `rain` (~29%), `fog` (~14%)                  |
| 8   | `incident`      | 0/1        | 1 if a crash/closure occurred in that hour (~1.2% base rate) |

## Quick-start

```python
import pandas as pd
df = pd.read_csv("data/traffic/traffic_flow.csv", parse_dates=["timestamp"])
df.set_index("timestamp").flow_veh_h.plot(figsize=(12,3), title="Hourly flow")
df.groupby("hour").flow_veh_h.mean().plot.bar(title="Daily profile")
```

### One-step ahead LSTM (PyTorch)

```python
import torch, torch.nn as nn
import numpy as np

vals = df.flow_veh_h.values.astype("float32") / df.flow_veh_h.max()
SEQ = 24
X = np.stack([vals[i:i+SEQ] for i in range(len(vals)-SEQ-1)])
y = vals[SEQ+1:]
X = torch.tensor(X).unsqueeze(-1); y = torch.tensor(y).unsqueeze(-1)

class M(nn.Module):
    def __init__(self): super().__init__(); self.l = nn.LSTM(1, 32, batch_first=True); self.fc = nn.Linear(32, 1)
    def forward(self, x): o, _ = self.l(x); return self.fc(o[:, -1])

m = M(); opt = torch.optim.Adam(m.parameters(), 1e-3); loss = nn.MSELoss()
for ep in range(30):
    opt.zero_grad(); l = loss(m(X), y); l.backward(); opt.step()
```

## Regenerate

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/_gen_datasets.ps1
```
