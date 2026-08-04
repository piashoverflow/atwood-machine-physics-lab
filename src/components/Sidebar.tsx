import React from 'react';
import { Settings, Eye, Sliders, RefreshCw, Play, Pause, Download, Sun, Moon, Layers } from 'lucide-react';
import { PhysicsParams, SimulationState, DisplayOptions, SimulationMode } from '../types';

interface SidebarProps {
  params: PhysicsParams;
  state: SimulationState;
  display: DisplayOptions;
  onChangeParams: (updated: Partial<PhysicsParams>) => void;
  onChangeState: (updated: Partial<SimulationState>) => void;
  onChangeDisplay: (updated: Partial<DisplayOptions>) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onExportCSV: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  params,
  state,
  display,
  onChangeParams,
  onChangeState,
  onChangeDisplay,
  onTogglePlay,
  onReset,
  onExportCSV,
}) => {
  const isLight = display.theme === 'light';

  const modes: { id: SimulationMode; label: string; ma: string }[] = [
    { id: 'double_incline', label: 'Universal Dual-Ramp', ma: '2-Ramp' },
    { id: 'standard', label: 'Ideal Atwood', ma: '1:1' },
    { id: 'table_2pulley', label: 'Table 2-Pulley', ma: '3-Mass' },
    { id: 'double_atwood', label: '★ Double Atwood', ma: '3-Mass' },
  ];

  const leftMasses = params.leftMasses || [params.m1];
  const rightMasses = params.rightMasses || [params.m2];

  const addLeftMass = () => {
    if (leftMasses.length < 3) {
      const updated = [...leftMasses, 2.0];
      onChangeParams({ leftMasses: updated, m1: updated[0] });
    }
  };

  const removeLeftMass = () => {
    if (leftMasses.length > 1) {
      const updated = leftMasses.slice(0, leftMasses.length - 1);
      onChangeParams({ leftMasses: updated, m1: updated[0] });
    }
  };

  const addRightMass = () => {
    if (rightMasses.length < 3) {
      const updated = [...rightMasses, 2.0];
      onChangeParams({ rightMasses: updated, m2: updated[0] });
    }
  };

  const removeRightMass = () => {
    if (rightMasses.length > 1) {
      const updated = rightMasses.slice(0, rightMasses.length - 1);
      onChangeParams({ rightMasses: updated, m2: updated[0] });
    }
  };

  const isThreeMass = state.mode === 'double_atwood' || state.mode === 'table_2pulley';
  const hasSurfaceFriction = state.mode === 'table_2pulley' || state.mode === 'double_incline';

  return (
    <aside className={`w-[310px] border-r p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none text-xs transition-colors duration-200 backdrop-blur-xl ${
      isLight ? 'bg-white/95 border-[#E2E8F0] text-[#0F172A]' : 'bg-[#0F172A]/90 border-[#334155] text-[#F1F5F9]'
    }`}>
      {/* 1. SYSTEM CONFIGURATION & PULLEY RIG SELECTOR */}
      <div>
        <h3 className={`text-[10px] uppercase tracking-widest mb-2.5 font-extrabold border-b pb-1.5 flex items-center justify-between ${
          isLight ? 'text-[#64748B] border-[#E2E8F0]' : 'text-[#94A3B8] border-[#334155]'
        }`}>
          <span className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-[#0284C7]' : 'text-[#38BDF8]'}`}>
            <Layers className="w-3.5 h-3.5" /> PULLEY RIG MATRIX
          </span>
          <span className="text-[9px] text-[#10B981] font-mono font-bold bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/30">
            MA: {state.mechanicalAdvantage}:1
          </span>
        </h3>

        {/* Multi-pulley mode grid */}
        <div className={`grid grid-cols-3 p-1 rounded-lg border gap-1 ${
          isLight ? 'bg-[#F1F5F9] border-[#CBD5E1]' : 'bg-[#020617] border-[#334155]'
        }`}>
          {modes.map((m) => {
            const isActive = state.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onChangeState({ mode: m.id });
                  if (m.id === 'inclined' && params.inclineAngle === 90) {
                    onChangeParams({ inclineAngle: 35 });
                  }
                }}
                className={`py-1.5 px-1 rounded-md text-[9px] font-bold tracking-tight transition-all flex flex-col items-center justify-center leading-tight ${
                  isActive
                    ? 'bg-[#0284C7] text-white shadow-md border border-[#38BDF8]'
                    : isLight
                    ? 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                <span className="truncate w-full text-center">{m.label}</span>
                <span className="text-[8px] opacity-80 font-mono">({m.ma})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC PARAMETERS */}
      <div className="space-y-3.5">
        <h3 className={`text-[10px] uppercase tracking-widest mb-2 font-bold border-b pb-1 flex items-center justify-between ${
          isLight ? 'text-[#64748B] border-[#E2E8F0]' : 'text-[#94A3B8] border-[#334155]'
        }`}>
          <span className={`flex items-center gap-1.5 ${isLight ? 'text-[#0284C7]' : 'text-[#38BDF8]'}`}>
            <Sliders className="w-3.5 h-3.5" /> DYNAMIC PARAMETERS
          </span>
          <span className={`text-[9px] font-mono ${isLight ? 'text-[#059669]' : 'text-[#00FF8C]'}`}>LIVE ENGINE</span>
        </h3>

        {/* Left Side Mass Controls */}
        <div className="space-y-1.5 p-2 rounded-lg border border-[#0284C7]/20 bg-[#0284C7]/5">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-[#0284C7]' : 'text-[#38BDF8]'}`}>
              Left Mass Stack ({leftMasses.length})
            </span>
            <div className="flex gap-1">
              <button
                onClick={addLeftMass}
                disabled={leftMasses.length >= 3}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0284C7] text-white rounded hover:bg-[#0369A1] disabled:opacity-40"
              >
                + Add
              </button>
              <button
                onClick={removeLeftMass}
                disabled={leftMasses.length <= 1}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-500 text-white rounded hover:bg-slate-600 disabled:opacity-40"
              >
                - Remove
              </button>
            </div>
          </div>
          {leftMasses.map((mVal, idx) => (
            <div key={`left-mass-${idx}`} className="space-y-0.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-600 dark:text-slate-300">m<sub>L{idx + 1}</sub></span>
                <span className="font-mono font-bold text-[#0284C7]">{mVal.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="40"
                step="0.5"
                value={mVal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const updated = [...leftMasses];
                  updated[idx] = val;
                  onChangeParams({ leftMasses: updated, m1: updated[0] });
                }}
                className="w-full accent-[#0284C7] h-1"
              />
            </div>
          ))}
        </div>

        {/* Right Side Mass Controls */}
        <div className="space-y-1.5 p-2 rounded-lg border border-[#E11D48]/20 bg-[#E11D48]/5">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-[#E11D48]' : 'text-[#FB7185]'}`}>
              Right Mass Stack ({rightMasses.length})
            </span>
            <div className="flex gap-1">
              <button
                onClick={addRightMass}
                disabled={rightMasses.length >= 3}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E11D48] text-white rounded hover:bg-[#BE123C] disabled:opacity-40"
              >
                + Add
              </button>
              <button
                onClick={removeRightMass}
                disabled={rightMasses.length <= 1}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-500 text-white rounded hover:bg-slate-600 disabled:opacity-40"
              >
                - Remove
              </button>
            </div>
          </div>
          {rightMasses.map((mVal, idx) => (
            <div key={`right-mass-${idx}`} className="space-y-0.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-600 dark:text-slate-300">m<sub>R{idx + 1}</sub></span>
                <span className="font-mono font-bold text-[#E11D48]">{mVal.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="40"
                step="0.5"
                value={mVal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const updated = [...rightMasses];
                  updated[idx] = val;
                  onChangeParams({ rightMasses: updated, m2: updated[0] });
                }}
                className="w-full accent-[#E11D48] h-1"
              />
            </div>
          ))}
        </div>

        {/* Mass 3 Slider (If 3-mass system) */}
        {isThreeMass && (
          <div className="space-y-1 animate-fadeIn">
            <div className="flex justify-between items-end">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>
                Mass 3 (m<sub>3</sub>)
              </label>
              <span className={`font-mono text-xs font-extrabold ${isLight ? 'text-[#7C3AED]' : 'text-[#A78BFA]'}`}>
                {params.m3.toFixed(1)} kg
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={params.m3}
              onChange={(e) => onChangeParams({ m3: parseFloat(e.target.value) })}
              className="w-full accent-[#7C3AED]"
            />
          </div>
        )}

        {/* Pulley Mass (M_pulley) */}
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>
              Pulley Mass (M<sub>p</sub>)
            </label>
            <span className={`font-mono text-xs font-bold ${isLight ? 'text-[#D97706]' : 'text-[#F59E0B]'}`}>
              {params.mPulley.toFixed(1)} kg
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={params.mPulley}
            onChange={(e) => onChangeParams({ mPulley: parseFloat(e.target.value) })}
            className="w-full accent-[#D97706]"
          />
        </div>

        {/* Pulley Axle Friction */}
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>Axle Friction (μ<sub>axle</sub>)</label>
            <span className={`font-mono text-xs font-bold ${isLight ? 'text-[#059669]' : 'text-[#00FF8C]'}`}>
              {params.friction.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={params.friction}
            onChange={(e) => onChangeParams({ friction: parseFloat(e.target.value) })}
            className="w-full accent-[#10B981]"
          />
        </div>

        {/* Surface Friction Controls */}
        {state.mode === 'double_incline' ? (
          <div className="space-y-2 p-2 rounded-lg border border-[#D97706]/20 bg-[#D97706]/5 animate-fadeIn">
            <div className="text-[10px] uppercase font-extrabold text-[#D97706] tracking-wider">
              Dual Surface Friction (μ)
            </div>
            {/* Left Ramp Surface Friction */}
            <div className="space-y-0.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className={`font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>
                  Left Ramp (μ<sub>1</sub>)
                </span>
                <span className={`font-mono font-bold ${isLight ? 'text-[#D97706]' : 'text-[#F59E0B]'}`}>
                  {(params.surfaceFriction1 ?? 0.10).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.01"
                value={params.surfaceFriction1 ?? 0.10}
                onChange={(e) => onChangeParams({ surfaceFriction1: parseFloat(e.target.value) })}
                className="w-full accent-[#D97706] h-1"
              />
            </div>
            {/* Right Ramp Surface Friction */}
            <div className="space-y-0.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className={`font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>
                  Right Ramp (μ<sub>2</sub>)
                </span>
                <span className={`font-mono font-bold ${isLight ? 'text-[#D97706]' : 'text-[#F59E0B]'}`}>
                  {(params.surfaceFriction2 ?? 0.15).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.01"
                value={params.surfaceFriction2 ?? 0.15}
                onChange={(e) => onChangeParams({ surfaceFriction2: parseFloat(e.target.value) })}
                className="w-full accent-[#D97706] h-1"
              />
            </div>
          </div>
        ) : hasSurfaceFriction ? (
          <div className="space-y-1 animate-fadeIn">
            <div className="flex justify-between items-end">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>Surface Friction (μ<sub>k</sub>)</label>
              <span className={`font-mono text-xs font-bold ${isLight ? 'text-[#D97706]' : 'text-[#F59E0B]'}`}>
                {params.surfaceFriction.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.01"
              value={params.surfaceFriction}
              onChange={(e) => onChangeParams({ surfaceFriction: parseFloat(e.target.value) })}
              className="w-full accent-[#D97706]"
            />
          </div>
        ) : null}

        {/* Left Incline Angle Slider */}
        {(state.mode === 'inclined' || state.mode === 'double_incline') && (
          <div className="space-y-1 animate-fadeIn">
            <div className="flex justify-between items-end">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>Left Angle (θ<sub>1</sub>)</label>
              <span className={`font-mono text-xs font-bold ${isLight ? 'text-[#0284C7]' : 'text-[#38BDF8]'}`}>
                {params.inclineAngle.toFixed(0)}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={params.inclineAngle}
              onChange={(e) => onChangeParams({ inclineAngle: parseFloat(e.target.value) })}
              className="w-full accent-[#0284C7]"
            />
          </div>
        )}

        {/* Right Incline Angle Slider (Double Incline) */}
        {state.mode === 'double_incline' && (
          <div className="space-y-1 animate-fadeIn">
            <div className="flex justify-between items-end">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>Right Angle (θ<sub>2</sub>)</label>
              <span className={`font-mono text-xs font-bold ${isLight ? 'text-[#E11D48]' : 'text-[#FB7185]'}`}>
                {params.inclineAngle2.toFixed(0)}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={params.inclineAngle2}
              onChange={(e) => onChangeParams({ inclineAngle2: parseFloat(e.target.value) })}
              className="w-full accent-[#E11D48]"
            />
          </div>
        )}

        {/* Gravity Select */}
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#334155]' : 'text-[#D5DDE6]'}`}>Gravity Environment</label>
            <span className={`font-mono text-xs font-bold ${isLight ? 'text-[#059669]' : 'text-[#00FF8C]'}`}>
              {params.gravity.toFixed(2)} m/s²
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: 'Earth', val: 9.81 },
              { label: 'Moon', val: 1.62 },
              { label: 'Mars', val: 3.72 },
              { label: 'Jup.', val: 24.79 },
            ].map((gPreset) => (
              <button
                key={gPreset.label}
                onClick={() => onChangeParams({ gravity: gPreset.val })}
                className={`py-1 text-[10px] font-mono font-bold rounded border transition-all ${
                  Math.abs(params.gravity - gPreset.val) < 0.05
                    ? 'bg-[#0284C7] text-white border-[#0284C7]'
                    : isLight
                    ? 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1] hover:bg-[#E2E8F0]'
                    : 'bg-[#0D1117] text-[#A9B2BC] border-[#2A303A] hover:text-white'
                }`}
              >
                {gPreset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DISPLAY CONTROLS */}
      <div className="space-y-2.5">
        <h3 className={`text-[10px] uppercase tracking-widest mb-1.5 font-bold border-b pb-1 flex items-center justify-between ${
          isLight ? 'text-[#64748B] border-[#E2E8F0]' : 'text-[#94A3B8] border-[#334155]'
        }`}>
          <span className={`flex items-center gap-1.5 ${isLight ? 'text-[#0284C7]' : 'text-[#38BDF8]'}`}>
            <Eye className="w-3.5 h-3.5" /> VISUALIZERS
          </span>
        </h3>

        <label className="flex items-center justify-between cursor-pointer font-medium hover:opacity-80">
          <span className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
              display.showVectors ? 'bg-[#0284C7] border-[#0284C7]' : 'border-[#CBD5E1]'
            }`}>
              {display.showVectors && <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>}
            </div>
            <span>Force Vectors (m·g, T)</span>
          </span>
          <input
            type="checkbox"
            checked={display.showVectors}
            onChange={(e) => onChangeDisplay({ showVectors: e.target.checked })}
            className="sr-only"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer font-medium hover:opacity-80">
          <span className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
              display.showComponents ? 'bg-[#A855F7] border-[#A855F7]' : 'border-[#CBD5E1]'
            }`}>
              {display.showComponents && <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>}
            </div>
            <span>Weight Components (mg sin θ, mg cos θ, N)</span>
          </span>
          <input
            type="checkbox"
            checked={display.showComponents}
            onChange={(e) => onChangeDisplay({ showComponents: e.target.checked })}
            className="sr-only"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer font-medium hover:opacity-80">
          <span className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
              display.showFrictionForce ? 'bg-[#D97706] border-[#D97706]' : 'border-[#CBD5E1]'
            }`}>
              {display.showFrictionForce && <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>}
            </div>
            <span>Surface Friction (f<sub>k</sub>)</span>
          </span>
          <input
            type="checkbox"
            checked={display.showFrictionForce}
            onChange={(e) => onChangeDisplay({ showFrictionForce: e.target.checked })}
            className="sr-only"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer font-medium hover:opacity-80">
          <span className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
              display.showKinematicsGraphs ? 'bg-[#0284C7] border-[#0284C7]' : 'border-[#CBD5E1]'
            }`}>
              {display.showKinematicsGraphs && <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>}
            </div>
            <span>Kinematics Plotter</span>
          </span>
          <input
            type="checkbox"
            checked={display.showKinematicsGraphs}
            onChange={(e) => onChangeDisplay({ showKinematicsGraphs: e.target.checked })}
            className="sr-only"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer font-medium hover:opacity-80">
          <span className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
              display.showEnergyBars ? 'bg-[#0284C7] border-[#0284C7]' : 'border-[#CBD5E1]'
            }`}>
              {display.showEnergyBars && <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>}
            </div>
            <span>Energy HUD</span>
          </span>
          <input
            type="checkbox"
            checked={display.showEnergyBars}
            onChange={(e) => onChangeDisplay({ showEnergyBars: e.target.checked })}
            className="sr-only"
          />
        </label>
      </div>

      {/* 4. RUN / RESET ACTIONS */}
      <div className="mt-auto space-y-2 pt-2">
        <button
          onClick={onTogglePlay}
          className={`w-full py-2.5 font-black text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 shadow-md ${
            state.isRunning
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
          }`}
        >
          {state.isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{state.isRunning ? 'PAUSE SIMULATION' : 'RUN SIMULATION'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onReset}
            className={`w-full py-2 border font-bold text-xs uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              isLight
                ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155] hover:bg-[#E2E8F0]'
                : 'border-[#2A303A] text-[#D5DDE6] hover:bg-[#2A303A]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0284C7]" /> RESET
          </button>

          <button
            onClick={onExportCSV}
            className={`w-full py-2 border font-bold text-xs uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 font-mono ${
              isLight
                ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#059669] hover:bg-[#E2E8F0]'
                : 'border-[#2A303A] text-[#00FF8C] hover:bg-[#2A303A]'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> CSV DATA
          </button>
        </div>
      </div>
    </aside>
  );
};
