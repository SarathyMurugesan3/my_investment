import React from "react";

const ManageExamsPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400 mb-6">Manage Assessments</h1>
      <div className="glass-panel p-6 rounded-2xl relative shadow-2xl border border-rose-500/20 bg-black/40 backdrop-blur-xl">
        <p className="text-rose-100/70">Create secured examinations, define timers, and review attempt logs.</p>
        <button className="mt-6 px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors font-medium">
           + Formulate New Exam
        </button>
      </div>
    </div>
  );
};

export default ManageExamsPage;
