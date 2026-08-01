import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const ManageCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch for tenants. The backend only allows Super Admin to fetch all companies.
    setTimeout(() => {
      setCompanies([
        { id: 1, name: "Acme Corp", users: 120, status: "Active", createdAt: "2025-01-12" },
        { id: 2, name: "Global Tech", users: 45, status: "Active", createdAt: "2025-03-05" },
        { id: 3, name: "Nexus LLC", users: 12, status: "Suspended", createdAt: "2024-11-20" },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Manage Tenants
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Oversee all companies onboarded to the SaaS platform.</p>
        </div>
        <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          + Onboard Company
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-sm tracking-wider uppercase">
              <th className="p-5 font-semibold">Company Name</th>
              <th className="p-5 font-semibold">Total Users</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold">Created At</th>
              <th className="p-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">Loading tenants...</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-5 font-medium text-white">{company.name}</td>
                  <td className="p-5 text-slate-300">{company.users}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${company.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="p-5 text-slate-400 text-sm">{company.createdAt}</td>
                  <td className="p-5 text-right space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">Edit</button>
                    <button className="text-rose-400 hover:text-rose-300 text-sm font-medium">Suspend</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCompaniesPage;
