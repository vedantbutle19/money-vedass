import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.ts';
import { db } from '../server/db.ts';

describe('Authentication & Security Suite', () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test('POST /api/auth/signup - Rejects passwords shorter than 8 characters', async () => {
    const res = await apiRequest('POST', '/api/auth/signup', {
      name: 'Alice ShortPass',
      email: 'alice.short@example.com',
      password: '123',
    });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.error, /Password must be at least 8 characters/);
  });

  test('POST /api/auth/signup - Successfully registers new user with valid password', async () => {
    const res = await apiRequest('POST', '/api/auth/signup', {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '9876543210',
      password: 'SecurePassword123!',
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.token.startsWith('tok_'));
    assert.strictEqual(res.data.user.email, 'alice@example.com');
    assert.strictEqual(res.data.user.name, 'Alice Johnson');
  });

  test('POST /api/auth/signup - Rejects duplicate email registration', async () => {
    const res = await apiRequest('POST', '/api/auth/signup', {
      name: 'Alice Duplicate',
      email: 'alice@example.com',
      password: 'SecurePassword123!',
    });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.error, /already registered/);
  });

  test('POST /api/auth/login - Rejects non-existent user with "No user account found. Please create an account"', async () => {
    const res = await apiRequest('POST', '/api/auth/login', {
      email: 'nonexistent_user@example.com',
      password: 'SomePassword123!',
    });
    assert.strictEqual(res.status, 404);
    assert.match(res.data.error, /No user account found.*create an account/i);
    assert.strictEqual(res.data.userNotFound, true);
  });

  test('POST /api/auth/login - Rejects invalid password', async () => {
    const res = await apiRequest('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'WrongPassword999',
    });
    assert.strictEqual(res.status, 401);
    assert.match(res.data.error, /Invalid password/);
  });

  test('POST /api/auth/login - Successfully logs in registered user', async () => {
    const res = await apiRequest('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'SecurePassword123!',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.token);
  });

  test('GET /api/user/profile - Returns profile with valid token, rejects unauthenticated', async () => {
    // Unauthenticated
    const unauth = await apiRequest('GET', '/api/user/profile');
    assert.strictEqual(unauth.status, 401);

    // Authenticated
    const login = await apiRequest('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'SecurePassword123!',
    });
    const profile = await apiRequest('GET', '/api/user/profile', undefined, login.data.token);
    assert.strictEqual(profile.status, 200);
    assert.strictEqual(profile.data.email, 'alice@example.com');
  });

  test('POST /api/auth/send-otp - Plaintext OTP is NOT exposed in response without dev flag', async () => {
    const res = await apiRequest('POST', '/api/auth/send-otp', {
      email: 'alice@example.com',
      phone: '9876543210',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.smsNotification, undefined, 'Plaintext OTP must not be present in response');
  });

  test('POST /api/auth/reset-password - Locks out after 5 invalid OTP attempts and enforces lockout', async () => {
    // Generate fresh OTP
    await apiRequest('POST', '/api/auth/send-otp', {
      email: 'alice@example.com',
      phone: '9876543210',
    });

    // Attempt 1 with wrong OTP
    const att1 = await apiRequest('POST', '/api/auth/reset-password', {
      email: 'alice@example.com',
      otp: '000000',
      newPassword: 'BrandNewPassword456!',
    });
    assert.strictEqual(att1.status, 400);
    assert.match(att1.data.error, /4 attempt\(s\) remaining/);

    // Attempt 2, 3, 4
    for (let i = 2; i <= 4; i++) {
      await apiRequest('POST', '/api/auth/reset-password', {
        email: 'alice@example.com',
        otp: `00000${i}`,
        newPassword: 'BrandNewPassword456!',
      });
    }

    // Attempt 5 - Maximum attempts reached
    const att5 = await apiRequest('POST', '/api/auth/reset-password', {
      email: 'alice@example.com',
      otp: '000005',
      newPassword: 'BrandNewPassword456!',
    });
    assert.strictEqual(att5.status, 400);
    assert.match(att5.data.error, /Maximum attempts exceeded/);

    // Even if correct OTP is used now, it is invalidated
    const activeOtp = await db.prepare('SELECT otp_code FROM otp_codes WHERE LOWER(email) = ? ORDER BY created_at DESC LIMIT 1').get('alice@example.com') as any;
    const attAfterLockout = await apiRequest('POST', '/api/auth/reset-password', {
      email: 'alice@example.com',
      otp: activeOtp.otp_code,
      newPassword: 'BrandNewPassword456!',
    });
    assert.strictEqual(attAfterLockout.status, 400);
  });

  test('POST /api/auth/reset-password - Successfully resets password with valid OTP and invalidates old sessions', async () => {
    // Get valid session token first
    const preLogin = await apiRequest('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'SecurePassword123!',
    });
    const oldToken = preLogin.data.token;

    // Request fresh OTP
    await apiRequest('POST', '/api/auth/send-otp', {
      email: 'alice@example.com',
      phone: '9876543210',
    });

    const otpRow = await db.prepare('SELECT otp_code FROM otp_codes WHERE LOWER(email) = ? AND used = 0 ORDER BY created_at DESC LIMIT 1').get('alice@example.com') as any;
    assert.ok(otpRow?.otp_code);

    // Reset password with correct OTP
    const resetRes = await apiRequest('POST', '/api/auth/reset-password', {
      email: 'alice@example.com',
      otp: otpRow.otp_code,
      newPassword: 'BrandNewPassword456!',
    });
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetRes.data.success, true);

    // Old session token must now be invalid
    const oldSessionCheck = await apiRequest('GET', '/api/user/profile', undefined, oldToken);
    assert.strictEqual(oldSessionCheck.status, 401);

    // Login with new password must succeed
    const newLogin = await apiRequest('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'BrandNewPassword456!',
    });
    assert.strictEqual(newLogin.status, 200);
  });

  test('POST /api/auth/logout - Invalidates session token', async () => {
    const login = await apiRequest('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'BrandNewPassword456!',
    });
    const token = login.data.token;

    const logout = await apiRequest('POST', '/api/auth/logout', undefined, token);
    assert.strictEqual(logout.status, 200);

    const check = await apiRequest('GET', '/api/user/profile', undefined, token);
    assert.strictEqual(check.status, 401);
  });

  test('POST /api/auth/send-otp - Rejects phone injection and protects accounts without registered phone', async () => {
    // Register user without phone
    const regRes = await apiRequest('POST', '/api/auth/signup', {
      name: 'Bob NoPhone',
      email: 'bob_nophone@example.com',
      password: 'SecurePassword123!',
    });
    assert.strictEqual(regRes.status, 201);

    // Attacker attempts to inject phone number into Bob's account via send-otp
    const attackRes = await apiRequest('POST', '/api/auth/send-otp', {
      email: 'bob_nophone@example.com',
      phone: '9998887776',
    });
    assert.strictEqual(attackRes.status, 400);
    assert.match(attackRes.data.error, /does not have a registered mobile number/);

    // Verify Bob's phone was NOT modified in the database
    const bob = await db.prepare('SELECT phone FROM users WHERE email = ?').get('bob_nophone@example.com') as any;
    assert.strictEqual(bob.phone, '');
  });
