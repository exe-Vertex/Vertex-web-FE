import React from 'react';
import { motion } from 'motion/react';

// ─── Mini Bar Chart (pure SVG) ───
export const MiniBarChart: React.FC<{ data: { label: string; value: number }[]; color: string; height?: number }> = ({ data, color, height = 140 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(32, Math.floor(280 / data.length));
  const gap = 4;
  const totalW = data.length * (barW + gap);
  return (
    <div className="w-full overflow-x-auto">
      <svg width={totalW + 40} height={height + 36} className="mx-auto">
        {data.map((d, i) => {
          const barH = (d.value / max) * height;
          const x = 20 + i * (barW + gap);
          const y = height - barH;
          return (
            <g key={i}>
              <motion.rect x={x} rx={3}
                initial={{ y: height, height: 0 }} animate={{ y, height: barH }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                width={barW} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={height + 14} textAnchor="middle" className="fill-slate-500" fontSize={9}>{d.label}</text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="fill-slate-400" fontSize={9} fontWeight={600}>{d.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── Mini Donut Chart (pure SVG) ───
export const MiniDonut: React.FC<{ data: { label: string; value: number }[]; colors: string[]; centerLabel: string }> = ({ data, colors, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total; 
    const start = cum;
    cum += pct;
    return { ...d, pct, start, color: colors[i % colors.length] };
  });
  const r = 45;
  const cir = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6 justify-center">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {segments.map((s, i) => (
          <motion.circle key={i} cx={60} cy={60} r={r} fill="none" strokeWidth={18} 
            stroke={s.color} strokeDasharray={`${s.pct * cir} ${cir}`}
            strokeDashoffset={-s.start * cir}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}
            transform="rotate(-90 60 60)" strokeLinecap="round" />
        ))}
        <text x={60} y={56} textAnchor="middle" className="fill-white" fontSize={22} fontWeight={700}>{total}</text>
        <text x={60} y={72} textAnchor="middle" className="fill-slate-500" fontSize={10}>{centerLabel}</text>
      </svg>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2"> 
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-slate-300">{s.label}</span>
            <span className="text-xs font-bold text-white">{s.value}</span>
            <span className="text-[10px] text-slate-500">({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
