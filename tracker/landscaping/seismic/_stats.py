import numpy as np, json
d = np.loadtxt('response_spectra.csv', delimiter=',', skiprows=1)
T, Sd, Sv, PSv, Sa, PSa = d.T
G = 9.81
def at(T0, arr):
    i = np.argmin(np.abs(T - T0))
    return float(arr[i])
stats = {
    'Sd_max_m':     float(Sd.max()),  'T_Sd_max':  float(T[Sd.argmax()]),
    'Sv_max':       float(Sv.max()),  'T_Sv_max':  float(T[Sv.argmax()]),
    'PSv_max':      float(PSv.max()), 'T_PSv_max': float(T[PSv.argmax()]),
    'Sa_max_g':     float(Sa.max()/G),'T_Sa_max':  float(T[Sa.argmax()]),
    'PSa_max_g':    float(PSa.max()/G),'T_PSa_max':float(T[PSa.argmax()]),
    'Sa_at_0p2_g':  at(0.2, Sa)/G,
    'Sa_at_0p3_g':  at(0.3, Sa)/G,
    'Sa_at_1_g':    at(1.0, Sa)/G,
    'Sa_at_2_g':    at(2.0, Sa)/G,
    'PSa_at_0p2_g': at(0.2, PSa)/G,
    'PSa_at_1_g':   at(1.0, PSa)/G,
    'Sd_at_1_cm':   at(1.0, Sd)*100,
    'Sd_at_2_cm':   at(2.0, Sd)*100,
}
print(json.dumps(stats, indent=2))
