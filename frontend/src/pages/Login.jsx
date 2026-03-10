import React, { useState } from "react";
import { ShieldCheck, Lock, User, KeyRound } from "lucide-react";
import { policyAPI } from "../api";

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await policyAPI.login(
        credentials.username,
        credentials.password,
      );

      if (response.data.success) {
        // Pass the verified data back to App.jsx
        onLogin(response.data.role, response.data.username);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Connection to VeriWall failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-96">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500/10 p-4 rounded-full mb-3">
            <ShieldCheck size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            VeriWall Portal
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Secure Cryptographic Governance
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Username
            </label>
            <div className="relative mt-2">
              <User
                className="absolute left-3 top-3.5 text-slate-500"
                size={18}
              />
              <input
                type="text"
                required
                className="w-full bg-slate-850 border border-slate-700 p-3 pl-10 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="e.g., admin1"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Authentication Key
            </label>
            <div className="relative mt-2">
              <KeyRound
                className="absolute left-3 top-3.5 text-slate-500"
                size={18}
              />
              <input
                type="password"
                required
                className="w-full bg-slate-850 border border-slate-700 p-3 pl-10 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg ${
              loading
                ? "bg-emerald-800 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-900/20"
            }`}
          >
            <Lock size={18} />
            <span>{loading ? "Verifying..." : "Initialize Session"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
