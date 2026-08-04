import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasArea } from './components/CanvasArea';
import { KinematicsGraph } from './components/KinematicsGraph';
import { PhysicsParams, SimulationState, DisplayOptions, PresetScenario, DataPoint, SimulationMode } from './types';

const PRESETS: PresetScenario[] = [
  {
    id: 'double_incline',
    name: 'Universal Dual-Ramp',
    description: 'Two inclined ramps with apex pulley: left angle θ1 (0-90°) and right angle θ2 (0-90°)',
    m1: 8.0,
    m2: 12.0,
    m3: 5.0,
    mPulley: 1.0,
    friction: 0.02,
    surfaceFriction: 0.15,
    inclineAngle: 30,
    inclineAngle2: 45,
    gravity: 9.81,
    mode: 'double_incline',
  },
  {
    id: 'ideal',
    name: 'Ideal Atwood (1:1)',
    description: 'Frictionless 1:1 single pulley system with m1=10kg and m2=5kg',
    m1: 10.0,
    m2: 5.0,
    m3: 8.0,
    mPulley: 0.0,
    friction: 0.0,
    surfaceFriction: 0.0,
    inclineAngle: 90,
    inclineAngle2: 90,
    gravity: 9.81,
    mode: 'standard',
  },
  {
    id: 'table_2pulley',
    name: 'Table-Top 2-Pulley',
    description: '3-Mass table system with surface friction: m1 hanging left, m2 on surface, m3 hanging right',
    m1: 4.0,
    m2: 1.0,
    m3: 2.0,
    mPulley: 0.5,
    friction: 0.02,
    surfaceFriction: 0.35,
    inclineAngle: 90,
    inclineAngle2: 90,
    gravity: 9.81,
    mode: 'table_2pulley',
  },
  {
    id: 'double_atwood',
    name: '★ Double Atwood',
    description: 'Cascaded double pulley system with moving pulley holding m1 & m2 against m3',
    m1: 4.0,
    m2: 2.0,
    m3: 8.0,
    mPulley: 0.5,
    friction: 0.01,
    surfaceFriction: 0.0,
    inclineAngle: 90,
    inclineAngle2: 90,
    gravity: 9.81,
    mode: 'double_atwood',
  },
];

