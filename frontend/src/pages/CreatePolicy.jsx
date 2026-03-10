import React, { useState } from "react";
import { Send, Code, Hash, Layers, FileText, User, Type } from "lucide-react";
import { policyAPI } from "../api";

// We receive adminName from App.jsx (e.g., "admin1")
const CreatePolicy = ({ adminName }) => {
  const [formData, setFormData] = useState({
    name: "", // Compulsory
    version: 1,
    rule: '{\n  "allow": ["80", "443"],\n  "deny": ["22"]\n}',
    prev_hash: "00000000000000000000000000000000",
    justification: "", // Compulsory
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // 1. Strict check for compulsory Name
    if (!formData.name || !formData.name.trim()) {
      alert(
        "❌ Policy Name is compulsory. Please provide a unique identifier.",
      );
      return;
    }

    // 2. Strict check for compulsory Justification
    if (!formData.justification || !formData.justification.trim()) {
      alert("❌ Please provide a justification for this policy change.");
      return;
    }

    setLoading(true);
    try {
      await policyAPI.createPolicy(
        formData.name.trim(), // Send the trimmed name
        formData.version,
        formData.rule,
        formData.prev_hash,
        adminName,
        formData.justification,
      );
      alert("Success: Policy drafted and hashed.");

      // Optional: Clear form after success
      setFormData({
        name: "",
        version: formData.version + 1,
        rule: '{\n  "allow": ["80", "443"],\n  "deny": ["22"]\n}',
        prev_hash: "00000000000000000000000000000000",
        justification: "",
      });
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || "Creation failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Draft Security Policy</h1>

        {/* Read-Only Meta Data (Creator) */}
        <div className="flex items-center gap-2 mb-8 bg-emerald-900/20 text-emerald-400 p-3 rounded-lg border border-emerald-500/20 w-fit">
          <User size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">
            Drafting as: {adminName}
          </span>
        </div>

        {/* NEW: Compulsory Policy Name Field */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <Type size={14} /> Policy Name{" "}
            <span className="text-rose-500 text-lg leading-none">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., core_firewall_rules"
            className="bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono transition-all"
            value={formData.name}
            onChange={(e) =>
              // Replaces spaces with underscores and forces lowercase for clean filenames
              setFormData({
                ...formData,
                name: e.target.value.replace(/\s+/g, "_").toLowerCase(),
              })
            }
          />
          <span className="text-[10px] text-slate-500 italic">
            This will be used to generate the unique filename.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
              <Layers size={14} /> Policy Version
            </label>
            <input
              type="number"
              className="bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              value={formData.version}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  version: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
              <Hash size={14} /> Previous Hash
            </label>
            <input
              type="text"
              className="bg-slate-900 border border-slate-700 p-3 rounded-lg font-mono text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              value={formData.prev_hash}
              onChange={(e) =>
                setFormData({ ...formData, prev_hash: e.target.value })
              }
            />
          </div>
        </div>

        {/* Justification Field */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <FileText size={14} /> Audit Justification{" "}
            <span className="text-rose-500 text-lg leading-none">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Updating firewall to allow HTTPS traffic for new microservice..."
            className="bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
            value={formData.justification}
            onChange={(e) =>
              setFormData({ ...formData, justification: e.target.value })
            }
          />
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
            <Code size={16} className="text-emerald-400" />
            <span className="text-sm font-mono text-slate-300">
              {formData.name
                ? `${formData.name}_rules.json`
                : "policy_rules.json"}
            </span>
          </div>
          <textarea
            className="w-full h-48 bg-slate-950 p-4 font-mono text-emerald-400 text-sm outline-none"
            value={formData.rule}
            onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg text-white ${
            loading
              ? "bg-emerald-800 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
          }`}
        >
          <Send size={18} />{" "}
          {loading ? "Generating Hash..." : "Submit to Governance Chain"}
        </button>
      </div>
    </div>
  );
};

export default CreatePolicy;
