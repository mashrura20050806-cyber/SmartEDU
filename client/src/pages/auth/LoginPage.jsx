import { Eye, EyeOff, GraduationCap, LockKeyhole, Mail, TicketCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const roles = [
  ['ADMIN', 'Admin'],
  ['PRINCIPAL', 'Principal'],
  ['TEACHER', 'Teacher'],
  ['CLASS_TEACHER', 'Class Teacher'],
  ['ASSISTANT', 'Assistant'],
  ['STUDENT', 'Student'],
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    password: '',
    phone: '',
    role: location.state?.role || '',
    generatedCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form);
      navigate('/app', { replace: true, state: { role: form.role } });
    } catch (loginError) {
      setError(loginError.status === 401 ? 'Invalid credentials' : loginError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-form-side">
        <div className="auth-mobile-title"><span className="brand-mark"><GraduationCap size={20} /></span><strong>SmartEDU</strong></div>
        <div className="auth-form-wrap">
          <h2>Sign in</h2>
          {location.state?.signupMessage && <div className="form-success signup-success" role="status">{location.state.signupMessage}</div>}
          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email">Email</label>
            <div className="input-wrap"><Mail size={18} /><input id="email" name="email" type="email" autoComplete="email" placeholder="you@school.edu" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
            <div className="password-label-row"><label className="field-label" htmlFor="password">Password</label></div>
            <div className="input-wrap"><LockKeyhole size={18} /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            <label className="field-label spaced-label" htmlFor="login-phone">Mobile number (optional)</label>
            <input className="text-input" id="login-phone" name="phone" type="tel" autoComplete="tel" placeholder="Mobile number on your account" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={30} />
            <label className="field-label spaced-label" htmlFor="login-role">Role</label>
            <select className="role-select login-role-select" id="login-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} required>
              <option value="">Select role</option>
              {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="field-label spaced-label" htmlFor="login-code">Sign-up code</label>
            <div className="input-wrap"><TicketCheck size={18} /><input id="login-code" name="generatedCode" autoComplete="one-time-code" placeholder="Enter the code saved during sign-up" value={form.generatedCode} onChange={(event) => setForm({ ...form, generatedCode: event.target.value.toUpperCase() })} required maxLength={10} /></div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy || !form.role || !form.generatedCode}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="form-divider">New to SmartEDU?</p>
          <Link className="button button-secondary auth-submit" to="/register">Create an account</Link>
        </div>
      </section>
    </main>
  );
}