test('POST /api/auth/send-otp (Email Channel via Resend) - Sends OTP to registered email and resets password', async () => {
    // 1. Request OTP via email channel (phone is optional)
    const sendRes = await apiRequest('POST', '/api/auth/send-otp', {
      email: 'bob_nophone@example.com',
      channel: 'email',
    });
    assert.strictEqual(sendRes.status, 200);
    assert.strictEqual(sendRes.data.success, true);
    assert.strictEqual(sendRes.data.channel, 'email');
    assert.ok(sendRes.data.message.includes('via Email'));

    // 2. Fetch the generated OTP from database
    const otpRow = await db.prepare('SELECT otp_code FROM otp_codes WHERE LOWER(email) = ? AND used = 0 ORDER BY created_at DESC LIMIT 1').get('bob_nophone@example.com') as any;
    assert.ok(otpRow?.otp_code);

    // 3. Reset password using the Email OTP
    const resetRes = await apiRequest('POST', '/api/auth/reset-password', {
      email: 'bob_nophone@example.com',
      otp: otpRow.otp_code,
      newPassword: 'BrandNewBobPassword789!',
    });
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetRes.data.success, true);

    // 4. Verify login with new password succeeds
    const loginRes = await apiRequest('POST', '/api/auth/login', {
      email: 'bob_nophone@example.com',
      password: 'BrandNewBobPassword789!',
    });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.data.token);
  });
});
