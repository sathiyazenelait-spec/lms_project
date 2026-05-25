async function testRecharge() {
  // 1. Login as parent
  const loginRes = await fetch("http://localhost:8080/api/auth/parent/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "seelan@gmail.com", password: "password123" })
  });
  
  const loginData = await loginRes.json();
  console.log("Login Success:", loginData.success);
  if (!loginData.success) {
    console.error("Login Error:", loginData.message);
    return;
  }
  
  const token = loginData.data.accessToken;
  console.log("Acquired JWT Token:", token);
  
  // 2. Call parent/wallet/add-balance
  const rechargeRes = await fetch("http://localhost:8080/api/parent/wallet/add-balance", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 5000,
      transactionId: "pay_SryYPsDyvmd4j4",
      notes: "Test Recharge"
    })
  });
  
  const rechargeData = await rechargeRes.json();
  console.log("Recharge Status:", rechargeRes.status);
  console.log("Recharge Response:", JSON.stringify(rechargeData, null, 2));
}

testRecharge().catch(console.error);
