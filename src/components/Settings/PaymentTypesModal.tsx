import React from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Gift,
  Building2,
  Wallet,
  Lock,
  UserCheck,
  Info
} from 'lucide-react';
import type { PaymentTypeItem } from '../../types';

interface PaymentTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentTypes: PaymentTypeItem[];
}

const getPaymentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('cash')) return Banknote;
  if (lower.includes('gift')) return Gift;
  if (lower.includes('bank') || lower.includes('transfer') || lower.includes('check')) return Building2;
  if (lower.includes('visa') || lower.includes('mastercard') || lower.includes('card') || lower.includes('amex')) return CreditCard;
  return Wallet;
};

export const PaymentTypesModal: React.FC<PaymentTypesModalProps> = ({
  isOpen,
  onClose,
  paymentTypes
}) => {
  if (!isOpen) return null;

  const hasCashInList = paymentTypes.some(p => p.name.toLowerCase() === 'cash' || p.isSystemDefault);
  const cashItem: PaymentTypeItem = hasCashInList
    ? (paymentTypes.find(p => p.name.toLowerCase() === 'cash' || p.isSystemDefault)!)
    : { id: 'pt-system-cash', name: 'Cash', isSystemDefault: true };

  const customPaymentTypes = paymentTypes.filter(p => p.id !== cashItem.id && p.name.toLowerCase() !== 'cash');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Payment Methods Info</h2>
              <p className="text-xs text-slate-400">Shared household payment methods configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Explanation Banner */}
          <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Info className="w-4 h-4 shrink-0" />
              <span>Managed in ExpenseTracker</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Payment types are centrally managed in <strong>ExpenseTracker</strong>. Any payment methods (credit cards, debit cards, bank accounts) added or updated in ExpenseTracker will automatically sync here across your shared household in real-time.
            </p>
          </div>

          {/* List of Available Synced Payment Methods */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              System Default Method
            </p>

            {/* Always-available Cash row */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-900/50 text-emerald-300 border border-emerald-700/60 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Cash</span>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Available to all household members
                  </span>
                </div>
              </div>
              <span className="text-[11px] bg-emerald-900/80 text-emerald-300 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-700/80">
                <Lock className="w-3 h-3" /> System Default
              </span>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-2">
              Synced Custom Payment Methods ({customPaymentTypes.length})
            </p>

            {customPaymentTypes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                No custom payment methods synced from ExpenseTracker yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                {customPaymentTypes.map(item => {
                  const IconComponent = getPaymentIcon(item.name);
                  const ownerDisplay = item.ownerName || 'Household Member';

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white truncate block">{item.name}</span>
                          <span className="text-[11px] text-slate-400 truncate block">Owner: {ownerDisplay}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
                        Synced
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
