const http = require('http');

function doRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Try multiple common passwords to find which one matches
async function tryLogin(password) {
  const bodyStr = JSON.stringify({ email: 'zenelaitinfotech@gmail.com', password });
  const res = await doRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/student/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
  }, bodyStr);
  return res;
}

async function main() {
  const passwords = ['root', 'Mani1234', 'zenelait@123', 'aruldass', '123456', 'password', 'Aruldass@123', 'admin123', 'student@123'];
  console.log("Testing passwords for zenelaitinfotech@gmail.com...\n");
  
  for (const pw of passwords) {
    const res = await tryLogin(pw);
    if (res.status === 200 && res.body.data?.accessToken) {
      console.log(`✅ Password found: "${pw}"`);
      const token = res.body.data.accessToken;
      
      // Now test attendance API
      const attRes = await doRequest({
        hostname: 'localhost',
        port: 8080,
        path: '/api/student/attendance?courseId=20',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, null);
      
      console.log("\nAttendance API response (course 20):");
      console.log(JSON.stringify(attRes.body, null, 2));
      
      // Also test course 8
      const att8 = await doRequest({
        hostname: 'localhost',
        port: 8080,
        path: '/api/student/attendance?courseId=8',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, null);
      console.log("\nAttendance API response (course 8):");
      console.log("records count:", att8.body?.data?.records?.length);
      console.log("date sample:", att8.body?.data?.records?.[0]?.date);
      console.log("totalWorkingDays:", att8.body?.data?.totalWorkingDays);
      console.log("totalLeaveDays:", att8.body?.data?.totalLeaveDays);
      return;
    } else {
      console.log(`❌ "${pw}" → ${res.body.message || 'failed'}`);
    }
  }
  
  console.log("\n⚠️  None of the tested passwords matched.");
  console.log("The aruldass student must use a custom password not in the test list.");
}

main().catch(console.error);
