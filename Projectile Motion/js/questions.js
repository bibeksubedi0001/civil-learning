/* ============================================================
   Projectile Motion — IOE exam question bank (20 past questions)
   Exam: IOE (Institute of Engineering) · Years 2076–2082
   Sections: horizontal, angular, maxheight, energy, airres, incline
   ============================================================ */

const QUESTIONS = [
    {
        id: "q1", section: "airres", year: "2076", exam: "IOE 2076",
        text: "When air resistance is taken into account while dealing with the motion of a projectile, the quantity that shows an increase is:",
        options: [
            { key: "a", text: "Range" },
            { key: "b", text: "Maximum height" },
            { key: "c", text: "Speed at which it strikes the ground" },
            { key: "d", text: "Angle at which it strikes the ground" }
        ],
        answer: "d",
        explanation: "Air drag reduces the range, maximum height and striking speed, but the descent becomes steeper — so the angle at which the projectile hits the ground actually increases."
    },
    {
        id: "q2", section: "angular", year: "2077", exam: "IOE 2077",
        text: "A body is thrown with a velocity of $50\\,$m/s. The maximum horizontal distance it can cover is: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$200\\,$m" },
            { key: "b", text: "$250\\,$m" },
            { key: "c", text: "$300\\,$m" },
            { key: "d", text: "$400\\,$m" }
        ],
        answer: "b",
        explanation: "Maximum range occurs at $45^\\circ$: $R_{max}=\\dfrac{u^2}{g}=\\dfrac{50^2}{10}=250\\,$m."
    },
    {
        id: "q3", section: "angular", year: "2078", exam: "IOE 2078",
        text: "Two projectiles are thrown at the same angle; the velocity of A is twice that of B. Their ranges are related as:",
        options: [
            { key: "a", text: "$R_A=2R_B$" },
            { key: "b", text: "$R_A=4R_B$" },
            { key: "c", text: "$R_B=2R_A$" },
            { key: "d", text: "$R_B=4R_A$" }
        ],
        answer: "b",
        explanation: "At a fixed angle $R\\propto u^2$. Since $u_A=2u_B$, we get $R_A=(2)^2R_B=4R_B$."
    },
    {
        id: "q4", section: "maxheight", year: "2079", exam: "IOE 2079",
        text: "A body is projected at $45^\\circ$ with a velocity of $200\\,$m/s. The maximum height attained is: $(g=10\\,$m/s$^2)$",
        options: [
            { key: "a", text: "$200\\,$m" },
            { key: "b", text: "$400\\,$m" },
            { key: "c", text: "$800\\,$m" },
            { key: "d", text: "$1000\\,$m" }
        ],
        answer: "d",
        explanation: "$H=\\dfrac{u^2\\sin^2\\theta}{2g}=\\dfrac{200^2\\times\\sin^2 45^\\circ}{2\\times10}=\\dfrac{40000\\times0.5}{20}=1000\\,$m."
    },
    {
        id: "q5", section: "energy", year: "2080", exam: "IOE 2080",
        text: "A body projected at $60^\\circ$ reaches the same height at two instants $a$ and $b$. Neglecting air resistance, the ratio of its mechanical energies at those two points is:",
        options: [
            { key: "a", text: "More than one" },
            { key: "b", text: "Less than one" },
            { key: "c", text: "Equal to one" },
            { key: "d", text: "Depends on velocity direction" }
        ],
        answer: "c",
        explanation: "Mechanical energy is conserved throughout the flight, so it is identical at every point of the path — the ratio is exactly $1$."
    },
    {
        id: "q6", section: "maxheight", year: "2081", exam: "IOE 2081",
        text: "A fielder can throw a cricket ball to a maximum horizontal distance of $100\\,$m. How high can he throw the same ball?",
        options: [
            { key: "a", text: "$25\\,$m" },
            { key: "b", text: "$50\\,$m" },
            { key: "c", text: "$100\\,$m" },
            { key: "d", text: "$40\\,$m" }
        ],
        answer: "b",
        explanation: "$R_{max}=\\dfrac{u^2}{g}=100\\,$m. Thrown straight up, the height is $\\dfrac{u^2}{2g}=\\dfrac{100}{2}=50\\,$m."
    },
    {
        id: "q7", section: "energy", year: "2082", exam: "IOE 2082",
        text: "A projectile is thrown at angle $\\theta$ with the vertical with initial kinetic energy $E_0$. Neglecting air resistance, its kinetic energy at the highest point is:",
        options: [
            { key: "a", text: "$E_0\\cos^2\\theta$" },
            { key: "b", text: "$E_0\\cos\\theta$" },
            { key: "c", text: "$E_0\\sin^2\\theta$" },
            { key: "d", text: "Zero" }
        ],
        answer: "c",
        explanation: "Measured from the vertical, the angle with the horizontal is $(90^\\circ-\\theta)$, so the surviving horizontal speed is $u\\sin\\theta$. Hence $KE=\\tfrac12 m(u\\sin\\theta)^2=E_0\\sin^2\\theta$."
    },
    {
        id: "q8", section: "angular", year: "2076", exam: "IOE 2076",
        text: "A projectile's time of flight $T$ and horizontal range $R$ satisfy $gT^2=2R$. The angle of projection is:",
        options: [
            { key: "a", text: "$45^\\circ$" },
            { key: "b", text: "$30^\\circ$" },
            { key: "c", text: "$60^\\circ$" },
            { key: "d", text: "$90^\\circ$" }
        ],
        answer: "a",
        explanation: "$gT^2=g\\left(\\dfrac{2u\\sin\\theta}{g}\\right)^2=\\dfrac{4u^2\\sin^2\\theta}{g}$ and $2R=\\dfrac{2u^2\\sin2\\theta}{g}$. Equating gives $\\sin\\theta=\\cos\\theta\\Rightarrow\\theta=45^\\circ$."
    },
    {
        id: "q9", section: "horizontal", year: "2077", exam: "IOE 2077",
        text: "A ball is thrown horizontally from the top of a tower. The horizontal component of its velocity will:",
        options: [
            { key: "a", text: "Increase" },
            { key: "b", text: "Decrease" },
            { key: "c", text: "Remain unchanged" },
            { key: "d", text: "First increase, then decrease" }
        ],
        answer: "c",
        explanation: "Gravity acts only vertically, so there is no horizontal acceleration — the horizontal velocity component stays constant throughout the flight."
    },
    {
        id: "q10", section: "horizontal", year: "2078", exam: "IOE 2078",
        text: "Two bullets A and B are fired horizontally at the same instant from the same height with speeds $v_A$ and $v_B$ $(v_B>v_A)$. Which reaches the ground first?",
        options: [
            { key: "a", text: "A" },
            { key: "b", text: "B" },
            { key: "c", text: "Both at the same time" },
            { key: "d", text: "Depends on their masses" }
        ],
        answer: "c",
        explanation: "Vertical fall obeys $H=\\tfrac12 gt^2$, independent of horizontal speed. Both bullets drop the same height, so they land together."
    },
    {
        id: "q11", section: "energy", year: "2079", exam: "IOE 2079",
        text: "A cricket ball is struck with kinetic energy $K$ at $45^\\circ$ to the horizontal. Its kinetic energy at the highest point is:",
        options: [
            { key: "a", text: "$0$" },
            { key: "b", text: "$K/2$" },
            { key: "c", text: "$K$" },
            { key: "d", text: "$2K$" }
        ],
        answer: "b",
        explanation: "At the top only the horizontal speed $u\\cos\\theta$ survives: $KE=K\\cos^2 45^\\circ=K\\times\\tfrac12=\\dfrac{K}{2}$."
    },
    {
        id: "q12", section: "angular", year: "2080", exam: "IOE 2080",
        text: "$R$ is the range of a projectile for an angle of projection of $15^\\circ$. For the same speed, an equal range is obtained at an angle of:",
        options: [
            { key: "a", text: "$60^\\circ$" },
            { key: "b", text: "$75^\\circ$" },
            { key: "c", text: "$45^\\circ$" },
            { key: "d", text: "$30^\\circ$" }
        ],
        answer: "b",
        explanation: "Complementary angles give the same range. The partner of $15^\\circ$ is $90^\\circ-15^\\circ=75^\\circ$."
    },
    {
        id: "q13", section: "angular", year: "2081", exam: "IOE 2081",
        text: "A projectile is fired at equal inclination to the horizontal and vertical lines (i.e. $45^\\circ$) with speed $u$. The horizontal distance it travels is:",
        options: [
            { key: "a", text: "$\\dfrac{u^2}{g}$" },
            { key: "b", text: "$\\dfrac{u^2}{2g}$" },
            { key: "c", text: "$\\dfrac{u^2\\sin\\theta}{g}$" },
            { key: "d", text: "None of these" }
        ],
        answer: "a",
        explanation: "Equal inclination means $\\theta=45^\\circ$, so $R=\\dfrac{u^2\\sin2\\theta}{g}=\\dfrac{u^2\\sin90^\\circ}{g}=\\dfrac{u^2}{g}$."
    },
    {
        id: "q14", section: "angular", year: "2082", exam: "IOE 2082",
        text: "Two projectiles A and B are thrown at the same angle with $u_B=2u_A$. The relation between their ranges is:",
        options: [
            { key: "a", text: "$R_A=R_B$" },
            { key: "b", text: "$2R_A=R_B$" },
            { key: "c", text: "$R_B=4R_A$" },
            { key: "d", text: "$2R_B=R_A$" }
        ],
        answer: "c",
        explanation: "$R\\propto u^2$ at a fixed angle, so $R_B=(2)^2R_A=4R_A$."
    },
    {
        id: "q15", section: "energy", year: "2076", exam: "IOE 2076",
        text: "If both the mass and the velocity of a body in projectile motion are doubled, its linear momentum becomes:",
        options: [
            { key: "a", text: "$2$ times" },
            { key: "b", text: "$4$ times" },
            { key: "c", text: "$\\tfrac12$ times" },
            { key: "d", text: "Unchanged" }
        ],
        answer: "b",
        explanation: "$p=mv$. Doubling each gives $p'=(2m)(2v)=4mv$ — four times the original momentum."
    },
    {
        id: "q16", section: "horizontal", year: "2077", exam: "IOE 2077",
        text: "Ball A is dropped vertically and ball B is thrown horizontally from the same height at the same instant. Then:",
        options: [
            { key: "a", text: "A reaches the ground first" },
            { key: "b", text: "B reaches the ground first" },
            { key: "c", text: "Both reach at the same time" },
            { key: "d", text: "A reaches, then B" }
        ],
        answer: "c",
        explanation: "Both share the same vertical motion $H=\\tfrac12 gt^2$ with zero initial vertical velocity, so they strike the ground simultaneously."
    },
    {
        id: "q17", section: "maxheight", year: "2078", exam: "IOE 2078",
        text: "The greatest height to which a man can throw a stone is $h$. The greatest horizontal distance to which he can throw it is:",
        options: [
            { key: "a", text: "$h/2$" },
            { key: "b", text: "$h$" },
            { key: "c", text: "$2h$" },
            { key: "d", text: "$4h$" }
        ],
        answer: "c",
        explanation: "Greatest height $=\\dfrac{u^2}{2g}=h\\Rightarrow\\dfrac{u^2}{g}=2h$. Greatest range $=\\dfrac{u^2}{g}=2h$."
    },
    {
        id: "q18", section: "angular", year: "2079", exam: "IOE 2079",
        text: "If the maximum range of a projectile is four times its maximum height, the angle of projection is:",
        options: [
            { key: "a", text: "$30^\\circ$" },
            { key: "b", text: "$45^\\circ$" },
            { key: "c", text: "$60^\\circ$" },
            { key: "d", text: "$75^\\circ$" }
        ],
        answer: "b",
        explanation: "$\\dfrac{R}{H}=\\dfrac{u^2\\sin2\\theta/g}{u^2\\sin^2\\theta/2g}=4\\cot\\theta=4\\Rightarrow\\cot\\theta=1\\Rightarrow\\theta=45^\\circ$."
    },
    {
        id: "q19", section: "incline", year: "2080", exam: "IOE 2080",
        text: "A plane flies at $300\\,$m/s directly above an observer at a height of $2\\,$km. At what angle to the vertical must he fire a bullet at $600\\,$m/s to hit the plane?",
        options: [
            { key: "a", text: "$30^\\circ$" },
            { key: "b", text: "$45^\\circ$" },
            { key: "c", text: "$60^\\circ$" },
            { key: "d", text: "$90^\\circ$" }
        ],
        answer: "a",
        explanation: "The bullet's horizontal component must match the plane's speed: $600\\sin\\phi=300\\Rightarrow\\sin\\phi=\\tfrac12\\Rightarrow\\phi=30^\\circ$ from the vertical."
    },
    {
        id: "q21", section: "angular", year: "2082", exam: "IOE 2082",
        text: "The range of a projectile fired at $15^\\circ$ is $50\\,$m. Fired with the same speed at $45^\\circ$, the range becomes:",
        options: [
            { key: "a", text: "$100\\,$m" },
            { key: "b", text: "$15\\,$m" },
            { key: "c", text: "$50\\,$m" },
            { key: "d", text: "$37\\,$m" }
        ],
        answer: "a",
        explanation: "$R_{15}=\\dfrac{u^2\\sin30^\\circ}{g}=\\dfrac{u^2}{2g}=50\\Rightarrow\\dfrac{u^2}{g}=100$. At $45^\\circ$, $R=\\dfrac{u^2\\sin90^\\circ}{g}=\\dfrac{u^2}{g}=100\\,$m."
    }
];

/* no separate solved examples in this build */
const SOLVED_EXAMPLES = [];
