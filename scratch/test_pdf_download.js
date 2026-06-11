async function run() {
  const loginRes = await fetch("http://localhost:8080/api/auth/teacher/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mani@gmail.com", password: "password123" })
  });
  const loginData = await loginRes.json();
  console.log("Login Success:", loginData.success);
  if (!loginData.success) {
    console.error("Login Failed:", loginData.message);
    return;
  }
  const token = loginData.data.accessToken;

  // Let's call download endpoint for June 2026 (month format 2026-06)
  const res = await fetch("http://localhost:8080/api/teacher/courses/20/attendance/download?month=2026-06", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Response status:", res.status);
  if (!res.ok) {
    const text = await res.text();
    console.error("Download failed response text:", text);
  } else {
    console.log("Download succeeded! Content type:", res.headers.get("content-type"));
  }
}
run().catch(console.error);
