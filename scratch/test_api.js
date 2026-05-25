async function run() {
  const loginRes = await fetch("http://localhost:8080/api/auth/student/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "zenelaitinfotech@gmail.com", password: "password123" })
  });
  const loginData = await loginRes.json();
  console.log("Login Status:", loginData.success);
  if (!loginData.success) {
    console.error("Login Failed:", loginData.message);
    return;
  }
  const token = loginData.data.accessToken;
  console.log("Token acquired!");

  // Query batches
  try {
    const res = await fetch("http://localhost:8080/api/student/batches", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("Student Batches Status:", res.status);
    const data = await res.json();
    console.log("Student Batches Data success:", data.success);
  } catch (e) {
    console.error("Batches request failed:", e);
  }

  // Query courses
  try {
    const res = await fetch("http://localhost:8080/api/student/courses", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("Student Courses Status:", res.status);
    const data = await res.json();
    console.log("Student Courses Data success:", data.success);
  } catch (e) {
    console.error("Courses request failed:", e);
  }

  // Query enrollment requests
  try {
    const res = await fetch("http://localhost:8080/api/student/enrollment-requests", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("Student Enrollment Requests Status:", res.status);
    const data = await res.json();
    console.log("Student Enrollment Requests Data success:", data.success);
  } catch (e) {
    console.error("Enrollment Requests request failed:", e);
  }
}
run().catch(console.error);
