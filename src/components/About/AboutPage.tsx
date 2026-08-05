import React from 'react';
import { 
  Car, 
  Code2, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  GitBranch, 
  Globe, 
  Zap, 
  CheckCircle2, 
  Users, 
  Clock, 
  Database,
  ExternalLink
} from 'lucide-react';

interface AboutPageProps {
  onOpenSettings?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = () => {
  const currentYear = new Date().getFullYear();

  const TECH_STACK = [
    { name: 'React 19', category: 'UI Framework', desc: 'Concurrent Rendering & Modern Hooks' },
    { name: 'Vite 6', category: 'Build Tooling', desc: 'Lightning-fast ESM Bundler & HMR' },
    { name: 'TypeScript 5.8', category: 'Language', desc: 'Strict End-to-End Type Safety' },
    { name: 'Tailwind CSS 4', category: 'Styling Engine', desc: 'Glassmorphic Dark Theme System' },
    { name: 'Cloudflare Pages', category: 'Hosting Platform', desc: 'Global Edge Network Deployment' },
    { name: 'Firebase Cloud', category: 'Sync Engine', desc: 'Firestore & Realtime Database' },
  ];

  const KEY_FEATURES = [
    {
      icon: Car,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      title: 'Multi-Vehicle Garage',
      desc: 'Track specifications, VINs, license plates, fuel types, and live odometer readings for all family vehicles.'
    },
    {
      icon: Clock,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      title: 'Service History & Receipts',
      desc: 'Log maintenance, repairs, upgrades, and inspections with detailed cost breakdowns and service providers.'
    },
    {
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: 'Predictive Reminders',
      desc: 'Set automatic mileage or date-based service alerts so you never miss oil changes or fluid flushes.'
    },
    {
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: 'Shared Family Garage Sync',
      desc: 'Synchronize maintenance records across spouses and family members in real-time using custom Household Sync Codes.'
    },
    {
      icon: Database,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      title: '100% Data Portability',
      desc: 'Export complete CSV service logs for tax or resale, and backup/restore full JSON app states at any time.'
    },
    {
      icon: ShieldCheck,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      title: 'Offline-First Architecture',
      desc: 'Fully functional without an internet connection using local IndexedDB/LocalStorage with automatic cloud sync on reconnect.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Hero Brand Banner */}
      <div className="relative overflow-hidden glass-panel p-8 sm:p-10 rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-950/30 text-center sm:text-left">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-[10px] tracking-wider uppercase px-3 py-1 rounded-full shadow-md font-mono">
                Official Release
              </span>
              <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 rounded-full">
                v1.2.0 Stable
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <Car className="w-9 h-9 text-cyan-400" />
              <span>AutoTrack PWA</span>
            </h1>

            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              A modern Progressive Web Application for vehicle lifecycle tracking, maintenance logging, expense analytics, and shared household garage management.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl text-center">
              <span className="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider block">Environment</span>
              <span className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5 justify-center mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Cloudflare Edge
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Profile Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-white font-display">Developer Information</h2>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800/90 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-1 shadow-lg shadow-cyan-500/20">
              <img
                src="/avatar.png"
                alt="Ly Vuong"
                className="w-full h-full rounded-[12px] object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center border-2 border-slate-950" title="Active Developer">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-white">Ly Vuong</h3>
                <p className="text-xs text-cyan-400 font-semibold">Creator & Lead Engineer</p>
              </div>

              <a
                href="https://github.com/lyvuong/AutoTrack"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all self-center sm:self-auto"
              >
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Engineered with a focus on privacy, rapid performance, and intuitive user experience. Built using state-of-the-art web technologies and Google DeepMind agentic pairing to deliver a native app-like experience across desktop and mobile devices.
            </p>
          </div>
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-white font-display">Key Capabilities & Features</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KEY_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx}
                className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${feature.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-white">{feature.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architecture & Tech Stack Grid */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-white font-display">Technology Stack</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TECH_STACK.map((tech, idx) => (
            <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{tech.name}</span>
                <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/60">
                  {tech.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info & Copyright */}
      <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>AutoTrack Progressive Web Application</span>
        </div>
        <p className="text-xs text-slate-500">
          © {currentYear} Ly Vuong. All rights reserved. Open source under MIT license.
        </p>
      </div>

    </div>
  );
};

export default AboutPage;
