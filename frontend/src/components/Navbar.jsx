import { LogOut } from 'lucide-react';

export default function Navbar({ userEmail, isLive, token, onLogout }) {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B0F19]/70 backdrop-blur-xl border-b border-white/[0.04] px-8 py-4 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/25 tracking-tighter select-none">
          Ω
        </div>
        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          SocialEngine<span className="text-blue-500">.</span>
        </span>
      </div>

      {/* Status + Actions */}
      <div className="flex items-center space-x-4">
        <div className="bg-slate-900/80 border border-white/[0.05] rounded-xl px-4 py-1.5 flex items-center space-x-2.5">
          <div
            className={`h-2 w-2 rounded-full ${
              isLive ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase truncate max-w-[200px]">
            {userEmail}
          </span>
        </div>

        {token && (
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 bg-slate-900 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-white/[0.05] hover:border-red-500/20 rounded-xl transition-all duration-300"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </nav>
  );
}
