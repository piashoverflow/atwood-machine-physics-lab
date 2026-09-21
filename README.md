# Universal Pulley Dynamics Lab | Interactive Atwood Machine Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg?logo=vite)](https://vitejs.dev/)
[![Author: Shamsuddin Piash](https://img.shields.io/badge/Author-Shamsuddin%20Piash-0ea5e9.svg)](https://piashoverflow.github.io)
[![BUET ME](https://img.shields.io/badge/Institution-BUET%20'25-10b981.svg)](https://buet.ac.bd)

> **Interactive Computational Physics Simulator & Educational Workbench**  
> Developed by **Shamsuddin Piash** | Department of Mechanical Engineering, Bangladesh University of Engineering and Technology (BUET).

---

## 🔬 Overview & Conceptual Motivation

High-fidelity interactive Atwood Machine & Universal Pulley Dynamics Lab with RK4 ODE numerical integration, real-time force vectors, and active state probe.

Designed from **first-principles physics and numerical mechanics**, this simulation bridges textbook analytical theory and real-time computation. It enables students, researchers, and competitive engineering candidates to visualize dynamic force interactions, observe parametric trends, and verify conservation laws interactively.

---

## 📐 Mathematical Formulation & Physics Derivations

### Governing Dynamic Equations

The system models coupled masses $m_1$ and $m_2$ suspended over a real pulley with moment of inertia $I$, radius $R$, and axle viscous friction coefficient $\mu$:

$$\sum F = (m_2 - m_1)g - f_{friction} = (m_1 + m_2 + \frac{I}{R^2}) a$$

Solving for linear acceleration $a$:

$$a = \frac{(m_2 - m_1)g - \mu(m_1 + m_2)g}{m_1 + m_2 + \frac{I}{R^2}}$$

String tensions at each segment:

$$T_1 = m_1(g + a), \quad T_2 = m_2(g - a)$$

Numerical time integration is evaluated via continuous **4th-order Runge-Kutta (RK4)** integration to guarantee numerical stability across stiff mass ratios.

---

## ✨ Key Features & Interactive Workbench

- **Real-time RK4 Differential Equation Solver**: Step-by-step numerical ODE solver with energy conservation verification.
- **Dynamic Force Vectors (HUD Canvas)**: Visualizes tension $T_1$, $T_2$, gravitational pull $m_1 g$, $m_2 g$, and instantaneous acceleration arrows.
- **Interactive Parametric Sweeps**: Real-time sliders for masses $m_1, m_2$, pulley inertia $I$, axle friction $\mu$, and gravitational constant $g$.
- **Kinematics Telemetry Charts**: Real-time plots for position $y(t)$, velocity $v(t)$, and kinetic vs potential energy.

---

## 🔒 Confidentiality, Security & Academic Integrity

This repository adheres strictly to professional security standards, privacy guidelines, and academic integrity policies:

- **Proprietary & Institutional Protection**: Underlying academic curricula, institutional questions, and confidential research data are sanitized and protected under institutional agreements.
- **Environment & Secrets Hygiene**: No private keys, passwords, or personal credentials are hardcoded. API tokens (e.g., Gemini AI or cloud compute) must be supplied via local `.env` files or secure CI/CD secrets.
- **Vulnerability Reporting**: Please refer to [SECURITY.md](SECURITY.md) for instructions on confidential disclosure.

---

## 🛠️ Project Structure & Architecture

```
.
├── src/
│   ├── components/       # UI panels, canvas renderer, sliders & controls
│   ├── utils/            # Physics solvers, RK4 ODE integration, vector math
│   ├── types.ts          # Strongly typed simulation interfaces
│   ├── App.tsx           # Primary application workbench
│   └── main.tsx          # Application root
├── public/               # Static assets & icons
├── metadata.json         # Simulator metadata & capabilities
├── package.json          # Dependencies & build scripts
├── tsconfig.json         # TypeScript compiler configuration
├── vite.config.ts        # Vite bundle & dev server configuration
├── SECURITY.md           # Confidentiality & vulnerability disclosure policy
└── LICENSE               # MIT License
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **bun** / **pnpm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/piashoverflow/atwood-machine-physics-lab.git
cd atwood-machine-physics-lab

# 2. Install dependencies
npm install

# 3. Configure environment variables (if applicable)
cp .env.example .env

# 4. Launch the local development server
npm run dev
```

Visit `http://localhost:3000` in your browser to interact with the simulation.

### Production Build

```bash
npm run build
npm run preview
```

---

## 👤 Author & Academic Affiliation

**Shamsuddin Piash**  
*B.Sc. in Mechanical Engineering (Graduated March 2025)*  
**Bangladesh University of Engineering and Technology (BUET)**  
Dhaka, Bangladesh

- **Portfolio Website**: [piashoverflow.github.io](https://piashoverflow.github.io)
- **GitHub**: [@piashoverflow](https://github.com/piashoverflow)
- **LinkedIn**: [linkedin.com/in/shamsuddin-piash](https://linkedin.com/in/shamsuddin-piash)
- **Email**: [mohammadshamsuddinpiash0722@gmail.com](mailto:mohammadshamsuddinpiash0722@gmail.com)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.
