export type SimulationMode = 
  | 'standard' 
  | 'double_atwood'
  | 'table_2pulley'
  | 'double_incline'
  | 'inclined';

export type DimensionMode = '2D' | '3D';
export type ThemeMode = 'light' | 'dark';

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  m1: number;
  m2: number;
  m3?: number;
  mPulley: number;
  friction: number;
  surfaceFriction?: number;
  inclineAngle: number;
  inclineAngle2?: number;
  gravity: number;
  mode: SimulationMode;
}

export interface PhysicsParams {
  m1: number; // Mass 1 in kg (primary / top mass)
  m2: number; // Mass 2 in kg (primary / top mass)
  m3: number; // Mass 3 in kg (for 3-mass double atwood and table system)
  leftMasses: number[]; // Array of stacked masses on left string (up to 3)
  rightMasses: number[]; // Array of stacked masses on right string (up to 3)
  mPulley: number; // Pulley mass in kg
  pulleyRadius: number; // Pulley radius in meters (default 0.15m)
  friction: number; // Pulley axle friction coefficient
  surfaceFriction: number; // Surface friction coefficient (tables/ramps)
  surfaceFriction1: number; // Left ramp friction coefficient (mu1)
  surfaceFriction2: number; // Right ramp friction coefficient (mu2)
  inclineAngle: number; // Left incline angle in degrees (0 to 90)
  inclineAngle2: number; // Right incline angle in degrees (0 to 90)
  gravity: number; // Gravitational acceleration m/s^2
  ropeLength: number; // Total rope length in meters
}

export interface SimulationState {
  y1: number; // Position/Displacement of mass 1 (meters)
  y2: number; // Position/Displacement of mass 2 (meters)
  y3: number; // Position/Displacement of mass 3 (meters)
  v: number; // System velocity (m/s)
  a: number; // System acceleration (m/s^2)
  t1: number; // Tension 1 (N)
  t2: number; // Tension 2 (N)
  t3: number; // Tension 3 (N)
  mechanicalAdvantage: number; // MA ratio
  time: number; // Elapsed simulation time (s)
  isRunning: boolean;
  timeScale: number; // 0.25x, 0.5x, 1x, 2x
  mode: SimulationMode;
  dimension: DimensionMode;
  status: 'IDLE' | 'SIMULATING' | 'PAUSED' | 'BOUND_LIMIT' | 'EQUILIBRIUM';
}

export interface DisplayOptions {
  showVectors: boolean;
  showComponents: boolean;
  showFrictionForce: boolean;
  showVelocityVector: boolean;
  showEnergyBars: boolean;
  showKinematicsGraphs: boolean;
  showGrid: boolean;
  showTrails: boolean;
  showTooltips: boolean;
  soundEnabled: boolean;
  theme: ThemeMode;
}

export interface DataPoint {
  time: number;
  y1: number;
  y2: number;
  velocity: number;
  acceleration: number;
  tension1: number;
  tension2: number;
  ke: number;
  pe: number;
  keRot: number;
  totalEnergy: number;
}
