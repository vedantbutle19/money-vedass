import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db, createInitialUserAccounts } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Password hashing helpers using built-in node:crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }
  const [salt, key] = storedHash.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
  } catch {
    return false;
  }
}

// Helper to create a 30-day session token
function createSession(userId: string, email: string): string {
  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO sessions (token, user_id, email, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, email, expiresAt);
  return token;
}

// POST /api/auth/signup - Register new user first
router.post('/signup', (req, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = typeof phone === 'string' ? phone.replace(/\s+/g, '').trim() : '';

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;
    if (existing) {
      return res.status(400).json({
        error: 'An account with this email is already registered. Please sign in instead.',
      });
    }

    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const today = new Date().toISOString().split('T')[0];
    const passwordHash = hashPassword(password);

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Insert User
      db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, currency, currency_symbol, date_format, monthly_income_baseline, joined_date)
        VALUES (?, ?, ?, ?, ?, 'INR', '₹', 'DD/MM/YYYY', 0, ?)
      `).run(userId, cleanName, cleanEmail, cleanPhone, passwordHash, today);

      // 2. Provision initial clean accounts for this specific user
      createInitialUserAccounts(userId);

      // 3. Create welcome notification
      const notifId = `notif_${Date.now()}`;
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, timestamp, read)
        VALUES (?, ?, 'Welcome to Money Vedass', 'Your private financial ledger is set up. All records are secured to your registered email.', 'info', 'Just now', 0)
      `).run(notifId, userId);

      // 4. Create active session token
      const token = createSession(userId, cleanEmail);

      db.exec('COMMIT;');

      res.status(201).json({
        success: true,
        token,
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          currency: 'INR',
          currencySymbol: '₹',
          dateFormat: 'DD/MM/YYYY',
          monthlyIncomeBaseline: 0,
          joinedDate: today,
        },
      });
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - Strict login (unknown users rejected)
router.post('/login', (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up registered user
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;
    if (!user) {
      return res.status(404).json({
        error: 'No account registered with this email. Please register first to use Money Vedass.',
      });
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        error: 'Invalid password. Please check your password and try again.',
      });
    }

    // Issue session token
    const token = createSession(user.id, user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        currency: user.currency || 'INR',
        currencySymbol: user.currency_symbol || '₹',
        dateFormat: user.date_format || 'DD/MM/YYYY',
        monthlyIncomeBaseline: Number(user.monthly_income_baseline || 0),
        joinedDate: user.joined_date,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to mask phone number for display (e.g., +91 ••••••4321)
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return phone;
  return `••••••${digits.slice(-4)}`;
}

