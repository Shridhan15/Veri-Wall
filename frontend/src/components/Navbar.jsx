import React from "react";
import { Link } from "react-router-dom"; // Use Link instead of <a>
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  History,
  LogOut,
} from "lucide-react";

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-xl border-b border-slate-700">
      <div className="container mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xl font-bold tracking-tight group"
        >
          <Shield
            className="text-emerald-400 group-hover:scale-110 transition-transform"
            size={28}
          />
          <span>
            VERI<span className="text-emerald-400">WALL</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          <div className="flex gap-6 border-r border-slate-700 pr-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 hover:text-emerald-400 transition-colors text-sm font-medium"
            >
              <LayoutDashboard size={18} /> Dashboard
            </Link>

            {/* Only show 'New Policy' if user is an admin */}
            {user?.role === "admin" && (
              <Link
                to="/create"
                className="flex items-center gap-2 hover:text-emerald-400 transition-colors text-sm font-medium"
              >
                <PlusCircle size={18} /> New Policy
              </Link>
            )}

            <Link
              to="/policies"
              className="flex items-center gap-2 hover:text-emerald-400 transition-colors text-sm font-medium"
            >
              <History size={18} /> Audit Log
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-none">
                {user?.role}
              </p>
              <p className="text-sm font-mono text-emerald-400">{user?.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut
                size={20}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
