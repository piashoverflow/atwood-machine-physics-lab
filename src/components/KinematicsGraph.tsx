import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DataPoint } from '../types';
import { X, Maximize2, Minimize2, Trash2 } from 'lucide-react';

interface KinematicsGraphProps {
  data: DataPoint[];
  onClear: () => void;
  onClose: () => void;
}

export const KinematicsGraph: React.FC<KinematicsGraphProps> = ({ data, onClear, onClose }) => {
  const [activeTab, setActiveTab] = useState<'position' | 'velocity' | 'acceleration' | 'energy'>('position');
  const [isExpanded, setIsExpanded] = useState(false);

  // Subsample data if points > 200 for smooth chart performance
  const chartData = data.length > 200 ? data.filter((_, i) => i % Math.ceil(data.length / 200) === 0) : data;

  return (
    <div
      className={`absolute bottom-4 left-4 right-72 z-30 bg-[#1A1E27]/98 border border-[#2A303A] rounded-lg shadow-2xl p-3 backdrop-blur-md transition-all duration-300 flex flex-col ${
        isExpanded ? 'h-[420px]' : 'h-[240px]'
      }`}
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2A303A] mb-2 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#00F2FE] tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00F2FE] animate-pulse"></span>
            Kinematics & Dynamics Plotter
          </span>

          <div className="flex bg-[#0D1117] p-0.5 rounded border border-[#2A303A] text-[10px] font-mono">
            <button
              onClick={() => setActiveTab('position')}
              className={`px-2 py-0.5 rounded ${
                activeTab === 'position' ? 'bg-[#00F2FE]/20 text-[#00F2FE] font-bold' : 'text-[#A9B2BC]'
              }`}
            >
              y(t)
            </button>
            <button
              onClick={() => setActiveTab('velocity')}
              className={`px-2 py-0.5 rounded ${
                activeTab === 'velocity' ? 'bg-[#00FF8C]/20 text-[#00FF8C] font-bold' : 'text-[#A9B2BC]'
              }`}
            >
              v(t)
            </button>
            <button
              onClick={() => setActiveTab('acceleration')}
              className={`px-2 py-0.5 rounded ${
                activeTab === 'acceleration' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-[#A9B2BC]'
              }`}
            >
              a(t)
            </button>
            <button
              onClick={() => setActiveTab('energy')}
              className={`px-2 py-0.5 rounded ${
                activeTab === 'energy' ? 'bg-purple-400/20 text-purple-300 font-bold' : 'text-[#A9B2BC]'
              }`}
            >
              Energy
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#A9B2BC]">
          <button
            onClick={onClear}
            className="p-1 hover:text-[#FF4646] transition-colors"
            title="Clear Chart History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:text-[#00F2FE] transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 w-full h-full min-h-0 text-[10px] font-mono">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#A9B2BC] italic">
            Run simulation to plot real-time telemetry...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A303A" opacity={0.6} />
              <XAxis dataKey="time" stroke="#A9B2BC" tickFormatter={(val) => `${val.toFixed(1)}s`} />
              <YAxis stroke="#A9B2BC" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0D1117',
                  borderColor: '#2A303A',
                  color: '#D5DDE6',
                  fontSize: '11px',
                  borderRadius: '4px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />

              {activeTab === 'position' && (
                <>
                  <Line type="monotone" dataKey="y1" name="Mass 1 Position (y1)" stroke="#00F2FE" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="y2" name="Mass 2 Position (y2)" stroke="#FF4646" dot={false} strokeWidth={2} />
                </>
              )}

              {activeTab === 'velocity' && (
                <Line type="monotone" dataKey="velocity" name="System Velocity (v)" stroke="#00FF8C" dot={false} strokeWidth={2} />
              )}

              {activeTab === 'acceleration' && (
                <Line type="monotone" dataKey="acceleration" name="Acceleration (a)" stroke="#F59E0B" dot={false} strokeWidth={2} />
              )}

              {activeTab === 'energy' && (
                <>
                  <Line type="monotone" dataKey="ke" name="Kinetic Energy" stroke="#00FF8C" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="pe" name="Potential Energy" stroke="#00F2FE" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="totalEnergy" name="Total Mech Energy" stroke="#A855F7" dot={false} strokeWidth={2} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
