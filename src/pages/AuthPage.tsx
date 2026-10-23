import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  User,
  UserPlus,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/common/Logo';
import { API_BASE } from '../config/api';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onSuccess: () => void;
  onBackToLanding: () => void;
}

interface SmsNotificationPayload {
  sender: string;
  recipient: string;
  otpCode: string;
  text: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onSuccess,
  onBackToLanding,
}) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // SMS OTP states for Forgot Password
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [smsBanner, setSmsBanner] = useState<SmsNotificationPayload | null>(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async () => {
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your registered email address');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number to receive the SMS OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send SMS OTP.');
      }

      setMaskedPhone(data.maskedPhone || phone);
      if (data.smsNotification) {
        setSmsBanner(data.smsNotification);
      }
      setOtpStep('verify');
      setSuccessMessage(data.message || '6-digit SMS OTP sent to your mobile number.');
    } catch (err: any) {
      setError(err.message || 'Could not send SMS OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (mode === 'forgot') {
      if (otpStep === 'request') {
        await handleRequestOtp();
        return;
      }

      // Step 2: Verify SMS OTP & Change Password
      if (!otpCode.trim() || otpCode.trim().length !== 6) {
        setError('Please enter the 6-digit SMS OTP sent to your mobile number');
        return;
      }
      if (!password || password.length < 8) {
        setError('New password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            phone: phone.trim(),
            otp: otpCode.trim(),
            newPassword: password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Password reset failed.');
        }
        setSuccessMessage(
          data.message || 'SMS OTP verified & password changed! You can now sign in.'
        );
        setPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setSmsBanner(null);
        setOtpStep('request');
        setMode('login');
      } catch (err: any) {
        setError(err.message || 'Failed to reset password.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }
      if (phone.trim() && phone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }
      if (!password) {
        setError('Please choose a password');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!acceptTerms) {
        setError('Please agree to terms and privacy policy');
        return;
      }

      setIsSubmitting(true);
      try {
        await signup(name, email, password, rememberMe, phone);
        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!email.trim()) {
        setError('Please enter your registered email address');
        return;
      }
      if (!password) {
        setError('Please enter your password');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(email, password, rememberMe);
        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Invalid credentials or unregistered account.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative">
      <button
        onClick={onBackToLanding}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Landing</span>
      </button>

      {/* Incoming SMS OTP Notification Banner */}
      {mode === 'forgot' && smsBanner && (
        <div className="w-full max-w-md mb-4 p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <MessageSquareText size={16} />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400">SMS · {smsBanner.sender}</span>
                  <span className="text-[10px] text-slate-400">To: {smsBanner.recipient} · Just now</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Your Money Vedass password reset OTP is{' '}
                  <span className="px-1.5 py-0.5 rounded bg-white/15 font-mono font-bold text-amber-300 tracking-widest">
                    {smsBanner.otpCode}
                  </span>
                  . Valid for 5 minutes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(smsBanner.otpCode)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
            >
              Auto-Fill OTP
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'login'
              ? 'Sign In to Your Account'
              : mode === 'signup'
              ? 'Register New Account'
              : 'Reset Password via SMS OTP'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? 'Enter your registered email and password to access your personal ledger'
              : mode === 'signup'
              ? 'Register your email and mobile number to initialize your private financial record'
              : otpStep === 'request'
              ? 'Enter your registered email and mobile number to receive a 6-digit SMS OTP'
              : `Enter the 6-digit OTP sent to ${maskedPhone} and set your new password`}
          </p>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <span className="font-medium leading-relaxed block">{error}</span>
              {(mode === 'login' || mode === 'forgot') &&
                (error.toLowerCase().includes('no user account') ||
                  error.toLowerCase().includes('create an account') ||
                  error.toLowerCase().includes('no account') ||
                  error.toLowerCase().includes('register') ||
                  error.toLowerCase().includes('not found')) && (
                <div className="pt-2 border-t border-rose-200/70 dark:border-rose-900/50 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">New user or no account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMessage('');
                      setSmsBanner(null);
                      setOtpStep('request');
                      setMode('signup');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>Create an Account →</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajiv Sharma"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                disabled={mode === 'forgot' && otpStep === 'verify'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white disabled:opacity-60"
              />
            </div>
          </div>

          {(mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Mobile Number {mode === 'forgot' ? '(for SMS OTP)' : '(for SMS OTP Recovery)'}
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required={mode === 'forgot'}
                  disabled={mode === 'forgot' && otpStep === 'verify'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {/* Forgot Password Step 2: 6-Digit SMS OTP Input */}
          {mode === 'forgot' && otpStep === 'verify' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Smartphone size={14} className="text-indigo-500" />
                  <span>Enter 6-Digit SMS OTP</span>
                </label>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isSubmitting}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>Resend SMS OTP</span>
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full px-4 py-2.5 text-center text-lg font-mono font-bold tracking-[0.5em] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Password input (shown in login, signup, or step 2 of forgot password) */}
          {(mode !== 'forgot' || otpStep === 'verify') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">
                  {mode === 'forgot' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMessage('');
                      setPassword('');
                      setConfirmPassword('');
                      setOtpCode('');
                      setSmsBanner(null);
                      setOtpStep('request');
                      setMode('forgot');
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot password? (SMS OTP)
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {(mode === 'signup' || (mode === 'forgot' && otpStep === 'verify')) && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                {mode === 'forgot' ? 'Confirm New Password' : 'Confirm Password'}
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span className="text-slate-600 dark:text-slate-400">Remember session on this device</span>
              </label>
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span className="text-slate-600 dark:text-slate-400">
                  I agree to create my private financial record on Money Vedass
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to Private Record'
              : mode === 'signup'
              ? 'Register & Start Tracking'
              : otpStep === 'request'
              ? 'Send 6-Digit SMS OTP'
              : 'Verify SMS OTP & Change Password'}
          </button>

          {mode === 'forgot' && otpStep === 'verify' && (
            <button
              type="button"
              onClick={() => {
                setOtpStep('request');
                setOtpCode('');
                setSmsBanner(null);
                setError('');
                setSuccessMessage('');
              }}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              ← Change Email or Mobile Number
            </button>
          )}
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
          {mode === 'login' ? (
            <p>
              New user?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setMode('signup');
                }}
                className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
              >
                Register your account first
              </button>
            </p>
          ) : (
            <p>
              {mode === 'forgot' ? 'Remembered your password?' : 'Already registered?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setSmsBanner(null);
                  setOtpStep('request');
                  setMode('login');
                }}
                className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
              >
                Sign in to your account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
