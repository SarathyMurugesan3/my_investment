import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import { lazy, Suspense } from "react";

// Layout
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));

// Super Admin
const AdminDashboard = lazy(() => import("./components/superadmin/AdminDashboard"));

// Auth
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const Unauthorized = lazy(() => import("./pages/auth/Unauthorized"));

// Student
const ContentListPage = lazy(() => import("./pages/student/ContentListPage"));
const PdfViewerPage = lazy(() => import("./pages/student/PdfViewerPage"));
const VideoPlayerPage = lazy(() => import("./pages/student/VideoPlayerPage"));
const StudentProfilePage = lazy(() => import("./pages/student/StudentProfilePage"));
const StudentExamsPage = lazy(() => import("./pages/student/StudentExamsPage"));
const TakeExamPage = lazy(() => import("./pages/student/TakeExamPage"));
const StudentDiscussionsPage = lazy(() => import("./pages/student/StudentDiscussionsPage"));
const ExploreTutorsPage = lazy(() => import("./pages/student/ExploreTutorsPage"));

// Admin & Super Admin
const AnalyticsDashboard = lazy(() => import("./components/dashboard/AnalyticsDashboard"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const ActivityLogsPage = lazy(() => import("./pages/admin/ActivityLogsPage"));
const AdminManageContentPage = lazy(() => import("./pages/admin/AdminManageContentPage"));
const ManageCompaniesPage = lazy(() => import("./pages/admin/ManageCompaniesPage"));
const AdminCompanyContentPage = lazy(() => import("./pages/admin/AdminCompanyContentPage"));

// Company Admin Features
const ManageTutorsPage = lazy(() => import("./pages/company/ManageTutorsPage"));
const ManageStudentsPage = lazy(() => import("./pages/company/ManageStudentsPage"));
const KeepAlivePage = lazy(() => import("./pages/company/KeepAlivePage"));

// Tutor
const ManageCoursesPage = lazy(() => import("./pages/tutor/ManageCoursesPage"));
const UploadMediaPage = lazy(() => import("./pages/tutor/UploadMediaPage"));
const TutorContentPage = lazy(() => import("./pages/tutor/TutorContentPage"));
const ManageExamsPage = lazy(() => import("./pages/tutor/ManageExamsPage"));
const TutorDiscussionsPage = lazy(() => import("./pages/tutor/TutorDiscussionsPage"));
const TutorEnrollmentsPage = lazy(() => import("./pages/tutor/TutorEnrollmentsPage"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-[#0f111a] flex items-center justify-center text-emerald-400 font-bold">Loading Platform...</div>}>
          <Routes>

            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ========================= */}
            {/* STUDENT SAAS ROUTES       */}
            {/* ========================= */}
            <Route path="/student/exams/take/:id" element={<ProtectedRoute allowedRoles={["STUDENT"]}><TakeExamPage /></ProtectedRoute>} />

            <Route path="/student" element={<ProtectedRoute allowedRoles={["STUDENT"]}><DashboardLayout /></ProtectedRoute>}>
               <Route index element={<ContentListPage />} />
               <Route path="tutors" element={<ExploreTutorsPage />} />
               <Route path="profile" element={<StudentProfilePage />} />
               <Route path="pdf/:id" element={<PdfViewerPage />} />
               <Route path="video/:id" element={<VideoPlayerPage />} />
               <Route path="exams" element={<StudentExamsPage />} />
               <Route path="discussions" element={<StudentDiscussionsPage />} />
            </Route>

            {/* ========================= */}
            {/* TUTOR SAAS ROUTES         */}
            {/* ========================= */}
            <Route path="/tutor" element={<ProtectedRoute allowedRoles={["TUTOR"]}><DashboardLayout /></ProtectedRoute>}>
               <Route index element={<Navigate to="upload" replace />} />
               <Route path="upload" element={<UploadMediaPage />} />
               <Route path="content" element={<TutorContentPage />} />
               <Route path="enrollments" element={<TutorEnrollmentsPage />} />
               <Route path="students" element={<ManageStudentsPage />} />
               <Route path="exams" element={<ManageExamsPage />} />
               <Route path="discussions" element={<TutorDiscussionsPage />} />
            </Route>

            {/* ========================= */}
            {/* COMPANY ADMIN ROUTES      */}
            {/* ========================= */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><DashboardLayout /></ProtectedRoute>}>
               <Route index element={<Navigate to="tutors" replace />} />
               <Route path="tutors" element={<ManageTutorsPage />} />
               <Route path="students" element={<ManageStudentsPage />} />
               <Route path="content" element={<AdminCompanyContentPage />} />
               <Route path="keep-alive" element={<KeepAlivePage />} />
            </Route>

            {/* ========================= */}
            {/* SUPER ADMIN SAAS ROUTES   */}
            {/* ========================= */}
            <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><DashboardLayout /></ProtectedRoute>}>
               <Route index element={<AdminDashboard />} />
               <Route path="dashboard" element={<AnalyticsDashboard />} />
               <Route path="companies" element={<ManageCompaniesPage />} />
               <Route path="users" element={<AdminUsersPage />} />
               <Route path="manage-content" element={<AdminManageContentPage />} />
               <Route path="logs" element={<ActivityLogsPage />} />
               <Route path="keep-alive" element={<KeepAlivePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;