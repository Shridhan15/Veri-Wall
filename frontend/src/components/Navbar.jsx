import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  FileSignature,
  Activity,
} from "lucide-react";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // Safety check: if there is no user object, hide the navbar
  if (!user) return null;

  // Extract the name and role from the user object passed by App.jsx
  const adminName = user.name;
  const userRole = user.role;

  const handleLogout = () => {
    onLogout(); // Clears the state in App.jsx
    navigate("/"); // Redirects to login
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-xl">
      <div className="flex items-center gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-widest">
          <Shield size={28} />
          <span>VERIWALL</span>
        </div>

        {/* Role-Based Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition-all text-sm font-bold"
          >
            <LayoutDashboard size={18} /> Dashboard
          </Link>

          {/* Admins Only */}
          {userRole === "admin" && (
            <Link
              to="/create"
              className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition-all text-sm font-bold"
            >
              <PlusCircle size={18} /> New Policy
            </Link>
          )}

          {/* Admins & Verifiers Only */}
          {(userRole === "admin" || userRole === "verifier") && (
            <Link
              to="/policies"
              className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition-all text-sm font-bold"
            >
              <FileSignature size={18} /> Policy Governance
            </Link>
          )}

          {/* Auditors Only */}
          {userRole === "auditor" && (
            <Link
              to="/logs"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 px-4 py-2 rounded-lg transition-all text-sm font-bold"
            >
              <Activity size={18} /> SIEM Activity Logs
            </Link>
          )}
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="flex items-center gap-6 border-l border-slate-700 pl-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            {userRole}
          </span>
          <span className="text-sm font-mono text-emerald-400 font-bold">
            {adminName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-500 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
          title="Secure Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
