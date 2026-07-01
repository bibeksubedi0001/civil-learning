/* ============================================================
   Circular Motion — Question bank (14 past + 4 challenge = 18).
   Past-paper tags: 2074, 2077, 2078, 2079, 2081 (B.S.).
   Challenge questions are higher-order (no exam tag).
   ============================================================ */

const QUESTIONS = [
    {
        id: "q1", section: "uniform", year: "2079",
        text: "A body is moving with uniform velocity in a circular path. Then the centripetal acceleration is:",
        options: [
            { key: "a", text: "Zero" },
            { key: "b", text: "Directed towards the centre" },
            { key: "c", text: "Along the tangent" },
            { key: "d", text: "Along the axis ⊥ to plane" }
        ],
        answer: "b",
        explanation: "In uniform circular motion the centripetal acceleration always points radially inward (towards the centre): $a_c=\\dfrac{v^2}{r}$."
    },
    {
        id: "q2", section: "uniform", year: "2078",
        text: "A body describes circular motion with constant speed $v$ along a path of radius $r$. Its tangential acceleration will be:",
        options: [
            { key: "a", text: "$\\dfrac{v^2}{2\\pi r}$" },
            { key: "b", text: "$\\dfrac{v^2}{\\pi r}$" },
            { key: "c", text: "$\\dfrac{v^2}{r}$" },
            { key: "d", text: "Zero" }
        ],
        answer: "d",
        explanation: "Speed is constant, so the tangential acceleration $a_t=\\dfrac{dv}{dt}=0$. Only the radial (centripetal) acceleration $\\dfrac{v^2}{r}$ is present."
    },
    {
        id: "q3", section: "uniform", year: "2081",
        text: "A particle moves along a circular path of radius $R$ with frequency $n$ and period $T$. Its centripetal acceleration can be expressed as:",
        options: [
            { key: "a", text: "$4\\pi^2 R^2 n$" },
            { key: "b", text: "$4\\pi^2 R T$" },
            { key: "c", text: "$4\\pi^2 R n^2$" },
            { key: "d", text: "$4\\pi^2 R^2 T^2$" }
        ],
        answer: "c",
        explanation: "Speed $v=2\\pi R n$, so $a_c=\\dfrac{v^2}{R}=\\dfrac{(2\\pi R n)^2}{R}=4\\pi^2 R n^2$."
    },
    {
        id: "q4", section: "cyclist", year: "2078",
        text: "A cyclist moves with velocity $10\\,$m/s on a curve of radius $20\\,$m. The angle of inclination of the cycle is:",
        options: [
            { key: "a", text: "$26.5^\\circ$" },
            { key: "b", text: "$35.5^\\circ$" },
            { key: "c", text: "$60^\\circ$" },
            { key: "d", text: "$40^\\circ$" }
        ],
        answer: "a",
        explanation: "$\\tan\\theta=\\dfrac{v^2}{rg}=\\dfrac{10^2}{20\\times10}=\\dfrac12\\Rightarrow\\theta=26.5^\\circ$."
    },
    {
        id: "q5", section: "cyclist", year: "2081",
        text: "A cyclist turns around a curve at $20\\,$km/hr. If he turns at double this speed, the tendency to overturn is:",
        options: [
            { key: "a", text: "Doubled" },
            { key: "b", text: "Quadrupled" },
            { key: "c", text: "Halved" },
            { key: "d", text: "Unchanged" }
        ],
        answer: "b",
        explanation: "$\\tan\\theta=\\dfrac{v^2}{rg}$, so the overturning tendency $\\propto v^2$. Doubling the speed makes it $4\\times$."
    },
    {
        id: "q7", section: "vertical", year: "2081",
        text: "In a \"death well\", a motorcyclist races on a circular path of radius $r$. The minimum velocity at the lowest point is:",
        options: [
            { key: "a", text: "$\\sqrt{rg}$" },
            { key: "b", text: "$\\sqrt{5rg}$" },
            { key: "c", text: "$\\sqrt{7rg}$" },
            { key: "d", text: "$\\sqrt{3rg}$" }
        ],
        answer: "b",
        explanation: "At the lowest point, to complete the circle $T=6mg$, giving $\\dfrac{mv^2}{r}=5mg\\Rightarrow v_{min}=\\sqrt{5rg}$."
    },
    {
        id: "q8", section: "vertical", year: "2078",
        text: "A body of mass $m$ moves in a vertical circle with speed $V$. The tension on the mass at the bottom of the circle is:",
        options: [
            { key: "a", text: "$mg-\\dfrac{mV^2}{r}$" },
            { key: "b", text: "$mg+\\dfrac{mV^2}{r}$" },
            { key: "c", text: "$mg\\times \\dfrac{mV^2}{r}$" },
            { key: "d", text: "$mg\\,/\\,\\dfrac{mV^2}{r}$" }
        ],
        answer: "b",
        explanation: "At the lowest point, $T-mg=\\dfrac{mV^2}{r}\\Rightarrow T=mg+\\dfrac{mV^2}{r}$ (maximum tension)."
    },
    {
        id: "q9", section: "vertical", year: "2079",
        text: "A can of water is revolved in a vertical circle of radius $4\\,$m so that water does not spill. The maximum period of revolution is:",
        options: [
            { key: "a", text: "$2\\,$s" },
            { key: "b", text: "$3\\,$s" },
            { key: "c", text: "$4\\,$s" },
            { key: "d", text: "$5\\,$s" }
        ],
        answer: "c",
        explanation: "Slowest safe speed is at the top: $mg=\\dfrac{mv^2}{r}\\Rightarrow v=\\sqrt{gr}=\\sqrt{40}\\approx6.3\\,$m/s, so $T=\\dfrac{2\\pi r}{v}=\\dfrac{2\\pi\\times4}{6.3}\\approx4\\,$s."
    },
    {
        id: "q10", section: "force", year: "2081",
        text: "A stone of mass $m$ tied to a string of length $l$ is rotated at constant speed $v$. If the string is released, the stone flies:",
        options: [
            { key: "a", text: "Radially inward" },
            { key: "b", text: "Radially outward" },
            { key: "c", text: "Tangentially outward" },
            { key: "d", text: "With acceleration $mv^2/l$" }
        ],
        answer: "c",
        explanation: "When the string is cut the centripetal force vanishes and the stone flies off along the tangent (Newton's first law)."
    },
    {
        id: "q11", section: "vertical", year: "2079",
        text: "A body of mass $2\\,$kg is whirled in a vertical circle of radius $1.6\\,$m. The minimum speed at the highest point to just maintain the circular motion is: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$4\\,$m/s" },
            { key: "b", text: "$8\\,$m/s" },
            { key: "c", text: "$16\\,$m/s" },
            { key: "d", text: "$2\\,$m/s" }
        ],
        answer: "a",
        explanation: "At the top, gravity alone supplies the centripetal force at minimum speed: $mg=\\dfrac{mv^2}{r}\\Rightarrow v=\\sqrt{gr}=\\sqrt{10\\times1.6}=\\sqrt{16}=4\\,$m/s. (The mass cancels out.)"
    },
    {
        id: "q12", section: "vertical", year: "2081",
        text: "A body of mass $0.5\\,$kg tied to a string is revolved in a vertical circle of radius $1\\,$m. If its speed at the lowest point is $5\\,$m/s, the tension in the string there is: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$12.5\\,$N" },
            { key: "b", text: "$5\\,$N" },
            { key: "c", text: "$17.5\\,$N" },
            { key: "d", text: "$22.5\\,$N" }
        ],
        answer: "c",
        explanation: "At the lowest point $T-mg=\\dfrac{mv^2}{r}\\Rightarrow T=mg+\\dfrac{mv^2}{r}=0.5(10)+\\dfrac{0.5(5)^2}{1}=5+12.5=17.5\\,$N."
    },
    {
        id: "q13", section: "pendulum", year: "2074",
        text: "A conical pendulum of string length $1\\,$m has its string making $60^\\circ$ with the vertical. The time period of revolution is: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$1.4\\,$s" },
            { key: "b", text: "$2.0\\,$s" },
            { key: "c", text: "$0.7\\,$s" },
            { key: "d", text: "$2.8\\,$s" }
        ],
        answer: "a",
        explanation: "$t=2\\pi\\sqrt{\\dfrac{l\\cos\\theta}{g}}=2\\pi\\sqrt{\\dfrac{1\\times\\cos60^\\circ}{10}}=2\\pi\\sqrt{\\dfrac{0.5}{10}}=2\\pi\\sqrt{0.05}\\approx1.4\\,$s."
    },
    {
        id: "q14", section: "pendulum", year: "2077",
        text: "The bob of a conical pendulum has mass $0.2\\,$kg and the string makes $60^\\circ$ with the vertical. The tension in the string is: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$2\\,$N" },
            { key: "b", text: "$4\\,$N" },
            { key: "c", text: "$1\\,$N" },
            { key: "d", text: "$8\\,$N" }
        ],
        answer: "b",
        explanation: "Vertical balance gives $T\\cos\\theta=mg\\Rightarrow T=\\dfrac{mg}{\\cos\\theta}=\\dfrac{0.2\\times10}{\\cos60^\\circ}=\\dfrac{2}{0.5}=4\\,$N."
    },
    {
        id: "q15", section: "pendulum", year: "2081",
        text: "A conical pendulum of length $0.5\\,$m revolves with its string at $53^\\circ$ to the vertical. The radius of the horizontal circle traced by the bob is: $(\\sin53^\\circ\\approx0.8)$",
        options: [
            { key: "a", text: "$0.3\\,$m" },
            { key: "b", text: "$0.4\\,$m" },
            { key: "c", text: "$0.5\\,$m" },
            { key: "d", text: "$0.25\\,$m" }
        ],
        answer: "b",
        explanation: "The bob lies a horizontal distance $r=l\\sin\\theta$ from the axis: $r=0.5\\times\\sin53^\\circ=0.5\\times0.8=0.4\\,$m."
    },
    {
        id: "c1", section: "challenge", year: "",
        text: "A stone is whirled in a vertical circle of radius $r$ at the minimum speed needed to just complete the loop. When the string is momentarily horizontal (level with the centre), the tension in it is:",
        options: [
            { key: "a", text: "$2mg$" },
            { key: "b", text: "$3mg$" },
            { key: "c", text: "$5mg$" },
            { key: "d", text: "$6mg$" }
        ],
        answer: "b",
        explanation: "Minimum top speed gives $v_t^2=gr$. Energy conservation down to the side (a height $r$ lower): $v_s^2=gr+2gr=3gr$. There the string is horizontal, so it alone supplies the centripetal force (gravity is tangential): $T=\\dfrac{mv_s^2}{r}=\\dfrac{m(3gr)}{r}=3mg$."
    },
    {
        id: "c3", section: "challenge", year: "",
        text: "A particle moves in a circle of radius $r$ with constant speed $v$. The magnitude of the change in its centripetal acceleration as it travels through one quarter of the circle is:",
        options: [
            { key: "a", text: "$\\dfrac{v^2}{r}$" },
            { key: "b", text: "$\\sqrt{2}\\,\\dfrac{v^2}{r}$" },
            { key: "c", text: "$\\dfrac{2v^2}{r}$" },
            { key: "d", text: "Zero" }
        ],
        answer: "b",
        explanation: "The centripetal acceleration keeps magnitude $a=\\dfrac{v^2}{r}$ but its direction turns through $90^\\circ$. $|\\Delta\\vec a|=2a\\sin45^\\circ=2\\cdot\\dfrac{v^2}{r}\\cdot\\dfrac{1}{\\sqrt2}=\\sqrt2\\,\\dfrac{v^2}{r}$."
    },
    {
        id: "c4", section: "challenge", year: "",
        text: "A stone tied to a string is projected from the lowest point of a vertical circle of radius $r$ with speed $\\sqrt{3gr}$. The string goes slack at a height above the lowest point equal to:",
        options: [
            { key: "a", text: "$\\dfrac{2r}{3}$" },
            { key: "b", text: "$r$" },
            { key: "c", text: "$\\dfrac{4r}{3}$" },
            { key: "d", text: "$\\dfrac{5r}{3}$" }
        ],
        answer: "c",
        explanation: "At angle $\\theta$ from the bottom, energy gives $v^2=gr(1+2\\cos\\theta)$ and the radial equation gives $T=\\dfrac{mv^2}{r}+mg\\cos\\theta$. Setting $T=0$ yields $\\cos\\theta=-\\dfrac13$, so the height $=r(1-\\cos\\theta)=r\\left(1+\\dfrac13\\right)=\\dfrac{4r}{3}$."
    },
    {
        id: "c5", section: "challenge", year: "",
        text: "In a rotor (a cylindrical drum of radius $2\\,$m), a person stands against the inner wall and the floor is then removed. If the coefficient of friction between the person and the wall is $0.2$, the minimum angular speed that prevents the person from sliding down is: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$2.5\\,$rad/s" },
            { key: "b", text: "$5\\,$rad/s" },
            { key: "c", text: "$\\sqrt{50}\\,$rad/s" },
            { key: "d", text: "$10\\,$rad/s" }
        ],
        answer: "b",
        explanation: "The wall's normal reaction provides the centripetal force $N=m\\omega^2 R$, and friction $\\mu N$ must support the weight: $\\mu m\\omega^2 R\\ge mg\\Rightarrow\\omega_{min}=\\sqrt{\\dfrac{g}{\\mu R}}=\\sqrt{\\dfrac{10}{0.2\\times2}}=\\sqrt{25}=5\\,$rad/s."
    }
];

/* no separate solved examples in this build */
const SOLVED_EXAMPLES = [];