export default function App() {
  // Physics Parameters
  const [params, setParams] = useState<PhysicsParams>({
    m1: 10.0,
    m2: 5.0,
    m3: 8.0,
    leftMasses: [10.0],
    rightMasses: [5.0],
    mPulley: 1.0,
    pulleyRadius: 0.15,
    friction: 0.03,
    surfaceFriction: 0.15,
    surfaceFriction1: 0.10,
    surfaceFriction2: 0.15,
    inclineAngle: 30,
    inclineAngle2: 45,
    gravity: 9.81,
    ropeLength: 6.0,
  });

  // Simulation State
  const [state, setState] = useState<SimulationState>({
    y1: 2.0,
    y2: 2.0,
    y3: 2.0,
    v: 0.0,
    a: 0.0,
    t1: 0.0,
    t2: 0.0,
    t3: 0.0,
    mechanicalAdvantage: 1,
    time: 0.0,
    isRunning: false,
    timeScale: 1.0,
    mode: 'standard',
    dimension: '2D',
    status: 'IDLE',
  });

  // Display Options
  const [display, setDisplay] = useState<DisplayOptions>({
    showVectors: true,
    showComponents: true,
    showVelocityVector: true,
    showEnergyBars: false,
    showKinematicsGraphs: false,
    showGrid: true,
    showTrails: false,
    showTooltips: true,
    soundEnabled: false,
    theme: 'light', // Default to bright laboratory theme as requested!
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string>('ideal');
  const [telemetry, setTelemetry] = useState<DataPoint[]>([]);
  const [fps, setFps] = useState<number>(60);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(0);

  // Mechanical Advantage lookup by mode
  const getMechanicalAdvantage = useCallback((mode: SimulationMode): number => {
    switch (mode) {
      case 'standard':
      case 'inclined':
      case 'double_incline':
      case 'table_2pulley':
      case 'double_atwood':
      default:
        return 1;
    }
  }, []);

  // Calculate dynamic acceleration and tension
  const calculatePhysics = useCallback(
    (currentY1: number, currentY2: number, currentY3: number, currentV: number) => {
      const { m1, m2, m3, mPulley, friction, surfaceFriction, inclineAngle, inclineAngle2, gravity } = params;
      const mode = state.mode;

      if (mode === 'double_atwood') {
        // Cascaded Double Atwood System
        const m12Sum = m1 + m2;
        const m12Prod = m1 * m2;
        const effectiveM12 = m12Sum > 0 ? (4 * m12Prod) / m12Sum : 0;
        
        const denominator = effectiveM12 + m3 + mPulley;
        const accelPulleyA = denominator > 0 ? (gravity * (m3 - effectiveM12)) / denominator : 0;
        
        const accelRelative = m12Sum > 0 ? ((m1 - m2) / m12Sum) * (gravity - accelPulleyA) : 0;
        
        const accel1 = accelPulleyA + accelRelative;
        const accel2 = accelPulleyA - accelRelative;
        const accel3 = -accelPulleyA;

        let tension1 = m12Sum > 0 ? (2 * m1 * m2 / m12Sum) * (gravity - accelPulleyA) : 0;
        let tension2 = m3 * (gravity - accel3);
        let tension3 = 2 * tension1;

        return {
          accel: accelPulleyA,
          accel1,
          accel2,
          accel3,
          tension1: Math.max(0, tension1),
          tension2: Math.max(0, tension2),
          tension3: Math.max(0, tension3),
          MA: 1,
        };
      } else if (mode === 'table_2pulley') {
        // Table 2-Pulley System with Surface Friction
        const normalForce = m2 * gravity;
        const fricForce = surfaceFriction * normalForce;
        let driveForce = (m3 - m1) * gravity;
        
        if (Math.abs(currentV) > 0.001) {
          driveForce -= Math.sign(currentV) * fricForce;
        } else if (Math.abs(driveForce) <= fricForce) {
          driveForce = 0;
        } else {
          driveForce -= Math.sign(driveForce) * fricForce;
        }

        const totalInertia = m1 + m2 + m3 + mPulley;
        const accel = totalInertia > 0 ? driveForce / totalInertia : 0;

        let tension1 = m1 * (gravity + accel);
        let tension2 = m3 * (gravity - accel);
        let tension3 = tension1 + m2 * accel;

        return {
          accel,
          accel1: -accel,
          accel2: accel,
          accel3: accel,
          tension1: Math.max(0, tension1),
          tension2: Math.max(0, tension2),
          tension3: Math.max(0, tension3),
          MA: 1,
        };
      } else if (mode === 'double_incline') {
        // Double Inclined Ramp Apex System
        const rad1 = (inclineAngle * Math.PI) / 180;
        const rad2 = (inclineAngle2 * Math.PI) / 180;
        const mu1 = params.surfaceFriction1 ?? params.surfaceFriction ?? 0;
        const mu2 = params.surfaceFriction2 ?? params.surfaceFriction ?? 0;

        const f_g1 = m1 * gravity * Math.sin(rad1);
        const f_g2 = m2 * gravity * Math.sin(rad2);
        
        const normal1 = m1 * gravity * Math.cos(rad1);
        const normal2 = m2 * gravity * Math.cos(rad2);
        const fric1 = mu1 * normal1;
        const fric2 = mu2 * normal2;
        const totalFric = fric1 + fric2;

        let netDrive = f_g2 - f_g1;
        if (Math.abs(currentV) > 0.001) {
          netDrive -= Math.sign(currentV) * totalFric;
        } else if (Math.abs(netDrive) <= totalFric) {
          netDrive = 0;
        } else {
          netDrive -= Math.sign(netDrive) * totalFric;
        }

        const totalInertia = m1 + m2 + 0.5 * mPulley;
        const accel = totalInertia > 0 ? netDrive / totalInertia : 0;

        const dir = accel !== 0 ? Math.sign(accel) : (currentV !== 0 ? Math.sign(currentV) : (netDrive !== 0 ? Math.sign(netDrive) : 1));

        let tension1 = f_g1 + m1 * accel + dir * fric1;
        let tension2 = f_g2 - m2 * accel - dir * fric2;

        return {
          accel,
          accel1: -accel,
          accel2: accel,
          accel3: 0,
          tension1: Math.max(0, tension1),
          tension2: Math.max(0, tension2),
          tension3: 0,
          MA: 1,
        };
      } else {
        // Standard, Ramp, Multi-Pulley Rigs
        const MA = getMechanicalAdvantage(mode);
        const isInclined = mode === 'inclined';
        const sinTheta = isInclined ? Math.sin((inclineAngle * Math.PI) / 180) : 1;

        let numPulleys = 1;
        if (mode === 'block_tackle_21') numPulleys = 2;
        else if (mode === 'simple_41' || mode === 'compound_61' || mode === 'mariner_71') numPulleys = 3;

        const pulleyFactor = mPulley > 0 ? 0.5 * mPulley * numPulleys : 0;
        const totalMass = m1 + m2 / (MA * MA) + pulleyFactor;

        let netForce = m1 * gravity * sinTheta - (m2 * gravity) / MA;

        if (friction > 0 || (isInclined && surfaceFriction > 0)) {
          const normalForce = isInclined ? m1 * gravity * Math.cos((inclineAngle * Math.PI) / 180) : 0;
          const fricForce = friction * (1.5 * numPulleys) + (isInclined ? surfaceFriction * normalForce : 0);
          if (Math.abs(currentV) > 0.001) {
            netForce -= Math.sign(currentV) * fricForce;
          } else if (Math.abs(netForce) <= fricForce) {
            netForce = 0;
          } else {
            netForce -= Math.sign(netForce) * fricForce;
          }
        }

        const accel = totalMass > 0 ? netForce / totalMass : 0;
        let tension1 = m1 * (gravity * sinTheta - accel);
        let tension2 = (m2 * (gravity + accel / MA)) / MA;

        return {
          accel,
          accel1: accel,
          accel2: -accel / MA,
          accel3: 0,
          tension1: Math.max(0, tension1),
          tension2: Math.max(0, tension2),
          tension3: 0,
          MA,
        };
      }
    },
    [params, state.mode, getMechanicalAdvantage]
  );

  // Synchronize dynamic equations when parameters change
  useEffect(() => {
    const { accel, tension1, tension2, tension3, MA } = calculatePhysics(state.y1, state.y2, state.y3, state.v);
    setState((prev) => ({
      ...prev,
      a: accel,
      t1: tension1,
      t2: tension2,
      t3: tension3,
      mechanicalAdvantage: MA,
    }));
  }, [params, state.mode, calculatePhysics]);

  // Main High Precision Integration Loop (Euler Method)
  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const rawDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Cap dt to prevent huge leaps
      const dt = Math.min(rawDt, 0.05) * state.timeScale;

      // FPS Calculation
      frameCountRef.current++;
      if (timestamp - lastFpsUpdateRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = timestamp;
      }

      if (state.isRunning) {
        setState((prev) => {
          const { accel, accel1, accel2, accel3, tension1, tension2, tension3, MA } = calculatePhysics(prev.y1, prev.y2, prev.y3, prev.v);

          const nextV = prev.v + accel * dt;
          let nextY1 = prev.y1;
          let nextY2 = prev.y2;
          let nextY3 = prev.y3;

          if (prev.mode === 'double_atwood') {
            nextY3 = prev.y3 + (accel3 || 0) * dt * dt * 0.5 + nextV * dt;
            nextY1 = prev.y1 + (accel1 || 0) * dt * dt * 0.5 + nextV * dt;
            nextY2 = prev.y2 + (accel2 || 0) * dt * dt * 0.5 + nextV * dt;
          } else if (prev.mode === 'table_2pulley') {
            nextY1 = prev.y1 - nextV * dt;
            nextY2 = prev.y2 + nextV * dt;
            nextY3 = prev.y3 + nextV * dt;
          } else if (prev.mode === 'double_incline') {
            nextY1 = prev.y1 - nextV * dt;
            nextY2 = prev.y2 + nextV * dt;
          } else {
            nextY1 = prev.y1 + nextV * dt;
            nextY2 = prev.y2 - (nextV / MA) * dt;
          }

          const nextTime = prev.time + dt;

          // Soft Boundary Collision Checks (0.1m top ceiling, 4.9m bottom floor)
          let activeV = nextV;
          let newStatus: SimulationState['status'] = 'SIMULATING';

          const clampPos = (val: number) => Math.max(0.1, Math.min(4.9, val));

          if (nextY1 <= 0.1 || nextY1 >= 4.9) {
            nextY1 = clampPos(nextY1);
            activeV = -0.15 * activeV;
            newStatus = 'BOUND_LIMIT';
          }

          if (nextY2 <= 0.1 || nextY2 >= 4.9) {
            nextY2 = clampPos(nextY2);
            activeV = -0.15 * activeV;
            newStatus = 'BOUND_LIMIT';
          }

          if (nextY3 <= 0.1 || nextY3 >= 4.9) {
            nextY3 = clampPos(nextY3);
            activeV = -0.15 * activeV;
            newStatus = 'BOUND_LIMIT';
          }

          // Telemetry Data Collection for Plotter
          const ke1 = 0.5 * params.m1 * activeV * activeV;
          const ke2 = 0.5 * params.m2 * activeV * activeV;
          const ke3 = (prev.mode === 'double_atwood' || prev.mode === 'table_2pulley') ? 0.5 * params.m3 * activeV * activeV : 0;
          const ke = ke1 + ke2 + ke3;

          const pe1 = params.m1 * params.gravity * Math.max(0, 5.0 - nextY1);
          const pe2 = params.m2 * params.gravity * Math.max(0, 5.0 - nextY2);
          const pe3 = (prev.mode === 'double_atwood' || prev.mode === 'table_2pulley') ? params.m3 * params.gravity * Math.max(0, 5.0 - nextY3) : 0;
          const pe = pe1 + pe2 + pe3;

          setTelemetry((points) => [
            ...points.slice(-300),
            {
              time: parseFloat(nextTime.toFixed(3)),
              y1: parseFloat(nextY1.toFixed(3)),
              y2: parseFloat(nextY2.toFixed(3)),
              velocity: parseFloat(activeV.toFixed(3)),
              acceleration: parseFloat(accel.toFixed(3)),
              tension1: parseFloat(tension1.toFixed(3)),
              tension2: parseFloat(tension2.toFixed(3)),
              ke: parseFloat(ke.toFixed(2)),
              pe: parseFloat(pe.toFixed(2)),
              keRot: 0,
              totalEnergy: parseFloat((ke + pe).toFixed(2)),
            },
          ]);

          return {
            ...prev,
            y1: nextY1,
            y2: nextY2,
            y3: nextY3,
            v: activeV,
            a: accel,
            t1: tension1,
            t2: tension2,
            t3: tension3,
            mechanicalAdvantage: MA,
            time: nextTime,
            status: newStatus,
            isRunning: prev.isRunning,
          };
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    },
    [state.isRunning, state.timeScale, calculatePhysics, params]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetScenario) => {
    setSelectedPresetId(preset.id);
    const MA = getMechanicalAdvantage(preset.mode);
    setParams({
      ...params,
      m1: preset.m1,
      m2: preset.m2,
      mPulley: preset.mPulley,
      friction: preset.friction,
      inclineAngle: preset.inclineAngle,
      gravity: preset.gravity,
    });
    setState((prev) => ({
      ...prev,
      y1: 2.0,
      y2: 2.0,
      v: 0.0,
      time: 0.0,
      isRunning: false,
      mode: preset.mode,
      mechanicalAdvantage: MA,
      status: 'IDLE',
    }));
    setTelemetry([]);
  };

  // Simulation Controls
  const togglePlay = () => {
    setState((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
      status: !prev.isRunning ? 'SIMULATING' : 'PAUSED',
    }));
  };

  const resetSimulation = () => {
    setState((prev) => ({
      ...prev,
      y1: 2.0,
      y2: 2.0,
      v: 0.0,
      time: 0.0,
      isRunning: false,
      status: 'IDLE',
    }));
    setTelemetry([]);
  };

  const stepSimulation = () => {
    if (state.isRunning) return;
    const dt = 0.01;
    const { accel, tension1, tension2, MA } = calculatePhysics(state.y1, state.y2, state.v);
    const nextV = state.v + accel * dt;
    const nextY1 = Math.max(0.1, state.y1 + nextV * dt);
    const nextY2 = Math.max(0.1, state.y2 - (nextV / MA) * dt);

    setState((prev) => ({
      ...prev,
      y1: nextY1,
      y2: nextY2,
      v: nextV,
      a: accel,
      t1: tension1,
      t2: tension2,
      mechanicalAdvantage: MA,
      time: prev.time + dt,
      status: 'PAUSED',
    }));
  };

  // Position update from interactive drag
  const handleUpdatePositions = (newY1: number, newY2: number) => {
    const { accel, tension1, tension2, MA } = calculatePhysics(newY1, newY2, 0);
    setState((prev) => ({
      ...prev,
      y1: newY1,
      y2: newY2,
      v: 0,
      a: accel,
      t1: tension1,
      t2: tension2,
      mechanicalAdvantage: MA,
    }));
  };

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetSimulation();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        stepSimulation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isRunning]);

  // Export Telemetry as CSV file
  const handleExportCSV = () => {
    if (telemetry.length === 0) return;
    const headers = ['Time(s)', 'Position_y1(m)', 'Position_y2(m)', 'Velocity(m/s)', 'Acceleration(m/s2)', 'Tension1(N)', 'Tension2(N)', 'KE(J)', 'PE(J)'];
    const rows = telemetry.map((pt) => [pt.time, pt.y1, pt.y2, pt.velocity, pt.acceleration, pt.tension1, pt.tension2, pt.ke, pt.pe]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `atwood_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLight = display.theme === 'light';

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden select-none transition-colors duration-300 ${isLight ? 'bg-[#F8FAFC] text-[#0F172A]' : 'bg-[#0B0E14] text-[#A9B2BC]'}`}>
      {/* Top Header Navigation */}
      <Header
        state={state}
        presets={PRESETS}
        selectedPresetId={selectedPresetId}
        display={display}
        fps={fps}
        onTogglePlay={togglePlay}
        onReset={resetSimulation}
        onStep={stepSimulation}
        onSelectPreset={handleSelectPreset}
        onChangeTimeScale={(scale) => setState((prev) => ({ ...prev, timeScale: scale }))}
        onChangeDisplay={(updated) => setDisplay((prev) => ({ ...prev, ...updated }))}
      />

      {/* Main Container Layout */}
      <div className="flex flex-1 pt-[50px] overflow-hidden relative">
        {/* Left Control Sidebar */}
        <Sidebar
          params={params}
          state={state}
          display={display}
          onChangeParams={(updated) => setParams((prev) => ({ ...prev, ...updated }))}
          onChangeState={(updated) => setState((prev) => ({ ...prev, ...updated }))}
          onChangeDisplay={(updated) => setDisplay((prev) => ({ ...prev, ...updated }))}
          onTogglePlay={togglePlay}
          onReset={resetSimulation}
          onExportCSV={handleExportCSV}
        />

        {/* Central Visualization Canvas */}
        <CanvasArea
          params={params}
          state={state}
          display={display}
          onUpdatePositions={handleUpdatePositions}
        />

        {/* Kinematics Telemetry Plotter */}
        {display.showKinematicsGraphs && (
          <KinematicsGraph
            data={telemetry}
            onClear={() => setTelemetry([])}
            onClose={() => setDisplay((prev) => ({ ...prev, showKinematicsGraphs: false }))}
          />
        )}
      </div>
    </div>
  );
}
