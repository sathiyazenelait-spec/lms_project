// src/api/auth.js

const API_BASE = "http://localhost:8080/api";

let activeRequests = 0;
function updateLoadingState(delta) {
  activeRequests += delta;
  if (activeRequests < 0) activeRequests = 0;
  const isLoading = activeRequests > 0;
  window.dispatchEvent(new CustomEvent("zenelait-loading", { detail: isLoading }));
}

export async function request(path, options = {}) {
  updateLoadingState(1);
  try {
    const raw = localStorage.getItem("zenelait-auth");
    let token = null;
    if (raw) {
      try { token = JSON.parse(raw).accessToken; } catch {}
    }

    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...(options.headers || {}),
      },
      ...options,
    });

    // 🔥 HANDLE TOKEN EXPIRED HERE
    if (res.status === 401) {
      try {
        const parsed = JSON.parse(raw || "{}");
        const refreshToken = parsed?.refreshToken;
        const role = parsed?.role?.toLowerCase();

        if (refreshToken) {
          // Try refresh token
          const refreshRes = await fetch(`${API_BASE}/auth/${role}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshBody = await refreshRes.json();

            // Save new token
            localStorage.setItem("zenelait-auth", JSON.stringify(refreshBody.data));

            // 🔁 Retry original request
            return request(path, options);
          }
        }
      } catch (e) {
        console.error("Refresh failed", e);
      }

      // ❌ Refresh failed → logout
      localStorage.removeItem("zenelait-auth");

      // 🚀 Redirect to login page
      window.location.href = "/";
      return;
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.success === false) {
      throw new Error(body.message || "Request failed");
    }
    return body.data !== undefined ? body.data : body;
  } finally {
    updateLoadingState(-1);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email, password, role) {
  const data = await request(`/auth/${role}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function registerUser(payload) {
  const role = payload.role.toLowerCase();
  return request(`/auth/${role}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminRegisterUser(payload){
  const role = payload.role.toLowerCase();
  return request(`/admin/${role}/create`,{ method: "POST", body: JSON.stringify(payload) })
}

// ── Departments (public) ──────────────────────────────────────────────────────
export async function getActiveDepartments() {
  const res  = await fetch(`${API_BASE}/public/departments`);
  const body = await res.json().catch(() => ({}));
  return Array.isArray(body.data) ? body.data : [];
}

export async function getActiveDepartmentsByOrg(orgId) {
  const res  = await fetch(`${API_BASE}/public/organizations/${orgId}/departments`);
  const body = await res.json().catch(() => ({}));
  return Array.isArray(body.data) ? body.data : [];
}

// ── Organizations (public) ───────────────────────────────────────────────────
export async function getOrganizations() {
  const res  = await fetch(`${API_BASE}/public/organizations`);
  const body = await res.json().catch(() => ({}));
  return Array.isArray(body.data) ? body.data : [];
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAdminStats()             { return request("/admin/stats"); }
export async function getAdminProfile()           { return request("/admin/profile"); }
export async function updateAdminProfile(body)    { return request("/admin/profile", { method: "PUT", body: JSON.stringify(body) }); }
export async function getRevenueSummary()         { return request("/admin/revenue/summary"); }
export async function getNonsuperAdmins() {return request("/admin/nonsuperadmin")}
export async function deleteAdmin(id) {
  return request(`/admin/admins/${id}`, { method: "DELETE" });
}
 

// Departments
export async function getOrgDepartments(orgId) {return request(`/admin/organizations/${orgId}/departments`);}
export async function getAllDepartments()           { return request("/admin/departments"); }
export async function createDepartment(body)       { return request("/admin/departments", { method: "POST", body: JSON.stringify(body) }); }
export async function updateDepartment(id, body)   { return request(`/admin/departments/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export async function deleteDepartment(id)         { return request(`/admin/departments/${id}`, { method: "DELETE" }); }
export async function toggleDepartment(id, active) { return request(`/admin/departments/${id}/toggle`, { method: "PATCH", body: JSON.stringify({ active }) }); }

// Students
export async function getAllStudents()            { return request("/admin/students"); }
export async function getStudent(id)             { return request(`/admin/students/${id}`); }
export async function toggleStudent(id, active)  { return request(`/admin/students/${id}/activate`, { method: "PATCH", body: JSON.stringify({ active }) }); }
export async function deleteStudent(id)          { return request(`/admin/students/${id}`, { method: "DELETE" }); }
export async function getStudentCourseStudents(courseId) {
  return request(`/student/courses/${courseId}/students`);
}
// Teachers
export async function getAllTeachers()            { return request("/admin/teachers"); }
export async function getTeacher(id)             { return request(`/admin/teachers/${id}`); }
export async function toggleTeacher(id, active)  { return request(`/admin/teachers/${id}/activate`, { method: "PATCH", body: JSON.stringify({ active }) }); }
export async function deleteTeacher(id)          { return request(`/admin/teachers/${id}`, { method: "DELETE" }); }

// Parents
export async function getAllParents()             { return request("/admin/parents"); }
export async function deleteParent(id)           { return request(`/admin/parents/${id}`, { method: "DELETE" }); }

// Courses
export async function getAllCourses()             { return request("/admin/courses"); }
export async function createCourse(body)         { return request("/admin/courses", { method: "POST", body: JSON.stringify(body) }); }
export async function updateCourse(id, body)     { return request(`/admin/courses/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export async function deleteCourse(id)           { return request(`/admin/courses/${id}`, { method: "DELETE" }); }
export async function getCourseStudents(id)                          { return request(`/admin/courses/${id}/students`); }
export async function enrollStudentsInCourse(id, studentIds)         { return request(`/admin/courses/${id}/students`, { method: "POST", body: JSON.stringify({ studentIds }) }); }
export async function unenrollStudentFromCourse(courseId, studentId) { return request(`/admin/courses/${courseId}/students/${studentId}`, { method: "DELETE" }); }

// Batches
export async function getAllBatches()             { return request("/admin/batches"); }
export async function createBatch(body)          { return request("/admin/batches", { method: "POST", body: JSON.stringify(body) }); }
export async function deleteBatch(id)            { return request(`/admin/batches/${id}`, { method: "DELETE" }); }
export async function syncBatchStatuses()        { return request("/admin/batches/sync-status",   { method: "POST" }); }
export async function cleanupCrossDeptStudents() { return request("/admin/batches/cleanup-dept",  { method: "POST" }); }
export async function getBatchStudents(id)                       { return request(`/admin/batches/${id}/students`); }
export async function addStudentsToBatch(id, studentIds)         { return request(`/admin/batches/${id}/students`, { method: "POST", body: JSON.stringify({ studentIds }) }); }
export async function removeStudentFromBatch(batchId, studentId) { return request(`/admin/batches/${batchId}/students/${studentId}`, { method: "DELETE" }); }
export async function assignCourseToBatch(id, courseId)          { return request(`/admin/batches/${id}/course`, { method: "PATCH", body: JSON.stringify({ courseId }) }); }
export async function generateBatchFee(batchId, body)            { return request(`/admin/batches/${batchId}/fees`, { method: "POST", body: JSON.stringify(body) }); }

// Fees
export async function getAllFees(status)         { return request(`/admin/fees${status ? `?status=${status}` : ""}`); }
export async function createFee(body)            { return request("/admin/fees", { method: "POST", body: JSON.stringify(body) }); }
export async function markFeePaid(id)            { return request(`/admin/fees/${id}/mark-paid`, { method: "PATCH" }); }

// Announcements
export async function getAllAnnouncements()      { return request("/admin/announcements"); }
export async function createAnnouncement(body)  { return request("/admin/announcements", { method: "POST", body: JSON.stringify(body) }); }
export async function deleteAnnouncement(id)    { return request(`/admin/announcements/${id}`, { method: "DELETE" }); }

// ── Student ───────────────────────────────────────────────────────────────────
export async function getStudentProfile()        { return request("/student/profile"); }
export async function updateStudentProfile(body) { return request("/student/profile", { method: "PUT", body: JSON.stringify(body) }); }
export async function getStudentBatches()        { return request("/student/batches"); }
export async function getStudentCourses()        { return request("/student/courses"); }
export async function getAvailableCourses()      { return request("/student/courses/available"); }
export async function getCourseDetails(courseId) { return request(`/student/courses/${courseId}/details`); }
export async function unenrollCourse(courseId)   { return request(`/student/courses/${courseId}/unenroll`, { method: "POST" }); }
export async function getStudentAssignments(courseId) {
  return request(`/student/assignments${courseId ? `?courseId=${courseId}` : ""}`);
}
export async function submitAssignment(id, body) {
  return request(`/student/assignments/${id}/submit`, { method: "POST", body: JSON.stringify(body) });
}
export async function getStudentSubmissions()    { return request("/student/submissions"); }
export async function getStudentAttendance(courseId) {
  return request(`/student/attendance?courseId=${courseId}`);
}
export async function getStudentFees()           { return request("/student/fees"); }
export async function getStudentNotifications()  { return request("/student/notifications"); }
export async function markStudentNotifRead(id)   { return request(`/student/notifications/${id}/read`, { method: "PATCH" }); }
export async function getStudentAnnouncements()  { return request("/student/announcements"); }

// ── Student Forum ─────────────────────────────────────────────────────────────
export async function getStudentForumCourses()               { return request("/student/forum/courses"); }
export async function getStudentForumPosts(courseId)         { return request(`/student/forum/courses/${courseId}/posts`); }
export async function createStudentForumPost(courseId, body) { return request(`/student/forum/courses/${courseId}/posts`, { method: "POST", body: JSON.stringify(body) }); }
export async function replyStudentForumPost(postId, body)    { return request(`/student/forum/posts/${postId}/replies`, { method: "POST", body: JSON.stringify(body) }); }
export async function deleteStudentForumPost(postId)         { return request(`/student/forum/posts/${postId}`, { method: "DELETE" }); }
export async function getStudentAttendanceTrack() {
  return request("/student/performance"); // logged-in student
}

// ── Teacher Forum ─────────────────────────────────────────────────────────────
export async function getTeacherForumCourses()               { return request("/teacher/forum/courses"); }
export async function getTeacherForumPosts(courseId)         { return request(`/teacher/forum/courses/${courseId}/posts`); }
export async function getTeacherForumMembers(courseId)       { return request(`/teacher/forum/courses/${courseId}/members`); }
export async function createTeacherForumPost(courseId, body) { return request(`/teacher/forum/courses/${courseId}/posts`, { method: "POST", body: JSON.stringify(body) }); }
export async function replyTeacherForumPost(postId, body)    { return request(`/teacher/forum/posts/${postId}/replies`, { method: "POST", body: JSON.stringify(body) }); }
export async function deleteTeacherForumPost(postId)         { return request(`/teacher/forum/posts/${postId}`, { method: "DELETE" }); }
export async function deleteTeacherForumReply(replyId)       { return request(`/teacher/forum/replies/${replyId}`, { method: "DELETE" }); }

// ── Teacher ───────────────────────────────────────────────────────────────────
export async function getTeacherProfile()        { return request("/teacher/profile"); }
export async function updateTeacherProfile(body) { return request("/teacher/profile", { method: "PUT", body: JSON.stringify(body) }); }
export async function getTeacherCourses()        { return request("/teacher/courses"); }
export async function getTeacherAssignments()    { return request("/teacher/assignments"); }
export async function createAssignment(body)     { return request("/teacher/assignments", { method: "POST", body: JSON.stringify(body) }); }
export async function deleteAssignment(id)       { return request(`/teacher/assignments/${id}`, { method: "DELETE" }); }
export async function getSubmissionsForAssignment(id) { return request(`/teacher/assignments/${id}/submissions`); }
export async function gradeSubmission(id, body)  { return request(`/teacher/submissions/${id}/grade`, { method: "PATCH", body: JSON.stringify(body) }); }
export async function bulkExtendAssignmentDeadline(id, newDueDate) { return request(`/teacher/assignments/${id}/bulk-extend`, { method: "POST", body: JSON.stringify({ newDueDate }) }); }
export async function sendTaskReminder(id) { return request(`/teacher/assignments/${id}/remind`, { method: "POST" }); }
export async function requestResubmission(subId, feedback) { return request(`/teacher/submissions/${subId}/request-resubmission`, { method: "POST", body: JSON.stringify({ feedback }) }); }
export async function markAttendance(body)       { return request("/teacher/attendance", { method: "POST", body: JSON.stringify(body) }); }
export async function getAttendanceForDate(courseId, date) {
  return request(`/teacher/attendance?courseId=${courseId}&date=${date}`);
}
export async function createTeacherAnnouncement(body) {
  return request("/teacher/announcements", { method: "POST", body: JSON.stringify(body) });
}

export async function getTeacherNotifications()  { return request("/teacher/notifications"); }
export async function getTaskTemplates() { return request("/teacher/task-templates"); }
export async function createTaskTemplate(body) { return request("/teacher/task-templates", { method: "POST", body: JSON.stringify(body) }); }
export async function deleteTaskTemplate(id) { return request(`/teacher/task-templates/${id}`, { method: "DELETE" }); }
// ── Teacher Courses ──────────────────────────────────────────────
export async function getTeacherCourseStudents(courseId) {
  return request(`/teacher/courses/${courseId}/students`);
}export async function getCourseAttendance(courseId) {
  return request(`/teacher/courses/${courseId}/attendance`); // returns [{studentId, status}, ...]
}


// ── Parent ────────────────────────────────────────────────────────────────────
export async function getParentProfile()         { return request("/parent/profile"); }
export async function updateParentProfile(body)  { return request("/parent/profile", { method: "PUT", body: JSON.stringify(body) }); }
export async function getMyChildren()            { return request("/parent/children"); }
export async function linkChild(studentCode)     { return request("/parent/children/link", { method: "POST", body: JSON.stringify({ studentCode }) }); }
export async function getChildFees(childId)      { return request(`/parent/children/${childId}/fees`); }
export async function getChildAttendance(childId, courseId) {
  return request(`/parent/children/${childId}/attendance?courseId=${courseId}`);
}
export async function getChildDashboardDetails(childId) {
  return request(`/parent/children/${childId}/dashboard-details`);
}
export async function getParentAnnouncements()   { return request("/parent/announcements"); }
export async function getParentNotifications()   { return request("/parent/notifications"); }

// ── Course Materials (Learning Board) ────────────────────────────────────────
export async function getTeacherMaterials(courseId)    { return request(`/teacher/materials${courseId ? `?courseId=${courseId}` : ""}`); }
export async function getTeacherStudents()             { return request("/teacher/students"); }
export async function uploadMaterial(body)             { return request("/teacher/materials", { method: "POST", body: JSON.stringify(body) }); }
export async function toggleMaterialVisibility(id)    { return request(`/teacher/materials/${id}/visibility`, { method: "PATCH" }); }
export async function deleteMaterial(id)               { return request(`/teacher/materials/${id}`, { method: "DELETE" }); }
export async function getStudentMaterials(courseId)   { return request(`/student/materials${courseId ? `?courseId=${courseId}` : ""}`); }
export async function getTeacherColleagues(dept) { return request(`/teacher/colleagues${dept ? `?department=${encodeURIComponent(dept)}` : ""}`); }
export async function getTeacherDeptStudents(dept) { return request(`/teacher/dept-students?department=${encodeURIComponent(dept)}`); }
export async function getTeacherBatches() { return request("/teacher/batches"); }
export async function createTeacherCourse(body) { return request("/teacher/courses/create", { method: "POST", body: JSON.stringify(body) }); }

// ── Notifications — all roles ─────────────────────────────────────────────────
export async function markStudentNotifReadAll()    { return request("/student/notifications/read-all", { method: "PATCH" }); }
export async function getAdminNotifications()      { return request("/admin/notifications"); }
export async function markAdminNotifRead(id)       { return request(`/admin/notifications/${id}/read`, { method: "PATCH" }); }
export async function markAdminNotifReadAll()      { return request("/admin/notifications/read-all", { method: "PATCH" }); }
export async function markTeacherNotifRead(id)     { return request(`/teacher/notifications/${id}/read`, { method: "PATCH" }); }
export async function markTeacherNotifReadAll()    { return request("/teacher/notifications/read-all", { method: "PATCH" }); }
export async function markParentNotifRead(id)      { return request(`/parent/notifications/${id}/read`, { method: "PATCH" }); }
export async function markParentNotifReadAll()     { return request("/parent/notifications/read-all", { method: "PATCH" }); }

// ── Contact Messages ──────────────────────────────────────────────────────────
export async function submitContactMessage(body) { return request("/public/contact", { method: "POST", body: JSON.stringify(body) }); }
export async function getContactMessages(status) { return request(`/admin/contact-messages${status ? `?status=${status}` : ""}`); }
export async function updateContactStatus(id, status) { return request(`/admin/contact-messages/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); }
export async function deleteContactMessage(id) { return request(`/admin/contact-messages/${id}`, { method: "DELETE" }); }

// ── Timetable ─────────────────────────────────────────────────────────────────
export async function getActiveTimetable()        { return request("/admin/timetable"); }
export async function getActiveBatchesForTT()     { return request("/admin/timetable/active-batches"); }
export async function createTimetableSlot(body)   { return request("/admin/timetable", { method: "POST", body: JSON.stringify(body) }); }
export async function deleteTimetableSlot(id)     { return request(`/admin/timetable/${id}`, { method: "DELETE" }); }
export async function updateTimetableSlot(id, body) { return request(`/admin/timetable/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export async function getStudentTimetable()       { return request("/admin/timetable/student"); }
export async function getTeacherTimetableData()   { return request("/admin/timetable/teacher"); }
export async function getParentTimetable()        { return request("/admin/timetable/parent"); }

// ── Batch Courses (subjects) ──────────────────────────────────────────────────
export async function getBatchCourses(batchId)           { return request(`/admin/batches/${batchId}/courses`); }
export async function addCourseToBatch(batchId, courseId){ return request(`/admin/batches/${batchId}/courses`, { method: "POST", body: JSON.stringify({ courseId }) }); }
export async function removeCourseFromBatch(batchId, courseId) { return request(`/admin/batches/${batchId}/courses/${courseId}`, { method: "DELETE" }); }
export async function enrollCourse(courseId) {
  return request(`/student/enroll/${courseId}`, {
    method: "POST",
  });
}

// ── Chat (Teacher ↔ Parent one-on-one) ───────────────────────────────────────
export async function searchTeachersForChat(q)         { return request(`/parent/chat/search-teachers?q=${encodeURIComponent(q)}`); }
export async function getParentConversations()         { return request("/parent/chat/conversations"); }
export async function getParentChatMessages(teacherId) { return request(`/parent/chat/messages/${teacherId}`); }
export async function sendParentMessage(teacherId, content) {
  return request(`/parent/chat/send/${teacherId}`, { method: "POST", body: JSON.stringify({ content }) });
}
export async function searchParentsForChat(q)          { return request(`/teacher/chat/search-parents?q=${encodeURIComponent(q)}`); }
export async function getTeacherConversations()        { return request("/teacher/chat/conversations"); }
export async function getTeacherChatMessages(parentId) { return request(`/teacher/chat/messages/${parentId}`); }
export async function sendTeacherMessage(parentId, content) {
  return request(`/teacher/chat/send/${parentId}`, { method: "POST", body: JSON.stringify({ content }) });
}

// ── Exam Management (Teacher) ─────────────────────────────────────────────────
export async function getTeacherExams(courseId)        { return request(`/teacher/exams?courseId=${courseId}`); }
export async function createExam(body)                 { return request("/teacher/exams", { method: "POST", body: JSON.stringify(body) }); }
export async function startExam(id, body)              { return request(`/teacher/exams/${id}/start`, { method: "PATCH", body: JSON.stringify(body || {}) }); }
export async function endExam(id)                      { return request(`/teacher/exams/${id}/end`, { method: "PATCH", body: JSON.stringify({}) }); }
export async function postponeExam(id, body)           { return request(`/teacher/exams/${id}/postpone`, { method: "PATCH", body: JSON.stringify(body) }); }
export async function cancelExam(id, body)             { return request(`/teacher/exams/${id}/cancel`, { method: "PATCH", body: JSON.stringify(body) }); }
export async function deleteExam(id)                   { return request(`/teacher/exams/${id}`, { method: "DELETE" }); }
export async function getExamResults(id)               { return request(`/teacher/exams/${id}/results`); }
export async function saveExamEvaluation(id, body)     { return request(`/teacher/exams/${id}/evaluate`, { method: "POST", body: JSON.stringify(body) }); }
export async function finishExamEvaluation(id, body)   { return request(`/teacher/exams/${id}/finish`, { method: "PATCH", body: JSON.stringify(body) }); }
export async function getExamDetail(id) { return request(`/teacher/exams/${id}`); }

// ── Ultra Super Admin ─────────────────────────────────────────────────────────
export async function usaGetStats()                    { return request("/ultra-super-admin/stats"); }
export async function usaGetOrganizations()            { return request("/ultra-super-admin/organizations"); }
export async function usaCreateOrganization(body)      { return request("/ultra-super-admin/organizations", { method:"POST", body:JSON.stringify(body) }); }
export async function usaUpdateOrganization(id, body)  { return request(`/ultra-super-admin/organizations/${id}`, { method:"PUT", body:JSON.stringify(body) }); }
export async function usaToggleOrgActive(id)           { return request(`/ultra-super-admin/organizations/${id}/toggle-active`, { method:"PATCH" }); }
export async function usaGetSuperAdmins()              { return request("/ultra-super-admin/super-admins"); }
export async function usaCreateSuperAdmin(body)        { return request("/ultra-super-admin/super-admins", { method:"POST", body:JSON.stringify(body) }); }
export async function usaToggleAdminActive(id)         { return request(`/ultra-super-admin/admins/${id}/toggle-active`, { method:"PATCH" }); }
// Users scoped by organization — called from USA dashboard
export async function usaGetStudentsByOrg(orgId)       { return request(`/ultra-super-admin/organizations/${orgId}/students`); }
export async function usaGetTeachersByOrg(orgId)       { return request(`/ultra-super-admin/organizations/${orgId}/teachers`); }
export async function usaGetParentsByOrg(orgId)        { return request(`/ultra-super-admin/organizations/${orgId}/parents`); }

// ── Teacher Reviews ──────────────────────────────────────────────────────────
export async function submitTeacherReview(teacherId, rating, reviewText) {
  return request(`/student/teachers/${teacherId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ rating, reviewText })
  });
}
export async function getTeacherPerformanceReviews() {
  return request("/teacher/performance/reviews");
}

// ── Teacher Certifications ───────────────────────────────────────────────────
export async function issueCertificate(body) {
  return request("/teacher/certificates", {
    method: "POST",
    body: JSON.stringify(body)
  });
}
export async function getIssuedCertificates() {
  return request("/teacher/certificates");
}
export async function getStudentCertificates() {
  return request("/student/certificates");
}

// ── Admin Certifications ───────────────────────────────────────────────────
export async function issueAdminCertificate(body) {
  return request("/admin/certificates/issue", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── Course Enrollment Requests ────────────────────────────────────────────────
export async function getStudentEnrollmentRequests() {
  return request("/student/enrollment-requests");
}
export async function requestCourseEnrollment(courseId) {
  return request("/student/enrollment-requests/request", {
    method: "POST",
    body: JSON.stringify({ courseId }),
  });
}
export async function getAdminEnrollmentRequests() {
  return request("/admin/enrollment-requests");
}
export async function approveEnrollmentRequest(id) {
  return request(`/admin/enrollment-requests/${id}/approve`, {
    method: "POST",
  });
}
export async function rejectEnrollmentRequest(id) {
  return request(`/admin/enrollment-requests/${id}/reject`, {
    method: "POST",
  });
}
export async function getAdminTeachersPerformance() {
  return request("/admin/teachers/performance");
}
export async function getAdminTeacherReviews(teacherId) {
  return request(`/admin/teachers/${teacherId}/reviews`);
}

// ── Meetings Management ──────────────────────────────────────────────────────
export async function getMeetings() {
  return request("/meetings");
}
export async function createMeeting(body) {
  return request("/meetings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export async function updateMeeting(id, body) {
  return request(`/meetings/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
export async function cancelMeeting(id, reason) {
  return request(`/meetings/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
export async function deleteMeeting(id) {
  return request(`/meetings/${id}`, {
    method: "DELETE",
  });
}
export async function checkMeetingConflicts(body) {
  return request("/meetings/check-conflicts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export async function submitOpinionResponse(meetingId, responses) {
  return request(`/meetings/${meetingId}/respond`, {
    method: "POST",
    body: JSON.stringify(responses),
  });
}
export async function markMeetingAttendance(meetingId, attendanceList) {
  return request(`/meetings/${meetingId}/attendance`, {
    method: "POST",
    body: JSON.stringify(attendanceList),
  });
}
export async function selfCheckInMeeting(meetingId) {
  return request(`/meetings/${meetingId}/attendance/self`, {
    method: "POST",
  });
}
export async function sendAbsenteeFollowUp(meetingId) {
  return request(`/meetings/${meetingId}/absentees/follow-up`, {
    method: "POST",
  });
}

// ── Feature Management (Ultra Super Admin) ───────────────────────────────────
export async function usaGetFeatures() {
  return request("/ultra-super-admin/features");
}

export async function usaCreateFeature(body) {
  return request("/ultra-super-admin/features", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function usaToggleFeatureActive(id) {
  return request(`/ultra-super-admin/features/${id}/toggle`, {
    method: "PATCH"
  });
}

export async function usaGetOrgFeatures(orgId) {
  return request(`/ultra-super-admin/organizations/${orgId}/features`);
}

export async function usaToggleOrgFeature(orgId, featureId) {
  return request(`/ultra-super-admin/organizations/${orgId}/features/${featureId}/toggle`, {
    method: "POST"
  });
}

// ── Organization Features (Public/Common) ────────────────────────────────────
export async function getOrganizationFeatures(orgId) {
  const res = await fetch(`${API_BASE}/public/organizations/${orgId}/features`);
  const body = await res.json().catch(() => ({}));
  return body.success && Array.isArray(body.data) ? body.data : [];
}

// ── File Upload (Student/Common) ─────────────────────────────────────────────
export async function uploadFile(file) {
  const raw = localStorage.getItem("zenelait-auth");
  let token = null;
  if (raw) {
    try { token = JSON.parse(raw).accessToken; } catch {}
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/student/upload`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || "File upload failed");
  }
  return body.data; // This is the fileDownloadUrl (e.g. /api/public/files/uuid_name)
}

// ── Subscription Package Management (Ultra Super Admin) ──────────────────────
export async function usaGetPackages() {
  return request("/ultra-super-admin/packages");
}

export async function usaCreatePackage(body) {
  return request("/ultra-super-admin/packages", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function usaTogglePackageActive(id) {
  return request(`/ultra-super-admin/packages/${id}/toggle`, {
    method: "PATCH"
  });
}

export async function usaDeletePackage(id) {
  return request(`/ultra-super-admin/packages/${id}`, {
    method: "DELETE"
  });
}

export async function usaGetSubscriptions() {
  return request("/ultra-super-admin/subscriptions");
}

export async function usaAssignSubscription(orgId, packageId) {
  return request("/ultra-super-admin/subscriptions/assign", {
    method: "POST",
    body: JSON.stringify({ organizationId: orgId, packageId })
  });
}

// ── Subscription Plan Management (Super Admin) ────────────────────────────────
export async function adminGetActiveSubscription() {
  return request("/admin/subscription/active");
}

export async function adminGetPackages() {
  return request("/admin/subscription/packages");
}

export async function adminSubscribe(packageId) {
  return request("/admin/subscription/subscribe", {
    method: "POST",
    body: JSON.stringify({ packageId })
  });
}

// ── Revenue Analysis & Expiry Warnings (Ultra Super Admin) ───────────────────
export async function usaGetRevenueAnalysis() {
  return request("/ultra-super-admin/revenue/analysis");
}

export async function usaGetNotifications() {
  return request("/ultra-super-admin/notifications");
}

export async function usaMarkNotifRead(id) {
  return request(`/ultra-super-admin/notifications/${id}/read`, {
    method: "PATCH"
  });
}

export async function usaMarkAllNotifsRead() {
  return request("/ultra-super-admin/notifications/read-all", {
    method: "PATCH"
  });
}

export async function usaTriggerExpiryCheck() {
  return request("/ultra-super-admin/subscriptions/check-expiry", {
    method: "POST"
  });
}

export async function usaSendRenewalReminder(subId) {
  return request(`/ultra-super-admin/subscriptions/${subId}/remind`, {
    method: "POST",
  });
}

export async function forgotPassword(email, role) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function resetPassword(email, role, otp, newPassword) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, role, otp, newPassword }),
  });
}