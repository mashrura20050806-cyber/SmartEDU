import { Copy, Eye, EyeOff, GraduationCap, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiClient from '../../api/ApiClient.js';
import { useAuth } from '../../hooks/useAuth.js';

const roles = [
  ['ADMIN', 'Admin'],
  ['PRINCIPAL', 'Principal'],
  ['TEACHER', 'Teacher'],
  ['CLASS_TEACHER', 'Class Teacher'],
  ['ASSISTANT', 'Assistant'],
  ['STUDENT', 'Student'],
];

const initialForm = {
  name: '', institutionalId: '', phone: '', guardianPhone: '', rollNumber: '',
  classId: '', sectionId: '', email: '', password: '', confirmPassword: '',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [reservation, setReservation] = useState(null);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const requestNumber = useRef(0);

  useEffect(() => {
    ApiClient.get('/auth/registration-options')
      .then(({ classes: options }) => setClasses(options))
      .catch((loadError) => setError(loadError.message));
  }, []);

  async function generateCode(selectedRole) {
    const currentRequest = ++requestNumber.current;
    setReservation(null);
    setError('');
    setCopyMessage('');
    if (!selectedRole) return;

    try {
      const generated = await ApiClient.post('/auth/generate-code', { role: selectedRole });
      if (currentRequest === requestNumber.current) setReservation(generated);
    } catch (generationError) {
      if (currentRequest === requestNumber.current) setError(generationError.message);
    }
  }

  useEffect(() => () => {
    requestNumber.current += 1;
  }, []);

  function handleRoleChange(event) {
    const selectedRole = event.target.value;
    setRole(selectedRole);
    setMessage('');
    setError('');
    generateCode(selectedRole);
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage('');
  }

  const validForm = Boolean(
    role
    && reservation?.code
    && reservation?.reservationId
    && form.name.trim().length >= 2
    && form.institutionalId.trim()
    && form.phone.trim().length >= 7
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    && form.password.length >= 8
    && form.password === form.confirmPassword
    && (role !== 'STUDENT' || (
      form.rollNumber.trim()
      && form.guardianPhone.trim().length >= 7
      && form.classId
      && form.sectionId
    )),
  );

  async function handleCopyCode() {
    if (!reservation?.code) return;
    try {
      await navigator.clipboard.writeText(reservation.code);
      setCopyMessage('Code copied.');
    } catch {
      setCopyMessage('Could not access the clipboard. Select and copy the code manually.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validForm || busy) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { guardianPhone, rollNumber, classId, sectionId, ...accountForm } = form;
      const result = await register({
        ...accountForm,
        ...(role === 'STUDENT' ? { guardianPhone, rollNumber, classId, sectionId } : {}),
        role,
        codeReservationId: reservation.reservationId,
        generatedCode: reservation.code,
      });
      navigate('/login', {
        replace: true,
        state: {
          signupMessage: result.message,
          email: form.email,
          role,
        },
      });
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-form-side">
        <div className="auth-mobile-title"><span className="brand-mark"><GraduationCap size={20} /></span><strong>SmartEDU</strong></div>
        <div className="auth-form-wrap register-form-wrap">
          <Link to="/login" className="back-link">Back to sign in</Link>
          <h2 className="signup-heading">Create account
            <select className="role-select signup-role-select" aria-label="Sign up as" value={role} onChange={handleRoleChange} required>
              <option value="">Select role</option>
              {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </h2>
          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="generated-code">Sign-up code</label>
            <div className="generated-code-row">
              <input className="text-input code-input" id="generated-code" value={reservation?.code || ''} placeholder={role ? 'Generating secure code…' : 'Select a role to generate your code'} readOnly aria-describedby="code-note" />
              <button className="button button-secondary code-copy" type="button" onClick={handleCopyCode} disabled={!reservation?.code} aria-label="Copy generated code"><Copy size={16} /><span>Copy</span></button>
            </div>
            <div className="code-help-row"><small id="code-note" className="field-help">Save this code for sign-in.</small>{role && <button className="text-button" type="button" onClick={() => generateCode(role)} disabled={busy}><RefreshCw size={13} /> Generate new code</button>}</div>
            {copyMessage && <div className="copy-message" role="status">{copyMessage}</div>}

            <label className="field-label spaced-label" htmlFor="name">Full Name</label>
            <input className="text-input" id="name" name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={updateField} required minLength={2} maxLength={100} />
            <label className="field-label spaced-label" htmlFor="institutionalId">Institutional ID</label>
            <input className="text-input" id="institutionalId" name="institutionalId" placeholder="Your school ID" value={form.institutionalId} onChange={updateField} required maxLength={50} />
            <label className="field-label spaced-label" htmlFor="register-phone">Mobile number</label>
            <input className="text-input" id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder="Your mobile number" value={form.phone} onChange={updateField} required minLength={7} maxLength={30} />
            {role === 'STUDENT' && (
              <>
                <label className="field-label spaced-label" htmlFor="student-roll">Roll number</label>
                <input className="text-input" id="student-roll" name="rollNumber" placeholder="Roll number in your section" value={form.rollNumber} onChange={updateField} required maxLength={30} />
                <label className="field-label spaced-label" htmlFor="guardian-phone">Guardian phone number</label>
                <input className="text-input" id="guardian-phone" name="guardianPhone" type="tel" autoComplete="tel" placeholder="Guardian mobile number" value={form.guardianPhone} onChange={updateField} required minLength={7} maxLength={30} />
                <label className="field-label spaced-label" htmlFor="student-class">Class</label>
                <select className="role-select" id="student-class" value={form.classId} onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value, sectionId: '' }))} required>
                  <option value="">Select class</option>
                  {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} · {schoolClass.academicYear}</option>)}
                </select>
                <label className="field-label spaced-label" htmlFor="student-section">Section</label>
                <select className="role-select" id="student-section" name="sectionId" value={form.sectionId} onChange={updateField} required disabled={!form.classId}>
                  <option value="">Select section</option>
                  {(classes.find((schoolClass) => schoolClass.id === form.classId)?.sections || []).map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
                </select>
                {!classes.length && <div className="approval-note">No classes are available for registration yet. Ask an administrator to set up classes and sections.</div>}
              </>
            )}
            <label className="field-label spaced-label" htmlFor="register-email">Email</label>
            <input className="text-input" id="register-email" name="email" type="email" autoComplete="email" placeholder="you@school.edu" value={form.email} onChange={updateField} required maxLength={254} />
            <label className="field-label spaced-label" htmlFor="register-password">Password</label>
            <div className="input-wrap register-password-wrap">
              <input id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} placeholder="At least 8 characters" value={form.password} onChange={updateField} required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <label className="field-label spaced-label" htmlFor="confirm-password">Confirm Password</label>
            <div className="input-wrap register-password-wrap">
              <input id="confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Re-enter your password" value={form.confirmPassword} onChange={updateField} required />
              <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && <div className="field-help field-validation" role="status">Passwords do not match.</div>}
            {error && <div className="form-error" role="alert">{error}</div>}
            {message && <div className="form-success" role="status">{message}</div>}
            {role && role !== 'STUDENT' && <div className="approval-note">Staff and administrator accounts need approval from an existing administrator before sign-in.</div>}
            <button className="button button-primary auth-submit register-submit" type="submit" disabled={!validForm || busy}>{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
