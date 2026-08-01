import api from "./axios";

// ==========================================
// ADMIN EXAM ENDPOINTS
// ==========================================

export const createExam = (examData) => {
    return api.post("/api/admin/exams", examData);
};

export const addQuestionToExam = (examId, questionData) => {
    return api.post(`/api/admin/exams/${examId}/questions`, questionData);
};

export const getAdminExams = () => {
    return api.get("/api/admin/exams");
};

export const getExamDetails = (examId) => {
    return api.get(`/api/admin/exams/${examId}`);
};

export const getAdminExamQuestions = (examId) => {
    return api.get(`/api/admin/exams/${examId}/questions`);
};

export const getExamAttempts = (examId) => {
    return api.get(`/api/admin/exams/${examId}/attempts`);
};

// ==========================================
// STUDENT EXAM ENDPOINTS
// ==========================================

export const getAvailableExams = () => {
    return api.get("/api/student/exams");
};

export const startExamAttempt = (examId) => {
    return api.post(`/api/student/exams/${examId}/start`);
};

export const getStudentExamQuestions = (examId) => {
    return api.get(`/api/student/exams/${examId}/questions`);
};

export const logSecurityViolation = (attemptId, type) => {
    // type must be TAB_SWITCH or FULLSCREEN_EXIT
    return api.post(`/api/student/exams/attempts/${attemptId}/log-violation?type=${type}`);
};

export const submitExam = (attemptId, answersMap) => {
    return api.post(`/api/student/exams/attempts/${attemptId}/submit`, answersMap);
};
