import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import { PhysicsParams, SimulationState, DisplayOptions } from '../types';

interface EquationPanelProps {
  params: PhysicsParams;
  state: SimulationState;
  display?: DisplayOptions;
}

export const EquationPanel: React.FC<EquationPanelProps> = ({ params, state, display }) => {
  const fbdRef = useRef<HTMLDivElement>(null);
  const accelRef = useRef<HTMLDivElement>(null);
  const tensionRef = useRef<HTMLDivElement>(null);

  const isLight = display?.theme === 'light';
  const { m1, m2, m3, mPulley, inclineAngle, inclineAngle2, gravity } = params;
  const mu1 = params.surfaceFriction1 ?? params.surfaceFriction ?? 0;
  const mu2 = params.surfaceFriction2 ?? params.surfaceFriction ?? 0;
  const mode = state.mode;

  useEffect(() => {
    // Helper to render KaTeX strings safely into container
    const renderMathLines = (container: HTMLDivElement | null, lines: string[]) => {
      if (!container) return;
      container.innerHTML = '';
      lines.forEach((line) => {
        const item = document.createElement('div');
        item.style.marginBottom = '3px';
        try {
          katex.render(line, item, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (e) {
          console.error(e);
        }
        container.appendChild(item);
      });
    };

    // --- BLOCK 1: EQUATIONS OF MOTION (FBD) ---
    const fbdLines: string[] = [];
    if (mode === 'double_incline') {
      // Left Mass (m1)
      let m1FBD = '';
      if (inclineAngle === 90) {
        m1FBD = 'm_1 a = T_1 - m_1 g';
      } else if (inclineAngle === 0) {
        m1FBD = mu1 > 0 ? 'm_1 a = T_1 - f_{k1}' : 'm_1 a = T_1';
      } else {
        m1FBD = mu1 > 0 ? 'm_1 a = T_1 - m_1 g \\sin\\theta_1 - f_{k1}' : 'm_1 a = T_1 - m_1 g \\sin\\theta_1';
      }
      fbdLines.push(`\\text{Mass 1 } (m_1): \\quad ${m1FBD}`);

      // Right Mass (m2)
      let m2FBD = '';
      if (inclineAngle2 === 90) {
        m2FBD = 'm_2 a = m_2 g - T_2';
      } else if (inclineAngle2 === 0) {
        m2FBD = mu2 > 0 ? 'm_2 a = m_2 g \\sin\\theta_2 - T_2 - f_{k2}' : 'm_2 a = m_2 g \\sin\\theta_2 - T_2';
      } else {
        m2FBD = mu2 > 0 ? 'm_2 a = m_2 g \\sin\\theta_2 - T_2 - f_{k2}' : 'm_2 a = m_2 g \\sin\\theta_2 - T_2';
      }
      fbdLines.push(`\\text{Mass 2 } (m_2): \\quad ${m2FBD}`);
    } else if (mode === 'standard') {
      fbdLines.push('\\text{Mass 1 } (m_1): \\quad m_1 a = T_1 - m_1 g');
      fbdLines.push('\\text{Mass 2 } (m_2): \\quad m_2 a = m_2 g - T_2');
    } else if (mode === 'table_2pulley') {
      fbdLines.push('\\text{Mass 1 } (m_1): \\quad m_1 a = m_1 g - T_1');
      fbdLines.push(`\\text{Table Mass } (m_2): \\quad m_2 a = T_1 - T_2 ${mu1 > 0 ? '- f_k' : ''}`);
      fbdLines.push('\\text{Mass 3 } (m_3): \\quad m_3 a = m_3 g - T_2');
    } else if (mode === 'double_atwood') {
      fbdLines.push('\\text{Upper System } (m_3): \\quad m_3 a_A = m_3 g - T_3');
      fbdLines.push('\\text{Lower Pulley } (m_1, m_2): \\quad m_1 a = T_1 - m_1 g, \\quad m_2 a = m_2 g - T_2');
    } else if (mode === 'inclined') {
      const mu = params.surfaceFriction ?? 0;
      fbdLines.push(`\\text{Ramp Mass } (m_1): \\quad m_1 a = m_1 g \\sin\\theta - T_1 ${mu > 0 ? '- f_k' : ''}`);
      fbdLines.push('\\text{Hanging Mass } (m_2): \\quad m_2 a = T_2 - m_2 g');
    } else {
      fbdLines.push('\\text{Effort Mass } (m_2): \\quad T_{\\text{effort}} = \\frac{m_2 g}{\\text{MA}}');
    }
    renderMathLines(fbdRef.current, fbdLines);

    // --- BLOCK 2: ACCELERATION DERIVATION & VALUE ---
    const accelLines: string[] = [];
    if (mode === 'double_incline') {
      let numTerms: string[] = [];

      // Right Mass drive term
      if (inclineAngle2 === 90) {
        numTerms.push('m_2 g');
      } else if (inclineAngle2 > 0) {
        numTerms.push('m_2 g \\sin\\theta_2');
      }

      // Left Mass drive term
      if (inclineAngle === 90) {
        numTerms.push('- m_1 g');
      } else if (inclineAngle > 0) {
        numTerms.push('- m_1 g \\sin\\theta_1');
      }

      // Friction terms
      if (mu1 > 0) {
        if (inclineAngle === 0) numTerms.push('- \\mu_1 m_1 g');
        else if (inclineAngle < 90) numTerms.push('- \\mu_1 m_1 g \\cos\\theta_1');
      }
      if (mu2 > 0) {
        if (inclineAngle2 === 0) numTerms.push('- \\mu_2 m_2 g');
        else if (inclineAngle2 < 90) numTerms.push('- \\mu_2 m_2 g \\cos\\theta_2');
      }

      const numStr = numTerms.length > 0 ? numTerms.join(' ') : '0';
      const denStr = `m_1 + m_2${mPulley > 0 ? ' + \\frac{1}{2}M_p' : ''}`;
      accelLines.push(`a = \\frac{${numStr}}{${denStr}} = \\mathbf{${state.a.toFixed(2)}\\text{ m/s}^2}`);
    } else if (mode === 'standard') {
      const denStr = `m_1 + m_2${mPulley > 0 ? ' + \\frac{1}{2}M_p' : ''}`;
      accelLines.push(`a = \\frac{(m_2 - m_1)g}{${denStr}} = \\mathbf{${state.a.toFixed(2)}\\text{ m/s}^2}`);
    } else if (mode === 'table_2pulley') {
      const fricTerm = mu1 > 0 ? '- \\mu m_2' : '';
      const denStr = `m_1 + m_2 + m_3${mPulley > 0 ? ' + M_p' : ''}`;
      accelLines.push(`a = \\frac{(m_3 - m_1 ${fricTerm})g}{${denStr}} = \\mathbf{${state.a.toFixed(2)}\\text{ m/s}^2}`);
    } else if (mode === 'double_atwood') {
      const denStr = `\\frac{4 m_1 m_2}{m_1+m_2} + m_3${mPulley > 0 ? ' + M_p' : ''}`;
      accelLines.push(`a_A = \\frac{\\left(\\frac{4 m_1 m_2}{m_1+m_2} - m_3\\right)g}{${denStr}} = \\mathbf{${state.a.toFixed(2)}\\text{ m/s}^2}`);
    } else if (mode === 'inclined') {
      const mu = params.surfaceFriction ?? 0;
      const fricTerm = mu > 0 ? '- \\mu m_1 \\cos\\theta' : '';
      const denStr = `m_1 + m_2${mPulley > 0 ? ' + \\frac{1}{2}M_p' : ''}`;
      accelLines.push(`a = \\frac{(m_1 \\sin\\theta - m_2 ${fricTerm})g}{${denStr}} = \\mathbf{${state.a.toFixed(2)}\\text{ m/s}^2}`);
    } else {
      const ma = state.mechanicalAdvantage;
      accelLines.push(`a = \\frac{m_1 g - \\frac{m_2 g}{${ma}}}{m_1 + \\frac{m_2}{${ma}^2}${mPulley > 0 ? ' + \\frac{1}{2}M_p' : ''}} = \\mathbf{${state.a.toFixed(2)}\\text{ m/s}^2}`);
    }
    renderMathLines(accelRef.current, accelLines);

    // --- BLOCK 3: STRING TENSION LAWS & SOLVED VALUES ---
    const tensionLines: string[] = [];
    if (mode === 'double_incline') {
      if (mPulley === 0) {
        if (inclineAngle === 90 && inclineAngle2 === 90 && mu1 === 0 && mu2 === 0) {
          tensionLines.push(`T_1 = T_2 = T = \\frac{2 m_1 m_2}{m_1 + m_2} g = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
        } else {
          // General single-string equal tension formula
          let t1Symbol = 'm_1 g';
          if (inclineAngle === 90) {
            t1Symbol = 'm_1 (g + a)';
          } else if (inclineAngle === 0) {
            t1Symbol = mu1 > 0 ? 'm_1 a + \\mu_1 m_1 g' : 'm_1 a';
          } else {
            t1Symbol = mu1 > 0 ? 'm_1 g (\\sin\\theta_1 + \\mu_1\\cos\\theta_1) + m_1 a' : 'm_1 g \\sin\\theta_1 + m_1 a';
          }
          tensionLines.push(`T_1 = T_2 = T = ${t1Symbol} = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
        }
      } else {
        // Different tensions across massive pulley
        let t1Symbol = '';
        if (inclineAngle === 90) {
          t1Symbol = 'm_1 (g + a)';
        } else if (inclineAngle === 0) {
          t1Symbol = mu1 > 0 ? 'm_1 a + \\mu_1 m_1 g' : 'm_1 a';
        } else {
          t1Symbol = mu1 > 0 ? 'm_1 g (\\sin\\theta_1 + \\mu_1\\cos\\theta_1) + m_1 a' : 'm_1 g \\sin\\theta_1 + m_1 a';
        }

        let t2Symbol = '';
        if (inclineAngle2 === 90) {
          t2Symbol = 'm_2 (g - a)';
        } else if (inclineAngle2 === 0) {
          t2Symbol = mu2 > 0 ? 'm_2 a + \\mu_2 m_2 g' : 'm_2 a';
        } else {
          t2Symbol = mu2 > 0 ? 'm_2 g (\\sin\\theta_2 - \\mu_2\\cos\\theta_2) - m_2 a' : 'm_2 g \\sin\\theta_2 - m_2 a';
        }

        tensionLines.push(`T_1 = ${t1Symbol} = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
        tensionLines.push(`T_2 = ${t2Symbol} = \\mathbf{${state.t2.toFixed(1)}\\text{ N}}`);
      }
    } else if (mode === 'standard') {
      if (mPulley === 0) {
        tensionLines.push(`T_1 = T_2 = T = \\frac{2 m_1 m_2}{m_1 + m_2} g = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
      } else {
        tensionLines.push(`T_1 = \\frac{2 m_1 m_2 + m_1 M_p}{m_1 + m_2 + \\frac{1}{2}M_p} g = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
        tensionLines.push(`T_2 = \\frac{2 m_1 m_2 + m_2 M_p}{m_1 + m_2 + \\frac{1}{2}M_p} g = \\mathbf{${state.t2.toFixed(1)}\\text{ N}}`);
      }
    } else if (mode === 'table_2pulley') {
      tensionLines.push(`T_1 = m_1(g - a) = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
      tensionLines.push(`T_2 = m_3(g - a) = \\mathbf{${state.t2.toFixed(1)}\\text{ N}}`);
    } else if (mode === 'double_atwood') {
      tensionLines.push(`T_1 = T_2 = \\frac{2 m_1 m_2}{m_1 + m_2}(g - a_A) = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
      tensionLines.push(`T_3 = 2 T_1 = \\mathbf{${state.t3.toFixed(1)}\\text{ N}}`);
    } else if (mode === 'inclined') {
      const mu = params.surfaceFriction ?? 0;
      if (mPulley === 0) {
        tensionLines.push(`T_1 = T_2 = T = m_2(g - a) = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
      } else {
        tensionLines.push(`T_1 = m_1 g (\\sin\\theta + \\mu\\cos\\theta) + m_1 a = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
        tensionLines.push(`T_2 = m_2(g - a) = \\mathbf{${state.t2.toFixed(1)}\\text{ N}}`);
      }
    } else {
      tensionLines.push(`T_{\\text{effort}} = \\frac{m_2 g}{\\text{MA}} = \\mathbf{${state.t1.toFixed(1)}\\text{ N}}`);
    }
    renderMathLines(tensionRef.current, tensionLines);

  }, [m1, m2, m3, mPulley, inclineAngle, inclineAngle2, gravity, mu1, mu2, mode, state.a, state.t1, state.t2, state.t3, state.mechanicalAdvantage]);

  return (
    <div className={`floating-eq-panel ${isLight ? 'eq-panel-light' : 'eq-panel-dark'} absolute top-4 right-4 sm:right-6 border rounded-xl p-4 sm:p-5 min-h-[280px] shadow-xl z-20 backdrop-blur-md w-[440px] sm:w-[460px] max-w-[calc(100vw-2rem)] font-mono text-xs transition-colors duration-200 ${
      isLight ? 'bg-white/95 border-[#CBD5E1] text-[#0F172A]' : 'bg-[#1A1E27]/90 border-[#2A303A] text-[#F1F5F9]'
    }`}>
      {/* HEADER */}
      <div className={`flex items-center justify-between mb-2.5 pb-1.5 border-b ${isLight ? 'border-[#E2E8F0]' : 'border-[#2A303A]'}`}>
        <span className={`text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${isLight ? 'text-[#0284C7]' : 'text-[#00F2FE]'}`}>
          <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-[#0284C7]' : 'bg-[#00F2FE]'}`}></span>
          ACTIVE EQUATIONS
        </span>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${
          isLight ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#475569]' : 'bg-[#0B0E14] border-[#2A303A] text-[#4A5568]'
        }`}>
          MA: {state.mechanicalAdvantage}:1
        </span>
      </div>

      <div className="space-y-3">
        {/* BLOCK 1: EQUATIONS OF MOTION (FBD) */}
        <div>
          <div className={`text-[9.5px] uppercase tracking-wider font-extrabold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            1. Equations of Motion (FBD):
          </div>
          <div ref={fbdRef} className={`overflow-x-auto scrollbar-none text-[0.82rem] font-medium leading-relaxed ${isLight ? 'text-slate-800' : 'text-slate-200'}`}></div>
        </div>

        {/* BLOCK 2: ACCELERATION DERIVATION */}
        <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className={`text-[9.5px] uppercase tracking-wider font-extrabold mb-1 ${isLight ? 'text-[#0284C7]' : 'text-[#00F2FE]'}`}>
            2. Acceleration (a):
          </div>
          <div ref={accelRef} className={`overflow-x-auto scrollbar-none text-[0.82rem] leading-relaxed font-bold ${isLight ? 'text-[#0284C7]' : 'text-[#00F2FE]'}`}></div>
        </div>

        {/* BLOCK 3: STRING TENSION LAWS & SOLVED VALUES */}
        <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className={`text-[9.5px] uppercase tracking-wider font-extrabold mb-1 ${isLight ? 'text-[#059669]' : 'text-[#10B981]'}`}>
            3. String Tension Laws:
          </div>
          <div ref={tensionRef} className={`overflow-x-auto scrollbar-none text-[0.82rem] font-semibold leading-relaxed ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}></div>
        </div>
      </div>
    </div>
  );
};
