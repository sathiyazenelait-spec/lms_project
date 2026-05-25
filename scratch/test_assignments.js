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

  // Query student assignments
  try {
    const res = await fetch("http://localhost:8080/api/student/assignments", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("Student Assignments Status:", res.status);
    const data = await res.json();
    console.log("Student Assignments Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Student Assignments request failed:", e);
  }
}
run().catch(console.error);
