/* ============================================================
   Circular Motion — Question bank (10 questions)
   Exam tags limited to 2078, 2079, 2081 (B.S.), randomly assigned.
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
        id: "q6", section: "banked", year: "2079",
        text: "A road of radius $50\\,$m is banked at the correct angle for a given speed. If the speed is doubled keeping the same banking angle, the radius should be changed to:",
        options: [
            { key: "a", text: "$25\\,$m" },
            { key: "b", text: "$100\\,$m" },
            { key: "c", text: "$150\\,$m" },
            { key: "d", text: "$200\\,$m" }
        ],
        answer: "d",
        explanation: "$\\tan\\theta=\\dfrac{v^2}{rg}$. For a constant banking angle, $r\\propto v^2$, so $r_2=4\\times50=200\\,$m."
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
    }
];

/* no separate solved examples in this build */
const SOLVED_EXAMPLES = [];
