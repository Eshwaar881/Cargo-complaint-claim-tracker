import { motion } from 'framer-motion';

/**
 * Signature element: a radar-sweep ring visualizing open-case severity mix.
 * Segments are sized by count (critical/high/medium/low), with a continuously
 * rotating sweep line layered on top — evoking an air-traffic control screen,
 * appropriate to an air cargo operations console.
 */
export default function RadarStatusRing({ byPriority = [], total = 0 }) {
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const colors = { CRITICAL: '#C23B3B', HIGH: '#D4742F', MEDIUM: '#D9A23B', LOW: '#3FA796' };
  const counts = Object.fromEntries(order.map((k) => [k, 0]));
  byPriority.forEach((p) => { counts[p.priority] = p.count; });

  const sum = order.reduce((s, k) => s + counts[k], 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let offsetAccum = 0;
  const segments = order.map((key) => {
    const value = counts[key];
    const fraction = value / sum;
    const length = fraction * circumference;
    const seg = { key, color: colors[key], length, offset: offsetAccum, value };
    offsetAccum += length;
    return seg;
  });

  return (
    <div className="relative w-[140px] h-[140px] flex-shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#28394F" strokeWidth="10" />
        {segments.map((seg) =>
          seg.value > 0 ? (
            <motion.circle
              key={seg.key}
              cx="70" cy="70" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
          ) : null
        )}
      </svg>

      {/* rotating sweep line, radar-style */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50% 50%' }}
      >
        <div
          className="w-[2px] h-[58px] origin-bottom"
          style={{
            background: 'linear-gradient(to top, rgba(212,116,47,0.9), transparent)',
            transform: 'translateY(-58px)',
          }}
        />
      </motion.div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-paper-100">{total}</span>
        <span className="text-[10px] uppercase tracking-wide text-paper-100/50">open cases</span>
      </div>
    </div>
  );
}
