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

  const res = await fetch("http://localhost:8080/api/teacher/courses/20/attendance", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("Attendance response data:", JSON.stringify(data, null, 2));
}
run().catch(console.error);
