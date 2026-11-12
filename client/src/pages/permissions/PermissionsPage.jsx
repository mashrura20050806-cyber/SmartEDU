import { useEffect, useState } from 'react';
import PermissionApi from '../../api/permission.api.js';

const actions = [
  ['canView', 'View'],
  ['canWrite', 'Write'],
  ['canModify', 'Modify'],
];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let current = true;
    PermissionApi.list()
      .then(({ permissions: rows }) => {
        if (current) setPermissions(rows);
      })
      .catch((loadError) => {
        if (current) setError(loadError.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  function changePermission(role, module, field, value) {
    setNotice('');
    setPermissions((rows) => rows.map((row) => (
      row.role === role && row.module === module ? { ...row, [field]: value } : row
    )));
  }

  async function savePermission(permission) {
    const key = `${permission.role}:${permission.module}`;
    setSaving(key);
    setError('');
    setNotice('');
    try {
      const { permission: saved } = await PermissionApi.update(
        permission.role,
        permission.module,
        {
          canView: permission.canView,
          canWrite: permission.canWrite,
          canModify: permission.canModify,
        },
      );
      setPermissions((rows) => rows.map((row) => (
        row.role === saved.role && row.module === saved.module ? saved : row
      )));
      setNotice(`${permission.module} permissions for ${permission.role} saved.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving('');
    }
  }

  const roles = [...new Set(permissions.map(({ role }) => role))];

  return (
    <section className="dashboard-page">
      <div className="welcome-row">
        <div>
          <div className="page-kicker">ACCESS CONTROL</div>
          <h1>Role permissions</h1>
          <p className="welcome-subtitle">Choose which school features each role can view, write, or modify.</p>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {loading ? (
        <p className="welcome-subtitle" role="status">Loading permissions…</p>
      ) : (
        <div className="permission-role-list">
          {roles.map((role) => (
            <section className="permission-role-card" key={role}>
              <h2>{role.replaceAll('_', ' ')}</h2>
              <div className="permission-table-wrap">
                <table className="permission-table">
                  <thead>
                    <tr>
                      <th scope="col">Feature</th>
                      {actions.map(([, label]) => <th scope="col" key={label}>{label}</th>)}
                      <th scope="col">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.filter((permission) => permission.role === role).map((permission) => {
                      const key = `${permission.role}:${permission.module}`;
                      return (
                        <tr key={key}>
                          <th scope="row">{permission.module}</th>
                          {actions.map(([field, label]) => (
                            <td key={field}>
                              <label className="permission-checkbox">
                                <input
                                  type="checkbox"
                                  aria-label={`${label} ${permission.module} for ${role}`}
                                  checked={permission[field]}
                                  onChange={(event) => changePermission(
                                    permission.role,
                                    permission.module,
                                    field,
                                    event.target.checked,
                                  )}
                                />
                                <span className="sr-only">{label}</span>
                              </label>
                            </td>
                          ))}
                          <td>
                            <button
                              className="button button-secondary permission-save"
                              type="button"
                              disabled={saving !== '' || saving === key}
                              onClick={() => savePermission(permission)}
                            >
                              {saving === key ? 'Saving…' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}