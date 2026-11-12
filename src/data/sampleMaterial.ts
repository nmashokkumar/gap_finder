/**
 * Preloaded Sample EdTech Dataset: Class 11/12 Physics (Mechanics & Gravitation)
 * Designed for judges and evaluators to test GapFinder AI end-to-end with 1 click.
 */

export const SAMPLE_SYLLABUS = `
SUBJECT: Physics (Mechanics & Gravitation)
GRADE: Senior Secondary / College Prep

MODULE 1: LAWS OF MOTION
1.1 Newton's First Law and Inertia: Concept of inertia of rest, motion, and direction. Definition of force and momentum.
1.2 Newton's Second Law: Mathematical statement F = dp/dt and F = ma. Impulse and impulse-momentum theorem. Unit of force (Newton).
1.3 Newton's Third Law: Action-reaction pair principle. Conservation of linear momentum. Equilibrium of concurrent forces.

MODULE 2: WORK, ENERGY AND POWER
2.1 Work and Kinetic Energy: Work done by constant and variable force. Kinetic energy expression (1/2 mv^2).
2.2 Work-Energy Theorem: Statement, proof for variable force, relation between work and change in kinetic energy.
2.3 Potential Energy and Conservation: Conservative vs non-conservative forces. Gravitational potential energy (mgh). Conservation of mechanical energy.

MODULE 3: GRAVITATION
3.1 Universal Law of Gravitation: Statement, formula F = G(m1*m2)/r^2, gravitational constant G. Vector form.
3.2 Acceleration due to Gravity (g): Relation g = GM/R^2. Variation of g with altitude (height) and depth.
3.3 Orbital Velocity and Escape Speed: Orbital velocity of a satellite v_o = sqrt(GM/r). Escape speed v_e = sqrt(2gR).

MODULE 4: CIRCULAR MOTION
4.1 Centripetal Acceleration and Force: Kinematics of uniform circular motion. Centripetal acceleration a_c = v^2/r = omega^2 * r.
4.2 Applications: Motion of car on level road, banking of circular roads to prevent skidding.
`.trim();

