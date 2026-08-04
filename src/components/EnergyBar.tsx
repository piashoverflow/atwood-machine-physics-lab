import React from 'react';
import { PhysicsParams, SimulationState, DisplayOptions } from '../types';

interface EnergyBarProps {
  params: PhysicsParams;
  state: SimulationState;
  display?: DisplayOptions;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({ params, state, display }) => {
  const isLight = display?.theme === 'light';
  const { m1, m2, gravity } = params;
  const { y1, y2, v } = state;

  const keTrans = 0.5 * (m1 + m2) * v * v;
  const keRot = params.mPulley > 0 ? 0.25 * params.mPulley * v * v : 0;
  const pe1 = m1 * gravity * Math.max(0, 5.0 - y1);
  const pe2 = m2 * gravity * Math.max(0, 5.0 - y2);
  const total = keTrans + keRot + pe1 + pe2;

  const pctKE = total > 0 ? ((keTrans + keRot) / total) * 100 : 0;
  const pctPE1 = total > 0 ? (pe1 / total) * 100 : 50;
  const pctPE2 = total > 0 ? (pe2 / total) * 100 : 50;

  return (
    <div className={`absolute top-4 right-4 border rounded-xl p-3 shadow-xl z-20 backdrop-blur-md w-60 text-xs font-mono select-none transition-colors duration-200 ${
      isLight ? 'bg-white/95 border-[#CBD5E1] text-[#0F172A]' : 'bg-[#1A1E27]/95 border-[#2A303A] text-[#F1F5F9]'
    }`}>
      <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold">
        <span className={isLight ? 'text-[#0284C7]' : 'text-[#00F2FE]'}>ENERGY CONSERVATION</span>
        <span className={isLight ? 'text-[#059669]' : 'text-[#00FF8C]'}>{total.toFixed(1)} J</span>
      </div>

      <div className={`h-3 w-full rounded overflow-hidden flex border ${isLight ? 'bg-[#F1F5F9] border-[#CBD5E1]' : 'bg-[#0D1117] border-[#2A303A]'}`}>
        <div
          className="bg-[#10B981] h-full transition-all duration-75"
          style={{ width: `${pctKE}%` }}
          title={`Kinetic Energy: ${(keTrans + keRot).toFixed(1)} J`}
        />
        <div
          className="bg-[#0284C7] h-full transition-all duration-75"
          style={{ width: `${pctPE1}%` }}
          title={`PE Mass 1: ${pe1.toFixed(1)} J`}
        />
        <div
          className="bg-[#E11D48] h-full transition-all duration-75"
          style={{ width: `${pctPE2}%` }}
          title={`PE Mass 2: ${pe2.toFixed(1)} J`}
        />
      </div>

      <div className={`flex justify-between items-center text-[9px] mt-1.5 font-bold ${isLight ? 'text-[#64748B]' : 'text-[#A9B2BC]'}`}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-[#10B981]"></span> KE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-[#0284C7]"></span> PE₁
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-[#E11D48]"></span> PE₂
        </span>
      </div>
    </div>
  );
};
