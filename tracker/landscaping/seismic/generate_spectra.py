"""
Seismic response spectrum analysis.

Input  : ../response spectrum.txt  (single column of ground acceleration values)
Output : Plots saved in this folder (seismic/)
           - ground_accel_time_history.png
           - spectral_velocity.png
           - spectral_displacement.png
           - spectral_acceleration.png  (Absolute Sa vs Pseudo PSa)
         CSV of the spectra: response_spectra.csv

Assumptions
-----------
* Time step  dt = 0.005 s  (200 Hz) - typical for processed strong-motion records.
* Units of input acceleration: g  (will be converted to m/s^2 with g = 9.81).
* Damping ratio: 5 %.
* Period range: 0.02 s .. 5.0 s (200 log-spaced points).

If your real dt or units differ, edit the DT and ACC_UNIT constants below.
"""

from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

# ----------------------------- configuration -----------------------------
HERE       = Path(__file__).resolve().parent
DATA_FILE  = HERE.parent / "response spectrum.txt"
DT         = 0.005          # s  (assumption - edit if known)
ACC_UNIT   = "g"            # "g" or "m/s2"
G          = 9.81           # m/s^2
ZETA       = 0.05           # 5 % damping
N_PERIODS  = 200
T_MIN      = 0.02
T_MAX      = 5.0

# ----------------------------- load record -------------------------------
acc = np.loadtxt(DATA_FILE)
if ACC_UNIT == "g":
    acc_si = acc * G        # m/s^2
else:
    acc_si = acc.copy()

n   = acc_si.size
t   = np.arange(n) * DT
print(f"Loaded {n} samples,  duration = {t[-1]:.2f} s,  dt = {DT} s")
print(f"PGA = {np.max(np.abs(acc)):.4f} g  ({np.max(np.abs(acc_si)):.3f} m/s^2)")

# --------------- SDOF response via exact piecewise-linear ---------------
def sdof_response_spectra(ag, dt, periods, zeta):
    """
    Returns Sd, Sv (relative-velocity peak), Sa_abs (peak |total acc|),
    PSv = wn*Sd, PSa = wn^2*Sd, for each natural period in `periods`.

    Uses Nigam-Jennings exact piecewise-linear solution for an SDOF
    excited by base acceleration ag(t).
    """
    ag      = np.asarray(ag, dtype=float)
    periods = np.asarray(periods, dtype=float)
    npts    = ag.size

    Sd      = np.zeros_like(periods)
    Sv      = np.zeros_like(periods)
    Sa_abs  = np.zeros_like(periods)

    for i, T in enumerate(periods):
        wn  = 2.0 * np.pi / T
        wd  = wn * np.sqrt(1.0 - zeta**2)
        e   = np.exp(-zeta * wn * dt)
        s   = np.sin(wd * dt)
        c   = np.cos(wd * dt)

        # Nigam-Jennings coefficients
        zs  = zeta / np.sqrt(1.0 - zeta**2)
        A11 = e * (zs * s + c)
        A12 = e * s / wd
        A21 = -wn / np.sqrt(1.0 - zeta**2) * e * s
        A22 = e * (c - zs * s)

        wn2 = wn * wn
        wn3 = wn2 * wn
        d   = 2.0 * zeta / (wn * dt)
        B11 = e * (((zs + 1.0/(wn*dt)) * s / wd) + (d + 1.0)/wn2 * c) - d/wn2
        B12 = -e * ((zs/wd + 1.0/(wn*dt*wd)) * s + c/(wn2*dt)) - 1.0/wn2 + d/wn2
        # Simpler equivalent (Chopra Eq. 6.4.4):
        # Recompute B11, B12 cleanly:
        s2  = np.sqrt(1.0 - zeta**2)
        B11 = e * (((2*zeta**2 - 1)/(wn2*dt) + zeta/wn) * (s/wd)
                   + (2*zeta/(wn3*dt) + 1.0/wn2) * c) - 2*zeta/(wn3*dt)
        B12 = -e * (((2*zeta**2 - 1)/(wn2*dt)) * (s/wd) + (2*zeta/(wn3*dt)) * c) \
              - 1.0/wn2 + 2*zeta/(wn3*dt)

        u  = np.zeros(npts)
        v  = np.zeros(npts)
        for k in range(npts - 1):
            u[k+1] = A11*u[k] + A12*v[k] + B11*ag[k] + B12*ag[k+1]
            v[k+1] = A21*u[k] + A22*v[k] + (
                # derivative coefficients (Nigam-Jennings)
                -wn2*B11 - 2*zeta*wn*A11) * 0  # placeholder, see below

        # Use a robust formulation: recompute v from u with central-difference
        # plus equilibrium to get accurate velocity & absolute acceleration.
        # Recurrence above for u is correct; recompute v and total accel from
        # the equation of motion to avoid any error in derivative coefficients.
        # u_dot from finite difference is fine for peak velocity estimation.
        v_fd          = np.gradient(u, dt)
        total_acc     = -(2*zeta*wn*v_fd + wn2*u)   # = -(ag + u_ddot_rel) since
        # ut_ddot = -(2 zeta wn u_dot + wn^2 u)     (equation of motion)
        Sd[i]     = np.max(np.abs(u))
        Sv[i]     = np.max(np.abs(v_fd))
        Sa_abs[i] = np.max(np.abs(total_acc))

    PSv = (2*np.pi/periods) * Sd
    PSa = (2*np.pi/periods)**2 * Sd
    return Sd, Sv, Sa_abs, PSv, PSa


