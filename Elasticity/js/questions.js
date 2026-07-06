/* ============================================================
   Elasticity — Question bank (22 past + 20 harder + 5 challenge = 47).
   Past-paper tags: 2074, 2077, 2078, 2079, 2081, 2082 (B.S.).
   Harder and challenge questions are higher-order (no exam tag).
   ============================================================ */

const QUESTIONS = [
    /* ---------------- 1. BASIC CONCEPTS ---------------- */
    {
        id: "q1", section: "basics", year: "2079",
        text: "Among the following materials, the most elastic one is:",
        options: [
            { key: "a", text: "Rubber" },
            { key: "b", text: "Copper" },
            { key: "c", text: "Steel" },
            { key: "d", text: "Glass" }
        ],
        answer: "c",
        explanation: "The larger the Young's modulus, the more elastic the body. Steel has the greatest Young's modulus of these, so it is the most elastic — it opposes deformation the most and regains its shape best."
    },
    {
        id: "q3", section: "basics", year: "2077",
        text: "Which of the following is nearly a perfect plastic body?",
        options: [
            { key: "a", text: "Quartz" },
            { key: "b", text: "Wet mud" },
            { key: "c", text: "Phosphor bronze" },
            { key: "d", text: "Steel" }
        ],
        answer: "b",
        explanation: "Plastic bodies do not regain their original configuration once the deforming force is removed. Wet mud and paraffin wax are nearly perfect plastic bodies, while quartz and phosphor bronze are nearly perfect elastic bodies."
    },
    {
        id: "q24", section: "basics", year: "",
        text: "The temporary delay with which a body regains its original configuration after the deforming force is removed (the elastic after-effect) is largest and smallest, respectively, for:",
        options: [
            { key: "a", text: "quartz; glass" },
            { key: "b", text: "glass; quartz and phosphor bronze" },
            { key: "c", text: "steel; rubber" },
            { key: "d", text: "rubber; steel" }
        ],
        answer: "b",
        explanation: "Glass shows the maximum elastic after-effect (it takes a very long time to return), while quartz and phosphor bronze show the minimum (they return almost at once). That is why quartz and phosphor bronze fibres are used in sensitive suspension instruments."
    },

    /* ---------------- 2. STRESS ---------------- */
    {
        id: "q4", section: "stress", year: "2074",
        text: "A steel wire of radius $1\\,$mm supports a load of $3.14\\,$kg. The longitudinal stress developed in the wire is nearly: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$1\\times10^{5}\\,\\text{N m}^{-2}$" },
            { key: "b", text: "$1\\times10^{6}\\,\\text{N m}^{-2}$" },
            { key: "c", text: "$1\\times10^{7}\\,\\text{N m}^{-2}$" },
            { key: "d", text: "$1\\times10^{8}\\,\\text{N m}^{-2}$" }
        ],
        answer: "c",
        explanation: "Stress $=\\dfrac{F}{A}=\\dfrac{mg}{\\pi r^2}=\\dfrac{3.14\\times10}{\\pi\\times(10^{-3})^2}=\\dfrac{31.4}{3.14\\times10^{-6}}=1\\times10^{7}\\,\\text{N m}^{-2}$."
    },
    {
        id: "q5", section: "stress", year: "2078",
        text: "The deforming force acting per unit area parallel (tangential) to the surface of a body is called:",
        options: [
            { key: "a", text: "Normal stress" },
            { key: "b", text: "Volumetric stress" },
            { key: "c", text: "Shear (tangential) stress" },
            { key: "d", text: "Longitudinal strain" }
        ],
        answer: "c",
        explanation: "A force acting parallel to the surface changes the shape without changing the volume; the force per unit area is the tangential or shear stress, $\\dfrac{F_{\\parallel}}{A}$."
    },
    {
        id: "q6", section: "stress", year: "2082",
        text: "A tangential force of $50\\,$N acts on the top face of a block of area $2\\times10^{-3}\\,$m$^2$. The shear stress produced is:",
        options: [
            { key: "a", text: "$2.5\\times10^{3}\\,\\text{N m}^{-2}$" },
            { key: "b", text: "$2.5\\times10^{4}\\,\\text{N m}^{-2}$" },
            { key: "c", text: "$1.0\\times10^{5}\\,\\text{N m}^{-2}$" },
            { key: "d", text: "$2.5\\times10^{5}\\,\\text{N m}^{-2}$" }
        ],
        answer: "b",
        explanation: "Shear stress $=\\dfrac{F_{\\parallel}}{A}=\\dfrac{50}{2\\times10^{-3}}=2.5\\times10^{4}\\,\\text{N m}^{-2}$."
    },
    {
        id: "q25", section: "stress", year: "",
        text: "Two wires of the same material, of radii $r$ and $2r$, hang vertically and each supports the same load. The ratio of the tensile stress in the thinner wire to that in the thicker wire is:",
        options: [
            { key: "a", text: "$1:1$" },
            { key: "b", text: "$2:1$" },
            { key: "c", text: "$4:1$" },
            { key: "d", text: "$1:4$" }
        ],
        answer: "c",
        explanation: "Stress $=\\dfrac{F}{A}=\\dfrac{F}{\\pi r^2}\\propto\\dfrac{1}{r^2}$ for the same load. Thinner : thicker $=\\dfrac{1}{r^2}:\\dfrac{1}{(2r)^2}=1:\\dfrac{1}{4}=4:1$, so the thinner wire carries four times the stress."
    },
    {
        id: "q26", section: "stress", year: "",
        text: "A uniform metal wire of length $L$ and density $\\rho$ hangs vertically from a rigid support. The longitudinal stress at its topmost cross-section, due only to its own weight, is:",
        options: [
            { key: "a", text: "$\\rho g L$" },
            { key: "b", text: "$2\\rho g L$" },
            { key: "c", text: "$\\dfrac{\\rho g L}{2}$" },
            { key: "d", text: "$\\rho g L^{2}$" }
        ],
        answer: "a",
        explanation: "The top section carries the whole weight $W=mg=(\\rho A L)g$. Stress $=\\dfrac{W}{A}=\\dfrac{\\rho A L g}{A}=\\rho g L$; the area cancels, so the self-weight stress does not depend on the cross-section."
    },

    /* ---------------- 3. STRAIN ---------------- */
    {
        id: "q7", section: "strain", year: "2078",
        text: "A cube is given equal small tensile strains $\\epsilon$ along each of its three edges. The resulting volumetric strain is approximately:",
        options: [
            { key: "a", text: "$\\epsilon$" },
            { key: "b", text: "$2\\epsilon$" },
            { key: "c", text: "$3\\epsilon$" },
            { key: "d", text: "$\\epsilon^{3}$" }
        ],
        answer: "c",
        explanation: "For small strains the fractional change in volume equals the sum of the three linear strains: $\\dfrac{\\Delta V}{V}=\\epsilon_x+\\epsilon_y+\\epsilon_z=3\\epsilon$. The higher-order $\\epsilon^2$ and $\\epsilon^3$ terms are negligible."
    },
    {
        id: "q8", section: "strain", year: "2081",
        text: "A wire of original length $2.5\\,$m is stretched by $0.5\\,$mm. Its longitudinal strain is:",
        options: [
            { key: "a", text: "$2\\times10^{-4}$" },
            { key: "b", text: "$2\\times10^{-3}$" },
            { key: "c", text: "$5\\times10^{-4}$" },
            { key: "d", text: "$5\\times10^{-3}$" }
        ],
        answer: "a",
        explanation: "Longitudinal strain $=\\dfrac{\\Delta l}{l}=\\dfrac{0.5\\times10^{-3}}{2.5}=2\\times10^{-4}$ (dimensionless)."
    },
    {
        id: "q28", section: "strain", year: "",
        text: "The top face of a block of height $5\\,$cm is displaced horizontally by $0.5\\,$mm relative to its fixed base by a tangential force. The shearing strain produced is:",
        options: [
            { key: "a", text: "$0.01\\,$rad" },
            { key: "b", text: "$0.1\\,$rad" },
            { key: "c", text: "$0.001\\,$rad" },
            { key: "d", text: "$1\\,$rad" }
        ],
        answer: "a",
        explanation: "Shearing strain $\\phi=\\dfrac{\\text{lateral displacement}}{\\text{height}}=\\dfrac{0.5\\times10^{-3}}{5\\times10^{-2}}=0.01\\,$rad."
    },

    /* ---------------- 4. HOOKE'S LAW & CURVE ---------------- */
    {
        id: "q9", section: "hooke", year: "2074",
        text: "According to Hooke's law, within the elastic limit:",
        options: [
            { key: "a", text: "stress $=$ strain" },
            { key: "b", text: "stress $\\propto$ strain" },
            { key: "c", text: "stress $\\propto \\dfrac{1}{\\text{strain}}$" },
            { key: "d", text: "stress $\\propto$ strain$^2$" }
        ],
        answer: "b",
        explanation: "Hooke's law states that, within a certain (elastic) limit, stress is directly proportional to strain: $\\text{stress}=E\\times\\text{strain}$, where $E$ is the modulus of elasticity."
    },
    {
        id: "q10", section: "hooke", year: "2079",
        text: "On the stress–strain curve, the point up to which Hooke's law is obeyed is called the:",
        options: [
            { key: "a", text: "Elastic limit" },
            { key: "b", text: "Proportionality limit" },
            { key: "c", text: "Fracture point" },
            { key: "d", text: "Yield point" }
        ],
        answer: "b",
        explanation: "The straight portion 'oa' of the curve obeys Hooke's law; the point 'a' up to which stress $\\propto$ strain is the proportionality limit. The elastic limit 'b' lies slightly beyond it."
    },
    {
        id: "q30", section: "hooke", year: "",
        text: "A wire is loaded just beyond its limit of proportionality but still below its elastic limit. Then the wire:",
        options: [
            { key: "a", text: "obeys Hooke's law and returns to its original length" },
            { key: "b", text: "does not obey Hooke's law but still returns to its original length" },
            { key: "c", text: "neither obeys Hooke's law nor returns to its original length" },
            { key: "d", text: "breaks at once" }
        ],
        answer: "b",
        explanation: "Between the proportionality limit and the elastic limit, stress is no longer strictly proportional to strain (Hooke's law fails), yet the deformation is still fully recoverable: the wire regains its original length once unloaded. Permanent set begins only beyond the elastic limit."
    },

    /* ---------------- 5. MODULI OF ELASTICITY ---------------- */
    {
        id: "q2", section: "moduli", year: "2081",
        text: "For a perfectly rigid body, the value of Young's modulus of elasticity is:",
        options: [
            { key: "a", text: "Zero" },
            { key: "b", text: "Unity" },
            { key: "c", text: "Infinity" },
            { key: "d", text: "Negative" }
        ],
        answer: "c",
        explanation: "A perfectly rigid body produces no strain for any stress, so $Y=\\dfrac{\\text{stress}}{\\text{strain}}\\to\\infty$. Young's modulus of a highly elastic or rigid body is taken as infinite."
    },
    {
        id: "q23", section: "moduli", year: "",
        text: "Two wires, one of steel and one of copper, are identical in length and cross-section. Steel has a larger Young's modulus than copper. When both are stretched by the same force within the elastic limit:",
        options: [
            { key: "a", text: "the steel wire stretches more, because it is more elastic" },
            { key: "b", text: "the copper wire stretches more" },
            { key: "c", text: "both stretch by exactly the same amount" },
            { key: "d", text: "the steel wire does not stretch at all" }
        ],
        answer: "b",
        explanation: "Extension $\\Delta l=\\dfrac{FL}{AY}\\propto\\dfrac{1}{Y}$ for the same force, length and area. Copper has the smaller $Y$, so it stretches more. A more elastic material (larger $Y$) resists deformation better and therefore stretches less. This is a common trap."
    },
    {
        id: "q11", section: "moduli", year: "2077",
        text: "Within the elastic limit the stress-strain graphs of two wires $P$ and $Q$ of identical dimensions are straight lines, with $P$'s line inclined at a greater angle to the strain-axis than $Q$'s. Which statement is correct?",
        options: [
            { key: "a", text: "$Q$ has the greater Young's modulus and is more elastic" },
            { key: "b", text: "$P$ has the greater Young's modulus and is more elastic" },
            { key: "c", text: "$P$ has the greater Young's modulus but $Q$ is more elastic" },
            { key: "d", text: "both wires have the same Young's modulus" }
        ],
        answer: "b",
        explanation: "The slope of a stress-strain line is Young's modulus, $Y=\\dfrac{\\text{stress}}{\\text{strain}}$. A steeper line (a greater angle with the strain-axis) has a larger slope, so $P$ has the greater $Y$. The larger the Young's modulus, the more a material resists deformation, so $P$ is also the more elastic."
    },
    {
        id: "q29", section: "moduli", year: "",
        text: "Two wires $A$ and $B$ of the same material and length are stretched by equal forces within the elastic limit. If the diameter of $A$ is twice that of $B$, the ratio of the longitudinal strain in $A$ to that in $B$ is:",
        options: [
            { key: "a", text: "$1:1$" },
            { key: "b", text: "$1:2$" },
            { key: "c", text: "$1:4$" },
            { key: "d", text: "$4:1$" }
        ],
        answer: "c",
        explanation: "Strain $=\\dfrac{\\text{stress}}{Y}=\\dfrac{F}{\\pi r^2 Y}\\propto\\dfrac{1}{r^2}$ for the same force, material and length. With $r_A=2r_B$, strain$_A$ : strain$_B=\\dfrac{1}{4}:1=1:4$."
    },
    {
        id: "q12", section: "moduli", year: "2078",
        text: "A wire of length $L$ and cross-sectional area $A$ stretches by $l$ under a load $F$. It is replaced by another wire of the same material but of half the length and half the cross-sectional area. Under the same load $F$, the new extension is:",
        options: [
            { key: "a", text: "$\\dfrac{l}{2}$" },
            { key: "b", text: "$l$" },
            { key: "c", text: "$2l$" },
            { key: "d", text: "$4l$" }
        ],
        answer: "b",
        explanation: "Extension $\\Delta L=\\dfrac{FL}{AY}$. Halving both $L$ and $A$: $\\Delta L'=\\dfrac{F(L/2)}{(A/2)Y}=\\dfrac{FL}{AY}=l$. The two changes cancel, so the extension is unchanged."
    },
    {
        id: "q13", section: "moduli", year: "2082",
        text: "A pressure of $2\\times10^{6}\\,$N m$^{-2}$ applied to a liquid decreases its volume by $0.1\\%$. The bulk modulus of the liquid is:",
        options: [
            { key: "a", text: "$2\\times10^{6}\\,\\text{N m}^{-2}$" },
            { key: "b", text: "$2\\times10^{8}\\,\\text{N m}^{-2}$" },
            { key: "c", text: "$2\\times10^{9}\\,\\text{N m}^{-2}$" },
            { key: "d", text: "$2\\times10^{12}\\,\\text{N m}^{-2}$" }
        ],
        answer: "c",
        explanation: "$K=\\dfrac{\\text{normal stress}}{\\text{volumetric strain}}=\\dfrac{2\\times10^{6}}{0.1/100}=\\dfrac{2\\times10^{6}}{10^{-3}}=2\\times10^{9}\\,\\text{N m}^{-2}$."
    },
    {
        id: "q14", section: "moduli", year: "2079",
        text: "A shear stress of $4\\times10^{7}\\,$N m$^{-2}$ produces a shearing strain of $10^{-3}\\,$rad in a body. Its modulus of rigidity is:",
        options: [
            { key: "a", text: "$4\\times10^{10}\\,\\text{N m}^{-2}$" },
            { key: "b", text: "$4\\times10^{7}\\,\\text{N m}^{-2}$" },
            { key: "c", text: "$4\\times10^{4}\\,\\text{N m}^{-2}$" },
            { key: "d", text: "$4\\times10^{13}\\,\\text{N m}^{-2}$" }
        ],
        answer: "a",
        explanation: "$\\eta=\\dfrac{\\text{tangential stress}}{\\text{shearing strain}}=\\dfrac{4\\times10^{7}}{10^{-3}}=4\\times10^{10}\\,\\text{N m}^{-2}$."
    },
    {
        id: "q15", section: "moduli", year: "2081",
        text: "The isothermal bulk modulus of elasticity of a gas at pressure $P$ is:",
        options: [
            { key: "a", text: "$P$" },
            { key: "b", text: "$\\gamma P$" },
            { key: "c", text: "$\\dfrac{P}{\\gamma}$" },
            { key: "d", text: "$\\dfrac{\\gamma}{P}$" }
        ],
        answer: "a",
        explanation: "For an isothermal change, $K_{\\text{iso}}=P$. For an adiabatic change, $K_{\\text{adi}}=\\gamma P$, where $\\gamma=\\dfrac{C_p}{C_v}$."
    },
    {
        id: "q16", section: "moduli", year: "2074",
        text: "A force of $100\\,$N stretches a wire of length $2\\,$m and cross-section $10^{-6}\\,$m$^2$ by $1\\,$mm. The Young's modulus of the wire is:",
        options: [
            { key: "a", text: "$2\\times10^{9}\\,\\text{N m}^{-2}$" },
            { key: "b", text: "$2\\times10^{11}\\,\\text{N m}^{-2}$" },
            { key: "c", text: "$1\\times10^{11}\\,\\text{N m}^{-2}$" },
            { key: "d", text: "$4\\times10^{11}\\,\\text{N m}^{-2}$" }
        ],
        answer: "b",
        explanation: "$Y=\\dfrac{FL}{Al}=\\dfrac{100\\times2}{10^{-6}\\times10^{-3}}=\\dfrac{200}{10^{-9}}=2\\times10^{11}\\,\\text{N m}^{-2}$."
    },
    {
        id: "q31", section: "moduli", year: "",
        text: "A wire behaves like a spring of force constant $k=\\dfrac{YA}{L}$. It is cut into two equal halves, and the two halves are joined side by side (in parallel) to support a load. The effective force constant of the combination is:",
        options: [
            { key: "a", text: "$\\dfrac{k}{4}$" },
            { key: "b", text: "$k$" },
            { key: "c", text: "$2k$" },
            { key: "d", text: "$4k$" }
        ],
        answer: "d",
        explanation: "Force constant $k\\propto\\dfrac{1}{L}$, so halving the length doubles it: each half has stiffness $2k$. Two springs in parallel add: $2k+2k=4k$."
    },
    {
        id: "q32", section: "moduli", year: "",
        text: "The bulk modulus of water is $2.2\\times10^{9}\\,$N m$^{-2}$. The pressure needed to compress a sample of water by $0.1\\%$ of its volume is:",
        options: [
            { key: "a", text: "$2.2\\times10^{6}\\,\\text{Pa}$" },
            { key: "b", text: "$2.2\\times10^{9}\\,\\text{Pa}$" },
            { key: "c", text: "$2.2\\times10^{12}\\,\\text{Pa}$" },
            { key: "d", text: "$2.2\\times10^{3}\\,\\text{Pa}$" }
        ],
        answer: "a",
        explanation: "$K=\\dfrac{P}{\\Delta V/V}\\Rightarrow P=K\\dfrac{\\Delta V}{V}=2.2\\times10^{9}\\times\\dfrac{0.1}{100}=2.2\\times10^{9}\\times10^{-3}=2.2\\times10^{6}\\,\\text{Pa}$."
    },

    /* ---------------- 6. ELASTIC POTENTIAL ENERGY ---------------- */
    {
        id: "q17", section: "energy", year: "2077",
        text: "In a stretched wire the stress is $2\\times10^{7}\\,$N m$^{-2}$ and the strain is $10^{-3}$. The elastic energy stored per unit volume is:",
        options: [
            { key: "a", text: "$1\\times10^{4}\\,\\text{J m}^{-3}$" },
            { key: "b", text: "$2\\times10^{4}\\,\\text{J m}^{-3}$" },
            { key: "c", text: "$1\\times10^{3}\\,\\text{J m}^{-3}$" },
            { key: "d", text: "$2\\times10^{7}\\,\\text{J m}^{-3}$" }
        ],
        answer: "a",
        explanation: "Energy density $u=\\dfrac{1}{2}\\times\\text{stress}\\times\\text{strain}=\\dfrac{1}{2}\\times2\\times10^{7}\\times10^{-3}=1\\times10^{4}\\,\\text{J m}^{-3}$."
    },
    {
        id: "q18", section: "energy", year: "2079",
        text: "A wire obeying Hooke's law is stretched by an amount $l$ under a load $F$. The work done in stretching it is:",
        options: [
            { key: "a", text: "$Fl$" },
            { key: "b", text: "$\\dfrac{1}{2}Fl$" },
            { key: "c", text: "$2Fl$" },
            { key: "d", text: "$Fl^{2}$" }
        ],
        answer: "b",
        explanation: "The force grows from $0$ to $F$ linearly with extension, so the average force is $\\dfrac{F}{2}$ and the work is $W=\\dfrac{1}{2}Fl=\\dfrac{1}{2}\\times\\text{force}\\times\\text{extension}$."
    },
    {
        id: "q19", section: "energy", year: "2082",
        text: "A wire is stretched by $2\\,$mm under a steadily applied load of $50\\,$N. The elastic potential energy stored in the wire is:",
        options: [
            { key: "a", text: "$0.10\\,$J" },
            { key: "b", text: "$0.05\\,$J" },
            { key: "c", text: "$0.50\\,$J" },
            { key: "d", text: "$0.025\\,$J" }
        ],
        answer: "b",
        explanation: "$U=\\dfrac{1}{2}\\times F\\times l=\\dfrac{1}{2}\\times50\\times(2\\times10^{-3})=0.05\\,$J."
    },

    /* ---------------- 7. POISSON'S RATIO & RELATIONS ---------------- */
    {
        id: "q20", section: "poisson", year: "2078",
        text: "The theoretical limits within which Poisson's ratio must lie are:",
        options: [
            { key: "a", text: "$0$ to $0.5$" },
            { key: "b", text: "$-1$ to $0.5$" },
            { key: "c", text: "$-1$ to $1$" },
            { key: "d", text: "$0$ to $1$" }
        ],
        answer: "b",
        explanation: "Theoretically $-1\\le\\sigma\\le0.5$. In practice, Poisson's ratio of real materials lies between $0$ and $0.5$."
    },
    {
        id: "q21", section: "poisson", year: "2081",
        text: "On stretching a wire, its length increases by $0.2\\%$ while its diameter decreases by $0.06\\%$. Poisson's ratio of the material is:",
        options: [
            { key: "a", text: "$0.1$" },
            { key: "b", text: "$0.2$" },
            { key: "c", text: "$0.3$" },
            { key: "d", text: "$0.6$" }
        ],
        answer: "c",
        explanation: "$\\sigma=\\dfrac{\\text{lateral strain}}{\\text{longitudinal strain}}=\\dfrac{0.06\\%}{0.2\\%}=0.3$."
    },
    {
        id: "q22", section: "poisson", year: "2074",
        text: "The relation between Young's modulus $Y$, modulus of rigidity $\\eta$ and Poisson's ratio $\\sigma$ is:",
        options: [
            { key: "a", text: "$Y=2\\eta(1+\\sigma)$" },
            { key: "b", text: "$Y=3\\eta(1-2\\sigma)$" },
            { key: "c", text: "$Y=\\eta(1+\\sigma)$" },
            { key: "d", text: "$Y=2\\eta(1-\\sigma)$" }
        ],
        answer: "a",
        explanation: "The elastic constants are related by $Y=2\\eta(1+\\sigma)$ and $Y=3K(1-2\\sigma)$, from which $Y=\\dfrac{9K\\eta}{3K+\\eta}$."
    },
    {
        id: "q27", section: "poisson", year: "",
        text: "A wire whose material has Poisson's ratio $\\sigma=0.5$ is stretched so that its length increases by $0.1\\%$. The approximate percentage change in its volume is:",
        options: [
            { key: "a", text: "$0\\%$ (volume nearly unchanged)" },
            { key: "b", text: "$0.1\\%$" },
            { key: "c", text: "$0.2\\%$" },
            { key: "d", text: "$0.3\\%$" }
        ],
        answer: "a",
        explanation: "For a longitudinal stretch, volumetric strain $=\\epsilon(1-2\\sigma)$. With $\\sigma=0.5$, $1-2\\sigma=0$, so the volume stays essentially constant; a material with $\\sigma=0.5$ is incompressible."
    },

    /* ---------------- CHALLENGE ---------------- */
    {
        id: "c1", section: "challenge", year: "",
        text: "Two wires of the same material have their lengths in the ratio $1:2$ and their radii in the ratio $2:1$. When stretched by the same force, the ratio of their extensions $\\Delta l_1:\\Delta l_2$ is:",
        options: [
            { key: "a", text: "$1:2$" },
            { key: "b", text: "$1:4$" },
            { key: "c", text: "$1:8$" },
            { key: "d", text: "$8:1$" }
        ],
        answer: "c",
        explanation: "$\\Delta l=\\dfrac{FL}{AY}=\\dfrac{FL}{\\pi r^2 Y}$, so $\\dfrac{\\Delta l_1}{\\Delta l_2}=\\dfrac{L_1}{L_2}\\cdot\\dfrac{r_2^2}{r_1^2}=\\dfrac{1}{2}\\times\\dfrac{1}{4}=\\dfrac{1}{8}$."
    },
    {
        id: "c2", section: "challenge", year: "",
        text: "A load stretches a wire and stores elastic PE $U$ in it. If the load is doubled while still within the elastic limit, the energy stored becomes:",
        options: [
            { key: "a", text: "$2U$" },
            { key: "b", text: "$\\dfrac{U}{2}$" },
            { key: "c", text: "$4U$" },
            { key: "d", text: "$8U$" }
        ],
        answer: "c",
        explanation: "$U=\\dfrac{1}{2}F\\cdot l$ and the extension $l\\propto F$, so $U\\propto F^2$. Doubling the load makes the stored energy $2^2=4$ times, i.e. $4U$."
    },
    {
        id: "c3", section: "challenge", year: "",
        text: "The length of a wire increases by $1\\%$ on stretching. If Poisson's ratio for the material is $0.3$, the lateral strain (fractional decrease in radius) is:",
        options: [
            { key: "a", text: "$0.3\\%$" },
            { key: "b", text: "$0.6\\%$" },
            { key: "c", text: "$3\\%$" },
            { key: "d", text: "$0.03\\%$" }
        ],
        answer: "a",
        explanation: "Lateral strain $=\\sigma\\times$ longitudinal strain $=0.3\\times1\\%=0.3\\%$ (a decrease in radius)."
    },
    {
        id: "c4", section: "challenge", year: "",
        text: "For a perfectly incompressible material the bulk modulus is infinite. Its Poisson's ratio must then be:",
        options: [
            { key: "a", text: "$0$" },
            { key: "b", text: "$0.25$" },
            { key: "c", text: "$0.5$" },
            { key: "d", text: "$1$" }
        ],
        answer: "c",
        explanation: "$Y=3K(1-2\\sigma)$. For $K\\to\\infty$ with a finite $Y$, we need $1-2\\sigma=0$, giving $\\sigma=0.5$ — the upper practical limit of Poisson's ratio."
    },
    {
        id: "c5", section: "challenge", year: "",
        text: "The breaking stress of a material is independent of its dimensions. If the radius of a wire made from it is doubled, the breaking force becomes:",
        options: [
            { key: "a", text: "Two times" },
            { key: "b", text: "Four times" },
            { key: "c", text: "Unchanged" },
            { key: "d", text: "Eight times" }
        ],
        answer: "b",
        explanation: "Breaking force $=$ breaking stress $\\times A=$ breaking stress $\\times\\pi r^2$. Since breaking stress is fixed, breaking force $\\propto r^2$; doubling $r$ makes it $4$ times."
    },

    /* ---------------- MORE HARD QUESTIONS ---------------- */
    {
        id: "q33", section: "hard", year: "",
        text: "Two wires $A$ and $B$ of the same length and cross-section but of Young's moduli $Y$ and $2Y$ are joined end to end (in series) and stretched by a force $F$. The ratio of the elongation of $A$ to that of $B$ is:",
        options: [
            { key: "a", text: "$1:2$" },
            { key: "b", text: "$2:1$" },
            { key: "c", text: "$1:1$" },
            { key: "d", text: "$4:1$" }
        ],
        answer: "b",
        explanation: "In series the same force $F$ acts on both wires. Elongation $\\Delta l=\\dfrac{FL}{AY}\\propto\\dfrac{1}{Y}$ (same $F,L,A$). So $\\Delta l_A:\\Delta l_B=\\dfrac{1}{Y}:\\dfrac{1}{2Y}=2:1$; the wire with the smaller modulus stretches more."
    },
    {
        id: "q34", section: "hard", year: "",
        text: "A metal rod of Young's modulus $Y$ and linear-expansion coefficient $\\alpha$ is held rigidly between two fixed walls. If its temperature is raised by $\\Delta T$, the compressive (thermal) stress developed in it is:",
        options: [
            { key: "a", text: "$Y\\alpha\\Delta T$" },
            { key: "b", text: "$\\dfrac{\\alpha\\Delta T}{Y}$" },
            { key: "c", text: "$\\dfrac{Y\\Delta T}{\\alpha}$" },
            { key: "d", text: "$Y\\alpha$" }
        ],
        answer: "a",
        explanation: "If free, the rod would expand by a strain $\\alpha\\Delta T$. The rigid walls prevent this, producing an equal compressive strain $\\alpha\\Delta T$. Thermal stress $=Y\\times\\text{strain}=Y\\alpha\\Delta T$, independent of the length and area."
    },
    {
        id: "q35", section: "hard", year: "",
        text: "A rigid horizontal bar hangs from two vertical wires of the same material and length but of cross-sectional areas $A$ and $2A$. As the bar stays horizontal, both wires stretch equally. The ratio of the tension in the thinner wire to that in the thicker wire is:",
        options: [
            { key: "a", text: "$1:2$" },
            { key: "b", text: "$2:1$" },
            { key: "c", text: "$1:1$" },
            { key: "d", text: "$1:4$" }
        ],
        answer: "a",
        explanation: "Equal extension $\\Delta l$ and equal length give tension $T=\\dfrac{YA}{L}\\Delta l\\propto A$. So $T_1:T_2=A:2A=1:2$; the thicker wire carries twice the load."
    },
    {
        id: "q36", section: "hard", year: "",
        text: "A wire made of a material of breaking stress $\\sigma_b$ and density $\\rho$ hangs vertically. The greatest length it can have before snapping under its own weight is:",
        options: [
            { key: "a", text: "$\\dfrac{\\sigma_b}{\\rho g}$" },
            { key: "b", text: "$\\dfrac{\\rho g}{\\sigma_b}$" },
            { key: "c", text: "$\\sigma_b\\rho g$" },
            { key: "d", text: "$\\dfrac{\\sigma_b}{2\\rho g}$" }
        ],
        answer: "a",
        explanation: "The self-weight stress at the top is $\\rho g L$. The wire just breaks when $\\rho g L=\\sigma_b$, giving $L_{\\max}=\\dfrac{\\sigma_b}{\\rho g}$, independent of the cross-section."
    },
    {
        id: "q37", section: "hard", year: "",
        text: "A wire of Young's modulus $Y$, length $L$ and cross-sectional area $A$ is slowly stretched by an amount $l$ within the elastic limit. The work done on the wire is:",
        options: [
            { key: "a", text: "$\\dfrac{YAl^{2}}{2L}$" },
            { key: "b", text: "$\\dfrac{YAl^{2}}{L}$" },
            { key: "c", text: "$\\dfrac{YAl}{2L}$" },
            { key: "d", text: "$\\dfrac{YAl^{2}}{2L^{2}}$" }
        ],
        answer: "a",
        explanation: "The restoring force grows linearly to $F=\\dfrac{YA}{L}l$, so $W=\\dfrac{1}{2}Fl=\\dfrac{1}{2}\\left(\\dfrac{YA}{L}l\\right)l=\\dfrac{YAl^{2}}{2L}$."
    },
    {
        id: "q38", section: "hard", year: "",
        text: "A wire whose material has Poisson's ratio $0.2$ is stretched so that its length increases by $0.3\\%$. The approximate percentage increase in its volume is:",
        options: [
            { key: "a", text: "$0.18\\%$" },
            { key: "b", text: "$0.30\\%$" },
            { key: "c", text: "$0.12\\%$" },
            { key: "d", text: "$0.06\\%$" }
        ],
        answer: "a",
        explanation: "Volumetric strain $=\\epsilon(1-2\\sigma)=0.3\\%\\times(1-2\\times0.2)=0.3\\%\\times0.6=0.18\\%$."
    },
    {
        id: "q39", section: "hard", year: "",
        text: "A uniform wire of length $L$, density $\\rho$ and Young's modulus $Y$ hangs vertically from a support. The extension produced in it by its own weight is:",
        options: [
            { key: "a", text: "$\\dfrac{\\rho g L^{2}}{2Y}$" },
            { key: "b", text: "$\\dfrac{\\rho g L^{2}}{Y}$" },
            { key: "c", text: "$\\dfrac{\\rho g L}{2Y}$" },
            { key: "d", text: "$\\dfrac{2\\rho g L^{2}}{Y}$" }
        ],
        answer: "a",
        explanation: "Each element carries the weight of the wire below it; integrating gives $\\Delta L=\\dfrac{\\rho g L^{2}}{2Y}$. This equals the whole weight acting at the mid-point of the wire."
    },
    {
        id: "q40", section: "hard", year: "",
        text: "The bulk modulus of water is $2\\times10^{9}\\,$N m$^{-2}$. When water is taken to a depth where the excess pressure is $2\\times10^{7}\\,$N m$^{-2}$, the approximate percentage increase in its density is:",
        options: [
            { key: "a", text: "$1\\%$" },
            { key: "b", text: "$0.1\\%$" },
            { key: "c", text: "$10\\%$" },
            { key: "d", text: "$0.01\\%$" }
        ],
        answer: "a",
        explanation: "Volumetric strain $=\\dfrac{P}{K}=\\dfrac{2\\times10^{7}}{2\\times10^{9}}=0.01$. As the mass is fixed, $\\dfrac{\\Delta\\rho}{\\rho}=\\dfrac{\\Delta V}{V}=0.01=1\\%$."
    },
    {
        id: "q41", section: "hard", year: "",
        text: "A cube of side $L$ and modulus of rigidity $\\eta$ has its top face displaced by $x$ relative to the fixed bottom face by a tangential force $F$ applied to the top face. The displacement $x$ is:",
        options: [
            { key: "a", text: "$\\dfrac{F}{L\\eta}$" },
            { key: "b", text: "$\\dfrac{FL}{\\eta}$" },
            { key: "c", text: "$\\dfrac{F}{L^{2}\\eta}$" },
            { key: "d", text: "$\\dfrac{F\\eta}{L}$" }
        ],
        answer: "a",
        explanation: "Shear stress $=\\dfrac{F}{L^{2}}$ and shear strain $=\\dfrac{x}{L}$, so $\\eta=\\dfrac{F/L^{2}}{x/L}=\\dfrac{F}{Lx}$, giving $x=\\dfrac{F}{L\\eta}$."
    },
    {
        id: "q42", section: "hard", year: "",
        text: "A wire of length $2\\,$m and cross-sectional area $1\\,$mm$^2$ (Young's modulus $2\\times10^{11}\\,$N m$^{-2}$) is stretched by $2\\,$mm within its elastic limit. The elastic potential energy stored is:",
        options: [
            { key: "a", text: "$0.2\\,$J" },
            { key: "b", text: "$0.4\\,$J" },
            { key: "c", text: "$0.1\\,$J" },
            { key: "d", text: "$0.8\\,$J" }
        ],
        answer: "a",
        explanation: "Force constant $k=\\dfrac{YA}{L}=\\dfrac{2\\times10^{11}\\times10^{-6}}{2}=10^{5}\\,$N m$^{-1}$. Energy $U=\\dfrac{1}{2}kx^{2}=\\dfrac{1}{2}\\times10^{5}\\times(2\\times10^{-3})^{2}=0.2\\,$J."
    }
];

/* no separate solved examples in this build */
const SOLVED_EXAMPLES = [];
