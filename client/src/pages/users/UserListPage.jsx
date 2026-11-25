import { useEffect, useState } from 'react';
import UserApi from '../../api/user.api.js';
import { useCan } from '../../hooks/useCan.js';

const roles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ASSISTANT', 'STUDENT'];
const statuses = ['PENDING', 'ACTIVE', 'INACTIVE'];
const blankForm = {
  name: '',
  email: '',
  institutionalId: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  phone: '',
};

function roleName(role) {
  return role.replaceAll('_', ' ');
}

export default function UserListPage() {
  const canCreate = useCan('USERS', 'canWrite');
  const canModify = useCan('USERS', 'canModify');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  async function loadUsers() {
    setError('');
    try {
      const data = await UserApi.list();
      setUsers(data.users);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setGeneratedCode('');
    try {
      const data = await UserApi.create({ ...form, phone: form.phone || null });
      setUsers((current) => [...current, data.user].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(blankForm);
      setCreating(false);
      setGeneratedCode(data.generatedCode);
      setNotice(`Created ${data.user.name}. Save the generated login code securely; it is shown only once.`);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  }

  function startEditing(user) {
    setError('');
    setNotice('');
    setGeneratedCode('');
    setEditingId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      institutionalId: user.institutionalId,
      role: user.role,
      status: user.status,
      phone: user.phone || '',
    });
  }

  async function saveUser(userId) {
    setBusy(true);
    setError('');
    setNotice('');
    setGeneratedCode('');
    try {
      const data = await UserApi.update(userId, { ...editForm, phone: editForm.phone || null });
      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)));
      setEditingId('');
      setEditForm(null);
      if (data.generatedCode) {
        setGeneratedCode(data.generatedCode);
        setNotice('Role updated. Save the new login code securely; it is shown only once.');
      } else {
        setNotice('User account updated.');
      }
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy(false);
    }
  }

  const createField = (field, label, type = 'text') => (
    <label className="user-form-field" key={field}>
      <span>{label}</span>
      <input
        type={type}
        required={field !== 'phone'}
        minLength={field === 'password' ? 8 : undefined}
        value={form[field]}
        onChange={(event) => setForm({ ...form, [field]: event.target.value })}
      />
    </label>
  );

  function editInput(field, label, options) {
    return (
      <label className="user-edit-field" key={field}>
        <span className="sr-only">{label}</span>
        {options ? (
          <select value={editForm[field]} onChange={(event) => setEditForm({ ...editForm, [field]: event.target.value })}>
            {options.map((option) => <option key={option} value={option}>{roleName(option)}</option>)}
          </select>
        ) : (
          <input
            value={editForm[field]}
            onChange={(event) => setEditForm({ ...editForm, [field]: event.target.value })}
            aria-label={label}
          />
        )}
      </label>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="welcome-row">
        <div>
          <div className="page-kicker">SCHOOL ACCOUNTS</div>
          <h1>People</h1>
          <p className="welcome-subtitle">Create accounts, update roles, and manage access status.</p>
        </div>
        {canCreate && <button className="button button-primary" type="button" onClick={() => setCreating(!creating)}>
          {creating ? 'Cancel' : 'Add user'}
        </button>}
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {generatedCode && (
        <div className="generated-admin-code">
          <strong>One-time login code</strong>
          <code>{generatedCode}</code>
          <span>Give this code directly to the user. It will not be shown again.</span>
        </div>
      )}
      {creating && canCreate && (
        <form className="user-create-form" onSubmit={createUser}>
          <h2>Create account</h2>
          <div className="user-form-grid">
            {createField('name', 'Full name')}
            {createField('email', 'Email', 'email')}
            {createField('institutionalId', 'School ID')}
            {createField('password', 'Initial password', 'password')}
            {createField('phone', 'Phone number', 'tel')}
            <label className="user-form-field">
              <span>Role</span>
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {roles.map((role) => <option key={role} value={role}>{roleName(role)}</option>)}
              </select>
            </label>
            <label className="user-form-field">
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>
          <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
      )}
      <div className="user-table-wrap">
        {loading ? <p role="status">Loading accounts…</p> : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>School ID</th><th>Role</th><th>Status</th><th>Phone</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  {editingId === user.id ? (
                    <>
                      <td>{editInput('name', 'Name')}</td>
                      <td>{editInput('email', 'Email')}</td>
                      <td>{editInput('institutionalId', 'School ID')}</td>
                      <td>{editInput('role', 'Role', roles)}</td>
                      <td>{editInput('status', 'Status', statuses)}</td>
                      <td>{editInput('phone', 'Phone')}</td>
                      <td className="user-row-actions">
                        <button className="text-button" type="button" disabled={busy} onClick={() => saveUser(user.id)}>Save</button>
                        <button className="text-button" type="button" disabled={busy} onClick={() => setEditingId('')}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{user.name}</td><td>{user.email}</td><td>{user.institutionalId}</td>
                      <td>{roleName(user.role)}</td><td>{user.status}</td><td>{user.phone || '—'}</td>
                      <td>{canModify && <button className="text-button" type="button" onClick={() => startEditing(user)}>Edit</button>}</td>
                    </>
                  )}
                </tr>
              ))}
              {!users.length && <tr><td colSpan="7">No accounts found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}