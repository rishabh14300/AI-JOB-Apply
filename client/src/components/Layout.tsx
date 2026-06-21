import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1e293b] border border-indigo-500/10 lg:hidden"
      >
        <Menu className="w-5 h-5 text-slate-400" />
      </button>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 min-h-screen ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}`}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
