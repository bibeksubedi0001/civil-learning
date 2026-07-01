/* ============================================================
   Elasticity — Question bank (22 past + 5 challenge = 27).
   Past-paper tags: 2074, 2077, 2078, 2079, 2081, 2082 (B.S.).
   Challenge questions are higher-order (no exam tag).
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
            { key: "b", text: "Putty" },
            { key: "c", text: "Phosphor bronze" },
            { key: "d", text: "Steel" }
        ],
        answer: "b",
        explanation: "Plastic bodies do not regain their original configuration once the deforming force is removed. Putty, mud and paraffin wax are nearly perfect plastic bodies, while quartz and phosphor bronze are nearly perfect elastic bodies."
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
        id: "q11", section: "hooke", year: "2077",
        text: "Within the elastic limit, a stress of $2\\times10^{8}\\,$N m$^{-2}$ produces a strain of $10^{-3}$ in a wire. The modulus of elasticity of its material is:",
        options: [
            { key: "a", text: "$2\\times10^{5}\\,\\text{N m}^{-2}$" },
            { key: "b", text: "$2\\times10^{8}\\,\\text{N m}^{-2}$" },
            { key: "c", text: "$2\\times10^{11}\\,\\text{N m}^{-2}$" },
            { key: "d", text: "$2\\times10^{14}\\,\\text{N m}^{-2}$" }
        ],
        answer: "c",
        explanation: "By Hooke's law $E=\\dfrac{\\text{stress}}{\\text{strain}}=\\dfrac{2\\times10^{8}}{10^{-3}}=2\\times10^{11}\\,\\text{N m}^{-2}$."
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
        id: "q12", section: "moduli", year: "2078",
        text: "A wire of length $L$ and cross-sectional area $A$ is stretched by $l$ under a force $F$. Its Young's modulus is:",
        options: [
            { key: "a", text: "$\\dfrac{FL}{Al}$" },
            { key: "b", text: "$\\dfrac{FA}{Ll}$" },
            { key: "c", text: "$\\dfrac{Fl}{AL}$" },
            { key: "d", text: "$\\dfrac{FLl}{A}$" }
        ],
        answer: "a",
        explanation: "$Y=\\dfrac{\\text{normal stress}}{\\text{longitudinal strain}}=\\dfrac{F/A}{l/L}=\\dfrac{FL}{Al}$."
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
    }
];

/* no separate solved examples in this build */
const SOLVED_EXAMPLES = [];
