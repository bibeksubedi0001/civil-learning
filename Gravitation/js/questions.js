/* ============================================================
   Gravitation — IOE exam question bank (22 past questions)
   Exam: IOE (Institute of Engineering) · Years 2076–2082
   Sections: gravlaw, field, variation, potential, kepler,
             satellite, escape, gps
   ============================================================ */

const QUESTIONS = [
    {
        id: "q1", section: "gravlaw", year: "2076", exam: "IOE 2076",
        text: "If the distance between two bodies is doubled, the gravitational force between them becomes:",
        options: [
            { key: "a", text: "Doubled" },
            { key: "b", text: "Halved" },
            { key: "c", text: "One-fourth" },
            { key: "d", text: "Four times" }
        ],
        answer: "c",
        explanation: "$F\\propto\\dfrac{1}{r^2}$, so doubling $r$ makes the force $\\dfrac{1}{2^2}=\\dfrac14$ of the original."
    },
    {
        id: "q2", section: "gravlaw", year: "2077", exam: "IOE 2077",
        text: "The dimensional formula of the universal gravitational constant $G$ is:",
        options: [
            { key: "a", text: "$[M^{-1}L^{3}T^{-2}]$" },
            { key: "b", text: "$[ML^{3}T^{-2}]$" },
            { key: "c", text: "$[M^{-1}L^{2}T^{-2}]$" },
            { key: "d", text: "$[M^{-1}L^{3}T^{-1}]$" }
        ],
        answer: "a",
        explanation: "From $F=\\dfrac{Gm_1m_2}{r^2}$, $G=\\dfrac{Fr^2}{m_1m_2}=\\dfrac{[MLT^{-2}][L^2]}{[M^2]}=[M^{-1}L^{3}T^{-2}]$."
    },
    {
        id: "q3", section: "gravlaw", year: "2078", exam: "IOE 2078",
        text: "Two particles attract each other with a force $F$ at a separation $r$. If one mass is doubled and the separation halved, the new force is:",
        options: [
            { key: "a", text: "$2F$" },
            { key: "b", text: "$4F$" },
            { key: "c", text: "$8F$" },
            { key: "d", text: "$16F$" }
        ],
        answer: "c",
        explanation: "$F'=\\dfrac{G(2m_1)m_2}{(r/2)^2}=\\dfrac{2Gm_1m_2}{r^2/4}=8\\,\\dfrac{Gm_1m_2}{r^2}=8F$."
    },
    {
        id: "q4", section: "field", year: "2079", exam: "IOE 2079",
        text: "A planet has the same density as the Earth but twice its radius. The acceleration due to gravity on its surface is (Earth's value $=g$):",
        options: [
            { key: "a", text: "$g$" },
            { key: "b", text: "$2g$" },
            { key: "c", text: "$4g$" },
            { key: "d", text: "$g/2$" }
        ],
        answer: "b",
        explanation: "$g=\\dfrac{GM}{R^2}=\\dfrac{G\\cdot\\frac{4}{3}\\pi R^3\\rho}{R^2}=\\dfrac{4}{3}\\pi G\\rho R\\propto R$ at fixed density, so twice the radius gives $2g$."
    },
    {
        id: "q5", section: "field", year: "2080", exam: "IOE 2080",
        text: "The acceleration due to gravity at the surface of the Earth is approximately:",
        options: [
            { key: "a", text: "$6.67\\times10^{-11}\\,$m/s$^2$" },
            { key: "b", text: "$9.8\\,$m/s$^2$" },
            { key: "c", text: "$11.2\\,$m/s$^2$" },
            { key: "d", text: "$6.4\\times10^{6}\\,$m/s$^2$" }
        ],
        answer: "b",
        explanation: "At the Earth's surface $g=\\dfrac{GM}{R^2}\\approx9.8\\,$m/s$^2$."
    },
    {
        id: "q6", section: "variation", year: "2081", exam: "IOE 2081",
        text: "At what height above the Earth's surface does the acceleration due to gravity reduce to one-fourth of its surface value? ($R=$ Earth's radius)",
        options: [
            { key: "a", text: "$R/2$" },
            { key: "b", text: "$R$" },
            { key: "c", text: "$2R$" },
            { key: "d", text: "$4R$" }
        ],
        answer: "b",
        explanation: "$g_h=g\\left(\\dfrac{R}{R+h}\\right)^2=\\dfrac{g}{4}\\Rightarrow\\dfrac{R}{R+h}=\\dfrac12\\Rightarrow h=R$."
    },
    {
        id: "q7", section: "variation", year: "2082", exam: "IOE 2082",
        text: "The value of the acceleration due to gravity at the centre of the Earth is:",
        options: [
            { key: "a", text: "$9.8\\,$m/s$^2$" },
            { key: "b", text: "Maximum" },
            { key: "c", text: "Zero" },
            { key: "d", text: "Infinite" }
        ],
        answer: "c",
        explanation: "$g_d=g\\left(1-\\dfrac{d}{R}\\right)$; at the centre $d=R$, so $g=0$."
    },
    {
        id: "q8", section: "variation", year: "2076", exam: "IOE 2076",
        text: "At a depth $d$ below the Earth's surface, the acceleration due to gravity is ($R=$ radius):",
        options: [
            { key: "a", text: "$g\\left(1+\\dfrac{d}{R}\\right)$" },
            { key: "b", text: "$g\\left(1-\\dfrac{d}{R}\\right)$" },
            { key: "c", text: "$g\\left(1-\\dfrac{d}{R}\\right)^2$" },
            { key: "d", text: "$g\\,\\dfrac{R}{d}$" }
        ],
        answer: "b",
        explanation: "Only the mass within radius $(R-d)$ pulls the body, giving $g_d=g\\left(1-\\dfrac{d}{R}\\right)$ — a linear decrease with depth."
    },
    {
        id: "q9", section: "variation", year: "2077", exam: "IOE 2077",
        text: "A body weighs slightly more at the poles than at the equator mainly because:",
        options: [
            { key: "a", text: "of the Earth's rotation and equatorial bulge" },
            { key: "b", text: "of the Moon's gravity" },
            { key: "c", text: "the temperature is higher at the equator" },
            { key: "d", text: "of atmospheric pressure" }
        ],
        answer: "a",
        explanation: "Rotation lowers the effective $g$ at the equator ($g'=g-\\omega^2R\\cos^2\\lambda$) and the equatorial bulge places the surface farther from the centre — so $g$ is largest at the poles."
    },
    {
        id: "q10", section: "potential", year: "2078", exam: "IOE 2078",
        text: "The gravitational potential energy of a mass $m$ at a distance $r$ from a mass $M$ is:",
        options: [
            { key: "a", text: "$\\dfrac{GMm}{r}$" },
            { key: "b", text: "$-\\dfrac{GMm}{r}$" },
            { key: "c", text: "$-\\dfrac{GMm}{r^2}$" },
            { key: "d", text: "$\\dfrac{GMm}{r^2}$" }
        ],
        answer: "b",
        explanation: "Taking the reference (zero) at infinity, $U=-\\dfrac{GMm}{r}$ — negative because the masses are gravitationally bound."
    },
    {
        id: "q11", section: "potential", year: "2079", exam: "IOE 2079",
        text: "The gravitational potential at a distance $r$ from a point mass $M$ is:",
        options: [
            { key: "a", text: "$-\\dfrac{GM}{r}$" },
            { key: "b", text: "$-\\dfrac{GM}{r^2}$" },
            { key: "c", text: "$\\dfrac{GM}{r}$" },
            { key: "d", text: "$-\\dfrac{GMm}{r}$" }
        ],
        answer: "a",
        explanation: "Gravitational potential is potential energy per unit mass: $V=-\\dfrac{GM}{r}$."
    },
    {
        id: "q12", section: "potential", year: "2080", exam: "IOE 2080",
        text: "The work done in taking a body of mass $m$ from the Earth's surface (radius $R$) to infinity is:",
        options: [
            { key: "a", text: "$-\\dfrac{GMm}{R}$" },
            { key: "b", text: "$\\dfrac{GMm}{R}$" },
            { key: "c", text: "Zero" },
            { key: "d", text: "$\\dfrac{GMm}{2R}$" }
        ],
        answer: "b",
        explanation: "$W=U_\\infty-U_R=0-\\left(-\\dfrac{GMm}{R}\\right)=\\dfrac{GMm}{R}=mgR$."
    },
    {
        id: "q13", section: "kepler", year: "2081", exam: "IOE 2081",
        text: "Kepler's second law (equal areas swept in equal times) is a direct consequence of the conservation of:",
        options: [
            { key: "a", text: "Linear momentum" },
            { key: "b", text: "Energy" },
            { key: "c", text: "Angular momentum" },
            { key: "d", text: "Mass" }
        ],
        answer: "c",
        explanation: "The areal velocity $\\dfrac{dA}{dt}=\\dfrac{L}{2m}$ is constant because gravity is a central force, conserving the angular momentum $L$."
    },
    {
        id: "q14", section: "kepler", year: "2082", exam: "IOE 2082",
        text: "According to Kepler's third law, the square of a planet's orbital period is proportional to:",
        options: [
            { key: "a", text: "the mean distance from the Sun" },
            { key: "b", text: "the square of the mean distance" },
            { key: "c", text: "the cube of the mean distance" },
            { key: "d", text: "the square root of the distance" }
        ],
        answer: "c",
        explanation: "$T^2\\propto a^3$, where $a$ is the semi-major axis (mean distance) of the orbit."
    },
    {
        id: "q15", section: "kepler", year: "2076", exam: "IOE 2076",
        text: "A planet moves in an elliptical orbit around the Sun. Its orbital speed is greatest when it is:",
        options: [
            { key: "a", text: "farthest from the Sun (aphelion)" },
            { key: "b", text: "nearest the Sun (perihelion)" },
            { key: "c", text: "the same everywhere" },
            { key: "d", text: "at the ends of the minor axis" }
        ],
        answer: "b",
        explanation: "Conserving angular momentum ($mvr=$ const), the speed is largest where $r$ is smallest — at perihelion."
    },
    {
        id: "q16", section: "kepler", year: "2077", exam: "IOE 2077",
        text: "If the radius of a satellite's circular orbit is increased to four times, its period of revolution becomes:",
        options: [
            { key: "a", text: "$2T$" },
            { key: "b", text: "$4T$" },
            { key: "c", text: "$8T$" },
            { key: "d", text: "$16T$" }
        ],
        answer: "c",
        explanation: "$T^2\\propto r^3\\Rightarrow T\\propto r^{3/2}$, so $T'=(4)^{3/2}\\,T=8T$."
    },
    {
        id: "q17", section: "satellite", year: "2078", exam: "IOE 2078",
        text: "The orbital velocity of a satellite revolving very close to the Earth's surface is about:",
        options: [
            { key: "a", text: "$11.2\\,$km/s" },
            { key: "b", text: "$7.9\\,$km/s" },
            { key: "c", text: "$5.0\\,$km/s" },
            { key: "d", text: "$9.8\\,$km/s" }
        ],
        answer: "b",
        explanation: "$v_o=\\sqrt{gR}=\\sqrt{9.8\\times6.4\\times10^{6}}\\approx7.9\\,$km/s."
    },
    {
        id: "q18", section: "satellite", year: "2079", exam: "IOE 2079",
        text: "The period of revolution of a geostationary satellite is:",
        options: [
            { key: "a", text: "$1\\,$hour" },
            { key: "b", text: "$12\\,$hours" },
            { key: "c", text: "$24\\,$hours" },
            { key: "d", text: "$28\\,$days" }
        ],
        answer: "c",
        explanation: "A geostationary satellite stays above a fixed point on the equator, so its period equals the Earth's rotation period, $\\approx24\\,$hours."
    },
    {
        id: "q19", section: "satellite", year: "2080", exam: "IOE 2080",
        text: "The total mechanical energy of a satellite of mass $m$ in a circular orbit of radius $r$ around the Earth is:",
        options: [
            { key: "a", text: "$-\\dfrac{GMm}{r}$" },
            { key: "b", text: "$-\\dfrac{GMm}{2r}$" },
            { key: "c", text: "$\\dfrac{GMm}{2r}$" },
            { key: "d", text: "$-\\dfrac{GMm}{4r}$" }
        ],
        answer: "b",
        explanation: "$KE=\\dfrac{GMm}{2r}$ and $PE=-\\dfrac{GMm}{r}$, so $E=KE+PE=-\\dfrac{GMm}{2r}$ (negative → bound orbit)."
    },
    {
        id: "q20", section: "escape", year: "2081", exam: "IOE 2081",
        text: "The escape velocity from the surface of the Earth is approximately:",
        options: [
            { key: "a", text: "$7.9\\,$km/s" },
            { key: "b", text: "$9.8\\,$km/s" },
            { key: "c", text: "$11.2\\,$km/s" },
            { key: "d", text: "$22.4\\,$km/s" }
        ],
        answer: "c",
        explanation: "$v_e=\\sqrt{2gR}=\\sqrt{2\\times9.8\\times6.4\\times10^{6}}\\approx11.2\\,$km/s."
    },
    {
        id: "q21", section: "escape", year: "2082", exam: "IOE 2082",
        text: "The escape velocity $v_e$ and the orbital velocity $v_o$ (near the surface) are related by:",
        options: [
            { key: "a", text: "$v_e=v_o$" },
            { key: "b", text: "$v_e=\\sqrt{2}\\,v_o$" },
            { key: "c", text: "$v_e=2v_o$" },
            { key: "d", text: "$v_e=\\dfrac{v_o}{\\sqrt{2}}$" }
        ],
        answer: "b",
        explanation: "$v_e=\\sqrt{2gR}$ and $v_o=\\sqrt{gR}$, so $v_e=\\sqrt{2}\\,v_o\\approx1.414\\,v_o$."
    },
    {
        id: "q22", section: "gps", year: "2076", exam: "IOE 2076",
        text: "A GPS receiver finds its position from the signals of several satellites essentially by the method of:",
        options: [
            { key: "a", text: "trilateration (ranging from known satellite positions)" },
            { key: "b", text: "Doppler radar" },
            { key: "c", text: "sonar echo" },
            { key: "d", text: "infrared imaging" }
        ],
        answer: "a",
        explanation: "Each satellite signal gives the receiver's distance from a known position; intersecting these ranges (trilateration) from at least four satellites fixes the 3-D position and the clock error."
    }
];

/* no separate solved examples in this build */
const SOLVED_EXAMPLES = [];
