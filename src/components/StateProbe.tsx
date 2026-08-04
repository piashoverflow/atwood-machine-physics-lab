import React from 'react';
import { SimulationState, PhysicsParams, DisplayOptions } from '../types';

interface StateProbeProps {
  state: SimulationState;
  params: PhysicsParams;
  display?: DisplayOptions;
}

export const StateProbe: React.FC<StateProbeProps> = ({ state, params, display }) => {
  const isLight = display?.theme === 'light';
  const { y1, y2, y3, v, a, t1, t2, t3, time, status, mode } = state;
  const { m1, m2, m3, gravity } = params;

  const isThreeMass = mode === 'double_atwood' || mode === 'table_2pulley';

  // Kinetic & Potential Energy
  const ke1 = 0.5 * m1 * v * v;
  const ke2 = 0.5 * m2 * v * v;
  const ke3 = isThreeMass ? 0.5 * (m3 || 0) * v * v : 0;
  const totalKE = ke1 + ke2 + ke3;

  const pe1 = m1 * gravity * Math.max(0, 5.0 - y1);
  const pe2 = m2 * gravity * Math.max(0, 5.0 - y2);
  const pe3 = isThreeMass ? (m3 || 0) * gravity * Math.max(0, 5.0 - y3) : 0;
  const totalPE = pe1 + pe2 + pe3;

  return (
    <div className={`absolute bottom-4 right-4 border rounded-xl p-3.5 shadow-xl z-20 backdrop-blur-xl w-64 font-mono text-xs transition-colors duration-200 ${
      isLight ? 'bg-white/95 border-[#CBD5E1] text-[#0F172A]' : 'bg-[#0F172A]/90 border-[#334155] text-[#F1F5F9]'
    }`}>
      <div className={`flex items-center justify-between mb-2 pb-1.5 border-b ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]'}`}>
        <span className={`text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>
          <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-[#059669]' : 'bg-[#22C55E]'}`}></span>
          STATE PROBE
        </span>
        <span
          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
            status === 'SIMULATING'
              ? isLight ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#7DD3FC]' : 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/50'
              : status === 'PAUSED'
              ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
              : status === 'BOUND_LIMIT'
              ? 'bg-red-500/20 text-red-600 border border-red-500/40'
              : isLight ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#1E293B] text-[#94A3B8]'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Coord Y1 (m1)</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{y1.toFixed(3)} m</span>
        </div>

        <div className="flex justify-between items-center">
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Coord Y2 (m2)</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{y2.toFixed(3)} m</span>
        </div>

        {isThreeMass && (
          <div className="flex justify-between items-center">
            <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Coord Y3 (m3)</span>
            <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{y3.toFixed(3)} m</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Velocity (V)</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{v.toFixed(3)} m/s</span>
        </div>

        <div className="flex justify-between items-center">
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Acceleration (A)</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{a.toFixed(3)} m/s²</span>
        </div>

        <div className="flex justify-between items-center">
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Tension T1</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{t1.toFixed(3)} N</span>
        </div>

        <div className="flex justify-between items-center">
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Tension T2</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{t2.toFixed(3)} N</span>
        </div>

        {isThreeMass && (
          <div className="flex justify-between items-center">
            <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Tension T3</span>
            <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{t3.toFixed(3)} N</span>
          </div>
        )}

        <div className={`flex justify-between items-center pt-1 border-t ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]'}`}>
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Total KE</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#0284C7]' : 'text-[#38BDF8]'}`}>{totalKE.toFixed(2)} J</span>
        </div>

        <div className="flex justify-between items-center">
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Total PE</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#0284C7]' : 'text-[#38BDF8]'}`}>{totalPE.toFixed(2)} J</span>
        </div>

        <div className={`flex justify-between items-center pt-1 border-t ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]'}`}>
          <span className={`uppercase text-[10px] tracking-wider font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Elapsed Time</span>
          <span className={`text-right font-bold ${isLight ? 'text-[#059669]' : 'text-[#22C55E]'}`}>{time.toFixed(3)} s</span>
        </div>
      </div>
    </div>
  );
};
