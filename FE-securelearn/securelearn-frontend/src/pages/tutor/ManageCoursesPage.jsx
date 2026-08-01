import React, { useState, useEffect } from "react";

const ManageCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCourses([
        { id: 1, title: "Advanced React Patterns", enrolled: 45, type: "Video + PDF", status: "Published" },
        { id: 2, title: "Corporate Security Guidelines", enrolled: 120, type: "PDF Only", status: "Draft" },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
            Manage Courses
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Create and update course materials for your students.</p>
        </div>
        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          + Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center text-slate-400 p-8">Loading courses...</div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="glass-card p-6 flex flex-col justify-between group transition-all hover:scale-105 border border-white/10 hover:border-amber-500/50 bg-black/40 backdrop-blur-md rounded-2xl relative">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${course.status === 'Published' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>
                    {course.status}
                  </span>
                  <div className="text-slate-400 text-sm font-medium bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    {course.type}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {course.title}
                </h3>
              </div>
              <div className="mt-6 flex justify-between items-end border-t border-white/10 pt-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Enrolled Students</div>
                  <div className="text-2xl font-black text-white">{course.enrolled}</div>
                </div>
                <button className="text-amber-400 hover:text-amber-300 text-sm font-bold flex items-center gap-1">
                  Edit Content <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageCoursesPage;