// POST /api/auth/send-otp - Generate & send 6-digit SMS OTP for password reset
router.post('/send-otp', async (req, res: Response) => {
  try {
    const { email, phone } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Registered email address is required' });
    }
    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number for SMS OTP' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\s+/g, '').trim();
    const inputDigits = cleanPhone.replace(/\D/g, '').slice(-10);

    const user = db.prepare('SELECT id, name, email, phone FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;
    if (!user) {
      return res.status(404).json({
        error: 'No account registered with this email address. Please register first.',
      });
    }

    // If the user already has a phone number saved, verify last 10 digits match
    if (user.phone && user.phone.replace(/\D/g, '').length >= 10) {
      const savedDigits = user.phone.replace(/\D/g, '').slice(-10);
      if (savedDigits !== inputDigits) {
        return res.status(400).json({
          error: `Mobile number does not match the registered phone ending in ${savedDigits.slice(-4)}.`,
        });
      }
    } else {
      // Save phone number for existing user who registered before phone field was added
      db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(cleanPhone, user.id);
    }

    // Invalidate any previous unused OTPs for this email
    db.prepare('UPDATE otp_codes SET used = 1 WHERE LOWER(email) = ? AND used = 0').run(cleanEmail);

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpId = `otp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    db.prepare(`
      INSERT INTO otp_codes (id, user_id, email, phone, otp_code, expires_at, used)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(otpId, user.id, cleanEmail, cleanPhone, otpCode, expiresAt);

    const smsText = `[Money Vedass] Your SMS OTP to reset password for ${cleanEmail} is ${otpCode}. Valid for 5 minutes. Do not share this code.`;
    console.log(`📱 SMS OTP Dispatch -> To: ${cleanPhone} | Message: ${smsText}`);

    // Optional real SMS dispatch if FAST2SMS_API_KEY is configured in environment
    let externalGatewaySent = false;
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'v3',
            sender_id: 'TXTIND',
            message: smsText,
            language: 'english',
            flash: 0,
            numbers: inputDigits,
          }),
        });
        externalGatewaySent = smsRes.ok;
      } catch (e) {
        console.warn('External SMS gateway error, falling back to built-in SMS simulator:', e);
      }
    }

    res.json({
      success: true,
      maskedPhone: maskPhone(cleanPhone),
      expiresInSeconds: 300,
      externalGatewaySent,
      // Provide simulated SMS notification payload so user receives OTP immediately on-screen
      smsNotification: {
        sender: 'VM-MNYVDS',
        recipient: cleanPhone,
        otpCode,
        text: smsText,
      },
      message: `6-digit SMS OTP sent to mobile ${maskPhone(cleanPhone)}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password - Verify SMS OTP and reset password for a registered email
router.post('/reset-password', (req, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Registered email address is required' });
    }
    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({ error: 'Valid 6-digit SMS OTP is required' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const user = db.prepare('SELECT id, email FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;
    if (!user) {
      return res.status(404).json({
        error: 'No account registered with this email address. Please register first.',
      });
    }

    // Verify OTP in database
    const otpRecord = db.prepare(`
      SELECT * FROM otp_codes
      WHERE LOWER(email) = ? AND otp_code = ? AND used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(cleanEmail, cleanOtp) as any;

    if (!otpRecord) {
      return res.status(400).json({
        error: 'Invalid SMS OTP code. Please check the 6-digit OTP and try again.',
      });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otpRecord.id);
      return res.status(400).json({
        error: 'SMS OTP has expired. Please request a new OTP.',
      });
    }

    // Mark OTP as used and update user password
    const passwordHash = hashPassword(newPassword);
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otpRecord.id);
      db.prepare(`
        UPDATE users
        SET password_hash = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(passwordHash, user.id);
      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    res.json({
      success: true,
      message: 'SMS OTP verified & password changed successfully! Please sign in with your new password.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout - Invalidate session token
router.post('/logout', (req, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/profile - Get currently authenticated user's profile
router.get('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(req.user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile - Update currently authenticated user's profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, currency, currencySymbol, dateFormat, monthlyIncomeBaseline } = req.body;
    const currentUser = req.user!;

    const updatedName = name ?? currentUser.name;
    const updatedEmail = email ? email.trim().toLowerCase() : currentUser.email;
    const updatedPhone = phone !== undefined ? String(phone).trim() : (currentUser.phone || '');
    const updatedCurrency = currency ?? currentUser.currency;
    const updatedSymbol = currencySymbol ?? (currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹');
    const updatedFormat = dateFormat ?? currentUser.dateFormat;
    const updatedIncome = monthlyIncomeBaseline !== undefined ? Number(monthlyIncomeBaseline) : currentUser.monthlyIncomeBaseline;

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, phone = ?, currency = ?, currency_symbol = ?, date_format = ?, monthly_income_baseline = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(updatedName, updatedEmail, updatedPhone, updatedCurrency, updatedSymbol, updatedFormat, updatedIncome, currentUser.id);

    res.json({
      id: currentUser.id,
      name: updatedName,
      email: updatedEmail,
      phone: updatedPhone,
      currency: updatedCurrency,
      currencySymbol: updatedSymbol,
      dateFormat: updatedFormat,
      monthlyIncomeBaseline: updatedIncome,
      joinedDate: currentUser.joinedDate,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
