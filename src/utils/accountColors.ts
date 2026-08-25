// Deterministic account / payment type color styling (matching Statements PWA color taxonomy)

export const COLOR_STYLES: Record<string, { text: string; icon: string; bg: string; border: string; bgSolid: string }> = {
  blue: { text: 'text-blue-300', icon: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', bgSolid: 'bg-blue-500/20' },
  orange: { text: 'text-orange-300', icon: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', bgSolid: 'bg-orange-500/20' },
  teal: { text: 'text-teal-300', icon: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/30', bgSolid: 'bg-teal-500/20' },
  emerald: { text: 'text-emerald-300', icon: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', bgSolid: 'bg-emerald-500/20' },
  amber: { text: 'text-amber-300', icon: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', bgSolid: 'bg-amber-500/20' },
  sky: { text: 'text-sky-300', icon: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', bgSolid: 'bg-sky-500/20' },
  purple: { text: 'text-purple-300', icon: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', bgSolid: 'bg-purple-500/20' },
  pink: { text: 'text-pink-300', icon: 'text-pink-400', bg: 'bg-pink-500/15', border: 'border-pink-500/30', bgSolid: 'bg-pink-500/20' },
  indigo: { text: 'text-indigo-300', icon: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', bgSolid: 'bg-indigo-500/20' },
  rose: { text: 'text-rose-300', icon: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', bgSolid: 'bg-rose-500/20' },
  violet: { text: 'text-violet-300', icon: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30', bgSolid: 'bg-violet-500/20' },
  fuchsia: { text: 'text-fuchsia-300', icon: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15', border: 'border-fuchsia-500/30', bgSolid: 'bg-fuchsia-500/20' }
};

const ACCOUNT_COLOR_KEYS = Object.keys(COLOR_STYLES);

/**
 * Deterministically assigns one of the shared badge color styles to an account or payment type name.
 */
export const getAccountColorStyle = (accountName?: string) => {
  if (!accountName) return COLOR_STYLES.indigo;
  let hash = 0;
  for (let i = 0; i < accountName.length; i++) {
    hash = (hash * 31 + accountName.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % ACCOUNT_COLOR_KEYS.length;
  const key = ACCOUNT_COLOR_KEYS[index];
  return COLOR_STYLES[key] || COLOR_STYLES.indigo;
};
