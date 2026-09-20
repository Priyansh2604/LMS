const BASE_URL = process.env.API_URL || 'http://localhost:5000';

function request(method, path, body) {
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(body ? {} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (response) => {
    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  });
}

async function assertStep(label, condition, details) {
  if (!condition) {
    throw new Error(`${label} failed: ${JSON.stringify(details)}`);
  }
}

async function main() {
  const email = `auth.check.${Date.now()}@example.com`;
  const userPayload = {
    name: 'Auth Flow Tester',
    email,
    password: 'Password123',
    courseInterest: 'Development',
    city: 'Bengaluru',
    location: 'India',
    role: 'learner',
  };

  const registerResult = await request('POST', '/api/auth/register', userPayload);
  console.log('\n[1] Register');
  console.log(JSON.stringify(registerResult, null, 2));

  await assertStep('register status', registerResult.status === 201, registerResult);
  await assertStep('register user', registerResult.data?.user?.email === email, registerResult.data);

  const loginResult = await request('POST', '/api/auth/login', {
    email,
    password: 'Password123',
    role: 'learner',
  });
  console.log('\n[2] Login');
  console.log(JSON.stringify(loginResult, null, 2));

  await assertStep('login status', loginResult.status === 200, loginResult);
  await assertStep('login user role', loginResult.data?.user?.role === 'learner', loginResult.data);

  const accountResult = await request('GET', `/api/account/${loginResult.data.user.id}`);
  console.log('\n[3] Fetch account');
  console.log(JSON.stringify(accountResult, null, 2));

  await assertStep('account status', accountResult.status === 200, accountResult);
  await assertStep('account user id', accountResult.data?.user?.id === loginResult.data.user.id, accountResult.data);

  const coursesResult = await request('GET', '/api/courses');
  console.log('\n[4] List courses');
  console.log(JSON.stringify(coursesResult, null, 2));

  await assertStep('courses status', coursesResult.status === 200, coursesResult);
  await assertStep('courses array', Array.isArray(coursesResult.data?.courses), coursesResult.data);

  const badLogin = await request('POST', '/api/auth/login', {
    email,
    password: 'WrongPassword',
    role: 'learner',
  });
  console.log('\n[5] Invalid login');
  console.log(JSON.stringify(badLogin, null, 2));

  await assertStep('invalid login rejected', badLogin.status === 401, badLogin);

  console.log('\nAuth flow check passed successfully.');
}

main().catch((error) => {
  console.error('\nAuth flow check failed.');
  console.error(error.message);
  process.exit(1);
});
