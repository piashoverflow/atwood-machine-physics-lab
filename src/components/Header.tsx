import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Sparkles, Gauge, Sun, Moon } from 'lucide-react';
import { SimulationState, PresetScenario, DisplayOptions } from '../types';

interface HeaderProps {
  state: SimulationState;
  presets: PresetScenario[];
  selectedPresetId: string;
  display?: DisplayOptions;
  fps: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onStep: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
  onChangeTimeScale: (scale: number) => void;
  onChangeDisplay?: (updated: Partial<DisplayOptions>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  presets,
  selectedPresetId,
  display,
  fps,
  onTogglePlay,
  onReset,
  onStep,
  onSelectPreset,
  onChangeTimeScale,
  onChangeDisplay,
}) => {
  const isLight = display?.theme === 'light';

  return (
    <header className={`fixed top-0 left-0 right-0 h-[50px] border-b px-4 flex items-center justify-between z-50 select-none transition-colors duration-200 ${
      isLight ? 'bg-white border-[#E2E8F0] shadow-sm' : 'bg-[#0B0E14] border-[#2A303A]'
    }`}>
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`font-black text-base md:text-lg tracking-tight ${isLight ? 'text-[#0284C7]' : 'text-[#00F2FE]'}`}>
            UDVASH ACADEMIC
          </span>
        </div>

        <div className={`h-4 w-[1px] hidden sm:block ${isLight ? 'bg-[#E2E8F0]' : 'bg-[#2A303A]'}`} />

        <div className={`font-bold text-xs hidden sm:flex items-center gap-2 ${isLight ? 'text-[#475569]' : 'text-[#D5DDE6]'}`}>
          <span className="uppercase tracking-wider text-[11px]">Pulley Dynamics Lab</span>
        </div>
      </div>

      {/* Preset Scenario Selector Bar */}
      <div className={`hidden lg:flex items-center gap-1 p-1 rounded-lg border ${
        isLight ? 'bg-[#F1F5F9] border-[#CBD5E1]' : 'bg-[#1A1E27] border-[#2A303A]'
      }`}>
        <span className={`text-[10px] px-2 font-mono flex items-center gap-1 font-semibold ${isLight ? 'text-[#64748B]' : 'text-[#A9B2BC]'}`}>
          <Sparkles className={`w-3 h-3 ${isLight ? 'text-[#0284C7]' : 'text-[#00F2FE]'}`} /> PRESETS:
        </span>
        {presets.map((p) => {
          const isActive = selectedPresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-bold ${
                isActive
                  ? isLight
                    ? 'bg-[#0284C7] text-white shadow-sm'
                    : 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/50 shadow-[0_0_8px_rgba(0,242,254,0.2)]'
                  : isLight
                  ? 'text-[#475569] hover:bg-[#E2E8F0]'
                  : 'text-[#A9B2BC] hover:text-[#D5DDE6] hover:bg-[#2A303A]/50'
              }`}
              title={p.description}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Quick Controls & Theme Toggle */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Bright Theme Toggle */}
        {onChangeDisplay && (
          <button
            onClick={() => onChangeDisplay({ theme: isLight ? 'dark' : 'light' })}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all border ${
              isLight
                ? 'bg-[#FEF08A] text-[#854D0E] border-[#FDE047] hover:bg-[#FDE047]'
                : 'bg-[#1E293B] text-[#F1F5F9] border-[#334155] hover:bg-[#334155]'
            }`}
            title="Toggle Light/Dark Background Theme"
          >
            {isLight ? <Sun className="w-3.5 h-3.5 text-[#D97706] fill-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#38BDF8]" />}
            <span className="hidden md:inline">{isLight ? 'Bright Lab' : 'Dark Mode'}</span>
          </button>
        )}

        {/* Speed Selector */}
        <div className={`hidden sm:flex items-center rounded-md border p-0.5 text-xs font-mono ${
          isLight ? 'bg-[#F1F5F9] border-[#CBD5E1]' : 'bg-[#1A1E27] border-[#2A303A]'
        }`}>
          <Gauge className={`w-3.5 h-3.5 ml-1.5 mr-1 ${isLight ? 'text-[#64748B]' : 'text-[#A9B2BC]'}`} />
          {[0.25, 0.5, 1, 2].map((scale) => (
            <button
              key={scale}
              onClick={() => onChangeTimeScale(scale)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                state.timeScale === scale
                  ? isLight
                    ? 'bg-[#0284C7] text-white'
                    : 'bg-[#00F2FE] text-black font-bold'
                  : isLight
                  ? 'text-[#64748B] hover:text-[#0F172A]'
                  : 'text-[#A9B2BC] hover:text-white'
              }`}
            >
              {scale}x
            </button>
          ))}
        </div>

        {/* Step Button */}
        <button
          onClick={onStep}
          disabled={state.isRunning}
          className={`p-1.5 rounded-md border transition-all disabled:opacity-40 ${
            isLight
              ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155] hover:bg-[#E2E8F0]'
              : 'bg-[#1A1E27] border-[#2A303A] text-[#A9B2BC] hover:text-[#00F2FE]'
          }`}
          title="Step frame (+0.01s)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Primary Play / Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-extrabold text-xs transition-all shadow-md ${
            state.isRunning
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : isLight
              ? 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-[0_0_12px_rgba(2,132,199,0.3)]'
              : 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/60 hover:bg-[#00F2FE]/30'
          }`}
        >
          {state.isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN</span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className={`p-1.5 rounded-md border transition-all ${
            isLight
              ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#E11D48] hover:bg-[#FFE4E6]'
              : 'bg-[#1A1E27] border-[#2A303A] text-[#A9B2BC] hover:text-[#FF4646]'
          }`}
          title="Reset Simulation (Hotkey: R)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* System Status & FPS Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></div>
          <span className={`text-[10px] font-mono font-bold hidden sm:inline ${isLight ? 'text-[#059669]' : 'text-[#00FF8C]'}`}>STABLE</span>
        </div>
        <div className={`h-5 w-[1px] mx-1 hidden sm:block ${isLight ? 'bg-[#E2E8F0]' : 'bg-[#2A303A]'}`}></div>
        <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-[#64748B]' : 'text-[#4A5568]'}`}>{fps.toFixed(0)} FPS</span>
      </div>
    </header>
  );
};
