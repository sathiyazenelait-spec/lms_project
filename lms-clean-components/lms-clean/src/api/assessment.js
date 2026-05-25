// src/api/assessment.js
import { request } from "./auth";

// --- TEACHER ASSESSMENT APIS ---
export async function getTeacherAssessments(courseId) {
  return request(`/teacher/assessments?courseId=${courseId}`);
}

export async function createAssessment(payload) {
  return request(`/teacher/assessments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAssessment(id, payload) {
  return request(`/teacher/assessments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAssessment(id) {
  return request(`/teacher/assessments/${id}`, {
    method: "DELETE",
  });
}

export async function getAssessmentQuestions(assessmentId) {
  return request(`/teacher/assessments/${assessmentId}/questions`);
}

export async function addAssessmentQuestion(assessmentId, question) {
  return request(`/teacher/assessments/${assessmentId}/questions`, {
    method: "POST",
    body: JSON.stringify(question),
  });
}

export async function updateAssessmentQuestion(assessmentId, questionId, question) {
  return request(`/teacher/assessments/${assessmentId}/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(question),
  });
}

export async function deleteAssessmentQuestion(assessmentId, questionId) {
  return request(`/teacher/assessments/${assessmentId}/questions/${questionId}`, {
    method: "DELETE",
  });
}

export async function getAssessmentSubmissions(assessmentId) {
  return request(`/teacher/assessments/${assessmentId}/submissions`);
}

export async function gradeAssessmentAnswer(attemptId, answerId, payload) {
  return request(`/teacher/assessments/attempts/${attemptId}/answers/${answerId}/grade`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function publishAssessmentResults(assessmentId) {
  return request(`/teacher/assessments/${assessmentId}/publish-results`, {
    method: "POST",
  });
}

// --- QUESTION BANK APIS ---
export async function getQuestionBank(courseId) {
  return request(`/teacher/question-bank?courseId=${courseId}`);
}

export async function saveToQuestionBank(payload) {
  return request(`/teacher/question-bank`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteFromQuestionBank(id) {
  return request(`/teacher/question-bank/${id}`, {
    method: "DELETE",
  });
}

// --- TEACHER TASK TEMPLATES ---
export async function getAssignmentTemplates(courseId) {
  return request(`/teacher/assignments/templates?courseId=${courseId}`);
}

export async function createAssignmentTemplate(payload) {
  return request(`/teacher/assignments/templates`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getBulkSubmissions(courseId) {
  return request(`/teacher/assignments/bulk-submissions?courseId=${courseId}`);
}

export async function bulkExtendDeadline(payload) {
  return request(`/teacher/assignments/bulk-extend`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendBulkReminders(payload) {
  return request(`/teacher/assignments/bulk-remind`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestResubmission(submissionId, payload) {
  return request(`/teacher/assignments/submissions/${submissionId}/request-resubmission`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --- STUDENT ASSESSMENT APIS ---
export async function getStudentAssessments(courseId) {
  return request(`/student/assessments?courseId=${courseId}`);
}

export async function startAssessment(assessmentId) {
  return request(`/student/assessments/${assessmentId}/start`, {
    method: "POST",
  });
}

export async function saveAssessmentProgress(attemptId, answers) {
  return request(`/student/assessments/attempts/${attemptId}/save`, {
    method: "POST",
    body: JSON.stringify(answers),
  });
}

export async function submitAssessmentAttempt(attemptId, payload) {
  return request(`/student/assessments/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function incrementTabSwitch(attemptId) {
  return request(`/student/assessments/attempts/${attemptId}/tab-switch`, {
    method: "POST",
  });
}

// --- PARENT APIS ---
export async function getChildAssessments(childId) {
  return request(`/parent/children/${childId}/assessments`);
}