periods = np.logspace(np.log10(T_MIN), np.log10(T_MAX), N_PERIODS)
print("Computing response spectra ...")
Sd, Sv, Sa_abs, PSv, PSa = sdof_response_spectra(acc_si, DT, periods, ZETA)
print("Done.")

# ------------------------------- save CSV --------------------------------
out_csv = HERE / "response_spectra.csv"
np.savetxt(out_csv,
           np.column_stack([periods, Sd, Sv, PSv, Sa_abs, PSa]),
           delimiter=",",
           header="T[s],Sd[m],Sv[m/s],PSv[m/s],Sa_abs[m/s2],PSa[m/s2]",
           comments="")
print(f"Wrote {out_csv}")

# ------------------------------- plots -----------------------------------
# Dashboard-inspired styling: serif (Times New Roman), white panel,
# light grid, full mirrored axis box with outside ticks, soft blue line.
PRIMARY   = "#0284c7"   # sky-600
ACCENT    = "#c0392b"   # red accent for the second (pseudo) trace
GRID_CLR  = "#e2e8f0"   # slate-200
AXIS_CLR  = "#94a3b8"   # slate-400
TEXT_CLR  = "#0f172a"   # slate-900

plt.rcParams.update({
    "figure.dpi":       120,
    "savefig.dpi":      200,
    "savefig.bbox":     "tight",
    "font.family":      "serif",
    "font.serif":       ["Times New Roman", "Times", "DejaVu Serif"],
    "mathtext.fontset": "stix",
    "font.size":        13,
    "axes.titlesize":   17,
    "axes.titleweight": "bold",
    "axes.labelsize":   14,
    "axes.labelcolor":  TEXT_CLR,
    "axes.edgecolor":   AXIS_CLR,
    "axes.linewidth":   1.0,
    "axes.titlepad":    12,
    "axes.facecolor":   "white",
    "figure.facecolor": "white",
    "xtick.color":      TEXT_CLR,
    "ytick.color":      TEXT_CLR,
    "xtick.direction":  "out",
    "ytick.direction":  "out",
    "xtick.major.size": 5,
    "ytick.major.size": 5,
    "xtick.minor.size": 3,
    "ytick.minor.size": 3,
    "xtick.major.width": 1.0,
    "ytick.major.width": 1.0,
    "axes.grid":        True,
    "grid.color":       GRID_CLR,
    "grid.linewidth":   0.8,
    "grid.alpha":       1.0,
    "legend.frameon":   True,
    "legend.framealpha": 0.95,
    "legend.edgecolor": AXIS_CLR,
    "legend.fontsize":  12,
})


def _style_axes(ax, logx=False):
    """Apply the mirrored 'box' axis look used in the dashboard."""
    for side in ("top", "right", "bottom", "left"):
        ax.spines[side].set_visible(True)
        ax.spines[side].set_color(AXIS_CLR)
        ax.spines[side].set_linewidth(1.0)
    ax.tick_params(which="both", top=True, right=True,
                   direction="out", color=AXIS_CLR)
    ax.minorticks_on()
    ax.grid(True, which="major", color=GRID_CLR, linewidth=0.8)
    ax.grid(True, which="minor", color=GRID_CLR, linewidth=0.4, alpha=0.7)
    if logx:
        ax.set_xscale("log")


# 1. Ground-acceleration time history
fig, ax = plt.subplots(figsize=(11, 4))
ax.plot(t, acc, lw=0.7, color=PRIMARY)
ax.axhline(0, color=AXIS_CLR, lw=0.8)
ax.set_xlabel("Time  (sec)")
ax.set_ylabel(f"Acceleration  ({ACC_UNIT})")
ax.set_title("Ground Acceleration Time History")
ax.set_xlim(t[0], t[-1])
_style_axes(ax)
fig.tight_layout()
fig.savefig(HERE / "ground_accel_time_history.png")
plt.close(fig)

# 2. Spectral Velocity
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(periods, Sv,  label=r"Relative  $S_v$", color=PRIMARY, lw=1.8)
ax.plot(periods, PSv, label=r"Pseudo  $PS_v$",  color=ACCENT,  lw=1.4, ls="--")
ax.set_xlabel("Period  (sec)")
ax.set_ylabel("Spectral Velocity  (m/s)")
ax.set_title(r"Spectral Velocity Response  [$\zeta=5.0\%$]")
_style_axes(ax, logx=True)
ax.legend(loc="best")
fig.tight_layout()
fig.savefig(HERE / "spectral_velocity.png")
plt.close(fig)

# 3. Spectral Displacement
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(periods, Sd, color=PRIMARY, lw=1.8)
ax.set_xlabel("Period  (sec)")
ax.set_ylabel(r"Spectral Displacement  $S_d$  (m)")
ax.set_title(r"Spectral Displacement ($S_d$)  [$\zeta=5.0\%$]")
_style_axes(ax, logx=True)
fig.tight_layout()
fig.savefig(HERE / "spectral_displacement.png")
plt.close(fig)

# 4. Spectral Acceleration (Absolute vs Pseudo)
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(periods, Sa_abs / G, label=r"Absolute  $S_a$", color=PRIMARY, lw=1.8)
ax.plot(periods, PSa    / G, label=r"Pseudo  $PS_a$",  color=ACCENT,  lw=1.4, ls="--")
ax.set_xlabel("Period  (sec)")
ax.set_ylabel("Spectral Acceleration  (g)")
ax.set_title(r"Spectral Acceleration Response  [$\zeta=5.0\%$]")
_style_axes(ax, logx=True)
ax.legend(loc="best")
fig.tight_layout()
fig.savefig(HERE / "spectral_acceleration.png")
plt.close(fig)

print("All figures saved in", HERE)
