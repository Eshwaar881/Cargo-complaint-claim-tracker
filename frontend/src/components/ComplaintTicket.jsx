import { motion } from 'framer-motion';
import { Clock, PackageX, SearchX, Receipt, FileWarning, ChevronRight } from 'lucide-react';
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_COLORS, STATUS_COLORS } from '../lib/constants';

const ICONS = { DELAY: Clock, DAMAGE: PackageX, MISSING_PACKAGE: SearchX, BILLING_ISSUE: Receipt, DOCUMENTATION_ISSUE: FileWarning };

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hrs = diffMs / (1000 * 60 * 60);
  if (hrs < 1) return `${Math.max(1, Math.round(hrs * 60))}m ago`;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function isBreached(slaDueAt, status) {
  if (!slaDueAt || ['RESOLVED', 'REJECTED', 'CLOSED'].includes(status)) return false;
  return new Date(slaDueAt).getTime() < Date.now();
}

export default function ComplaintTicket({ complaint, onClick, index = 0 }) {
  const Icon = ICONS[complaint.category] || FileWarning;
  const pColor = PRIORITY_COLORS[complaint.priority] || PRIORITY_COLORS.MEDIUM;
  const sColor = STATUS_COLORS[complaint.status] || '#6B7280';
  const breached = isBreached(complaint.sla_due_at, complaint.status);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -2 }}
      className="ticket-edge w-full text-left bg-paper-100 rounded-b-lg rounded-t-sm overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-shadow"
    >
      <div className="p-4 pt-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 priority-glow"
              style={{ color: pColor.text, backgroundColor: pColor.text }}
              title={`${complaint.priority} priority`}
            />
            <Icon size={16} className="text-tower-900/70 flex-shrink-0" />
            <span className="font-display font-semibold text-tower-900 text-sm truncate">
              {CATEGORY_LABELS[complaint.category]}
            </span>
          </div>
          <span className="font-mono text-[11px] text-tower-900/50 flex-shrink-0">{complaint.reference_code}</span>
        </div>

        <p className="text-[13px] text-tower-900/75 leading-snug mb-3 line-clamp-2">
          {complaint.description}
        </p>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-full font-medium"
              style={{ color: sColor, backgroundColor: `${sColor}22` }}
            >
              {STATUS_LABELS[complaint.status]}
            </span>
            {complaint.is_claim ? (
              <span className="px-2 py-0.5 rounded-full bg-tower-900/8 text-tower-900/60 font-medium">
                Claim · {complaint.claim_currency} {complaint.claim_amount}
              </span>
            ) : null}
            {breached ? (
              <span className="px-2 py-0.5 rounded-full bg-breach-red/15 text-breach-red font-semibold">
                SLA breached
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-tower-900/45 flex-shrink-0">
            <span className="font-mono">{timeAgo(complaint.created_at)}</span>
            <ChevronRight size={13} />
          </div>
        </div>

        {complaint.awb_number ? (
          <div className="mt-2 pt-2 border-t border-tower-900/8 font-mono text-[11px] text-tower-900/50">
            AWB {complaint.awb_number}
          </div>
        ) : null}
      </div>
    </motion.button>
  );
}