export const SAMPLE_NOTES = `
=== CHAPTER 1: LAWS OF MOTION ===

[Chapter 1: Laws of Motion · Section 1.1 · Page 12]
Newton's First Law states that every body continues in its state of rest or of uniform motion in a straight line unless compelled to change that state by an external unbalanced force. This tendency of objects to resist changes in their state of motion is called Inertia. Inertia is directly proportional to mass. A heavier object has greater inertia than a lighter object.

[Chapter 1: Laws of Motion · Section 1.2 · Page 15]
Newton's Second Law states that the rate of change of momentum of an object is directly proportional to the applied force and takes place in the direction in which the force acts. Mathematically, F = dp/dt. When mass is constant, F = m * a, where F is net force in Newtons (N), m is mass in kilograms (kg), and a is acceleration in m/s^2. Impulse is defined as the product of force and the time interval during which it acts (J = F * Delta t), which equals the change in momentum (Impulse-Momentum Theorem).

[Chapter 1: Laws of Motion · Section 1.3 · Page 18]
Newton's Third Law states that to every action there is always an equal and opposite reaction. Important rule: Action and reaction forces act on different bodies simultaneously; therefore, they never cancel each other out. From this law, the Principle of Conservation of Linear Momentum is derived: in an isolated system with no external net force, the total vector momentum before interaction equals total vector momentum after interaction (m1*u1 + m2*u2 = m1*v1 + m2*v2).

=== CHAPTER 2: WORK, ENERGY AND POWER ===

[Chapter 2: Work and Energy · Section 2.1 · Page 28]
Work is done when a force produces displacement in the direction of the force: W = F * d * cos(theta), where theta is the angle between force and displacement vectors. If theta = 90 degrees, work done is zero (e.g., centripetal force doing zero work on an orbiting satellite). Kinetic Energy (K) is the energy possessed by an object due to its motion: K = 0.5 * m * v^2. Kinetic energy is a scalar quantity and is always positive.

[Chapter 2: Work and Energy · Section 2.2 · Page 32]
The Work-Energy Theorem states that the net work done by all forces (conservative, non-conservative, and external) acting on a particle equals the change in its kinetic energy: W_net = Delta K = K_final - K_initial. This theorem is valid for both constant and variable forces.

[Chapter 2: Work and Energy · Section 2.3 · Page 35]
A force is conservative if the work done by it on a particle depends only on initial and final positions, not on the path taken (e.g., gravity, spring force). Gravitational potential energy near Earth's surface is U = mgh. Total mechanical energy E = K + U remains constant in an isolated system under conservative forces (Delta E = 0).

=== CHAPTER 3: GRAVITATION ===

[Chapter 3: Gravitation · Section 3.1 · Page 45]
Newton's Universal Law of Gravitation states that every point mass attracts every other point mass with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between them: F = G * (m1 * m2) / r^2. The universal gravitational constant G has an experimental value of 6.674 * 10^-11 N*m^2/kg^2.

[Chapter 3: Gravitation · Section 3.2 · Page 48]
Acceleration due to gravity on Earth's surface is g = G * M / R^2, approximately 9.8 m/s^2. At height h above the surface, acceleration due to gravity decreases: g_h = g * (1 - 2h/R) for h << R. At depth d below the surface, gravity decreases linearly: g_d = g * (1 - d/R). Notice that at Earth's center (d = R), g becomes exactly zero.

[Chapter 3: Gravitation · Section 3.3 · Page 52]
Escape speed is the minimum speed required for an object to escape Earth's gravitational pull: v_e = sqrt(2 * g * R), which is approximately 11.2 km/s on Earth. The orbital speed of a satellite orbiting at distance r from the center of Earth is v_o = sqrt(G * M / r) = sqrt(g * R) when close to Earth, which is approximately 7.9 km/s. Therefore, v_e = sqrt(2) * v_o.

=== CHAPTER 4: CIRCULAR MOTION ===

[Chapter 4: Circular Motion · Section 4.1 · Page 60]
In uniform circular motion, speed is constant but direction changes continuously, producing an acceleration directed toward the center called Centripetal Acceleration: a_c = v^2 / r = omega^2 * r, where omega is angular velocity. The net inward force producing this acceleration is Centripetal Force: F_c = m * v^2 / r.

[Chapter 4: Circular Motion · Section 4.2 · Page 64]
On a curved horizontal level road, friction provides the necessary centripetal force: maximum safe speed is v_max = sqrt(mu * g * r), where mu is coefficient of static friction. On banked roads inclined at an angle theta, the normal force provides centripetal force without relying on friction, giving optimal speed v = sqrt(r * g * tan(theta)).
`.trim();

export const SAMPLE_PAST_PAPERS = `
PAST BOARD & ENTRANCE EXAMINATION QUESTIONS (2022 - 2025)

Question 1 (2024 Exam · 3 Marks):
Explain why a cricket player lowers his hands backward while catching a fast-moving cricket ball. State the law and formula involved.

Question 2 (2024 Exam · 5 Marks):
State Newton's Second Law of Motion. Derive the formula F = ma from the rate of change of momentum. A force of 20 N acts on a mass of 5 kg for 3 seconds. Find the impulse and velocity acquired from rest.

Question 3 (2023 Exam · 4 Marks):
State and prove the Work-Energy Theorem for a variable force in one dimension. Show that work done is equal to the change in kinetic energy.

Question 4 (2023 Exam · 3 Marks):
Derive the expression for the acceleration due to gravity at a depth 'd' below the surface of Earth. At what depth does gravity become half of its value at the surface?

Question 5 (2025 Exam · 5 Marks):
What is escape speed? Derive an expression for the escape speed of a body projected from the surface of Earth and show that v_e = sqrt(2) * v_o.

Question 6 (2022 Exam · 2 Marks):
Why does a passenger sitting in a moving bus lurch forward when the driver applies brakes suddenly? Name the property of matter involved.

Question 7 (2025 Exam · 4 Marks):
A car of mass 1000 kg rounds a circular curve of radius 50 m on a banked road inclined at 15 degrees. Derive the formula for optimum banking velocity without depending on friction.

Question 8 (2024 Exam · 3 Marks):
Distinguish between conservative and non-conservative forces with two examples of each. Show that work done in a closed path by a conservative force is zero.
`.trim();
