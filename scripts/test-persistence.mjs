const GATEWAY_URL = "http://localhost:8888/api/v1";

const step = process.argv[2]; // "register" or "verify"
const timestamp = process.argv[3] || Date.now().toString().slice(-6);

const user = {
  firstName: "KiemThu",
  lastName: "Bending",
  userName: `persist_test_${timestamp}`,
  email: `persist_${timestamp}@workgo.vn`,
  phone: `09${timestamp.padStart(8, '0')}`,
  password: "PersistPass123!"
};

async function main() {
  if (step === "register") {
    console.log(`[REGISTER] Registering user: ${user.userName} (${user.email})...`);
    const regRes = await fetch(`${GATEWAY_URL}/identity/users/registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    const regData = await regRes.json();
    console.log(`[REGISTER] HTTP ${regRes.status}, code: ${regData.code}`);
    if (regRes.status !== 200 || regData.code !== 1000) {
      console.error("[REGISTER] Failed to register:", regData);
      process.exit(1);
    }

    console.log(`[LOGIN-1] Testing initial login with username...`);
    const loginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: user.userName, password: user.password })
    });
    const loginData = await loginRes.json();
    console.log(`[LOGIN-1] HTTP ${loginRes.status}, authenticated: ${loginData.result?.authenticated}`);
    if (!loginData.result?.authenticated) {
      console.error("[LOGIN-1] Initial login failed:", loginData);
      process.exit(1);
    }
    console.log(`SUCCESS: User registered and initial login passed. Timestamp: ${timestamp}`);
  } else if (step === "verify") {
    console.log(`[VERIFY-USERNAME] Testing login with username: ${user.userName}...`);
    const userLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: user.userName, password: user.password })
    });
    const userLoginData = await userLoginRes.json();
    console.log(`[VERIFY-USERNAME] HTTP ${userLoginRes.status}, authenticated: ${userLoginData.result?.authenticated}`);

    console.log(`[VERIFY-EMAIL] Testing login with email: ${user.email}...`);
    const emailLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: user.email, password: user.password })
    });
    const emailLoginData = await emailLoginRes.json();
    console.log(`[VERIFY-EMAIL] HTTP ${emailLoginRes.status}, authenticated: ${emailLoginData.result?.authenticated}`);

    if (userLoginRes.status === 200 && userLoginData.result?.authenticated &&
        emailLoginRes.status === 200 && emailLoginData.result?.authenticated) {
      console.log(`PERSISTENCE TEST PASSED: User persisted through service restart!`);
      process.exit(0);
    } else {
      console.error(`PERSISTENCE TEST FAILED! User lost after restart!`);
      process.exit(1);
    }
  } else {
    console.error("Unknown step:", step);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
