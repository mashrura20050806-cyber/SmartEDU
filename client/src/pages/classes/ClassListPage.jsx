import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ClassApi from '../../api/class.api.js';
import { useCan } from '../../hooks/useCan.js';

const currentYear = new Date().getFullYear();
const blankForm = { name: '', grade: '', academicYear: `${currentYear}-${currentYear + 1}` };

export default function ClassListPage() {
  const canCreate = useCan('CLASSES', 'canWrite');
  const canModify = useCan('CLASSES', 'canModify');
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(blankForm);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [setupYear, setSetupYear] = useState(blankForm.academicYear);

  useEffect(() => {
    ClassApi.list()
      .then(({ classes: rows }) => setClasses(rows))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  async function createClass(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { schoolClass } = await ClassApi.create({
        ...form,
        grade: form.grade ? Number(form.grade) : null,
      });
      setClasses((rows) => [...rows, { ...schoolClass, sections: [], subjects: [] }]);
      setForm(blankForm);
      setCreating(false);
      setNotice('Class created.');
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  }

  async function setupStandardClasses() {
    setBusy(true);
    setError('');
    try {
      await ClassApi.setupStandard(setupYear);
      const { classes: latestClasses } = await ClassApi.list();
      setClasses(latestClasses);
      setNotice(`Classes 1-10 and SEC-A/SEC-B sections are ready for ${setupYear}.`);
    } catch (setupError) {
      setError(setupError.message);
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(schoolClass) {
    setEditingId(schoolClass.id);
    setEditForm({
      name: schoolClass.name,
      grade: schoolClass.grade ?? '',
      academicYear: schoolClass.academicYear,
    });
    setError('');
    setNotice('');
  }

  async function saveClass(id) {
    setBusy(true);
    setError('');
    try {
      const { schoolClass } = await ClassApi.update(id, {
        ...editForm,
        grade: editForm.grade === '' ? null : Number(editForm.grade),
      });
      setClasses((rows) => rows.map((row) => (row.id === id ? { ...row, ...schoolClass } : row)));
      setEditingId('');
      setNotice('Class updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dashboard-page">
      <div className="welcome-row">
        <div>
          <div className="page-kicker">ACADEMIC ORGANIZATION</div>
          <h1>Classes</h1>
          <p className="welcome-subtitle">View classes relevant to your role and organize them by academic year.</p>
        </div>
        <div className="class-page-actions">
          <Link className="button button-secondary" to="/app/sections">Manage sections</Link>
          {canCreate && <>
            <input className="text-input" aria-label="Academic year for standard classes" value={setupYear} onChange={(event) => setSetupYear(event.target.value)} maxLength="20" />
            <button className="button button-secondary" type="button" onClick={setupStandardClasses} disabled={busy || setupYear.trim().length < 4}>Set up Classes 1-10</button>
          </>}
          {canCreate && <button className="button button-primary" type="button" onClick={() => setCreating(!creating)}>{creating ? 'Cancel' : 'Add class'}</button>}
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {creating && canCreate && (
        <form className="user-create-form" onSubmit={createClass}>
          <h2>Create class</h2>
          <div className="user-form-grid">
            <label className="user-form-field"><span>Class name</span><input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="user-form-field"><span>Grade (optional)</span><input type="number" min="1" max="12" value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} /></label>
            <label className="user-form-field"><span>Academic year</span><input required maxLength="20" value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} /></label>
          </div>
          <button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Create class'}</button>
        </form>
      )}
      {loading ? <p role="status">Loading classes…</p> : (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead><tr><th>Class</th><th>Grade</th><th>Academic year</th><th>Sections</th><th>Subjects</th>{canModify && <th>Action</th>}</tr></thead>
            <tbody>
              {classes.map((schoolClass) => (
                <tr key={schoolClass.id}>
                  {editingId === schoolClass.id ? (
                    <>
                      <td><input aria-label="Class name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></td>
                      <td><input aria-label="Grade" type="number" min="1" max="12" value={editForm.grade} onChange={(event) => setEditForm({ ...editForm, grade: event.target.value })} /></td>
                      <td><input aria-label="Academic year" value={editForm.academicYear} onChange={(event) => setEditForm({ ...editForm, academicYear: event.target.value })} /></td>
                      <td>{schoolClass.sections?.length ?? 0}</td><td>{schoolClass.subjects?.length ?? 0}</td>
                      <td className="user-row-actions">
                        <button className="text-button" type="button" disabled={busy} onClick={() => saveClass(schoolClass.id)}>Save</button>
                        <button className="text-button" type="button" onClick={() => setEditingId('')}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{schoolClass.name}</td><td>{schoolClass.grade ?? '—'}</td><td>{schoolClass.academicYear}</td>
                      <td>{schoolClass.sections?.length ?? schoolClass._count?.sections ?? 0}</td>
                      <td>{schoolClass.subjects?.length ?? schoolClass._count?.subjects ?? 0}</td>
                      {canModify && <td><button className="text-button" type="button" onClick={() => beginEdit(schoolClass)}>Edit</button></td>}
                    </>
                  )}
                </tr>
              ))}
              {!classes.length && <tr><td colSpan={canModify ? 6 : 5}>No relevant classes found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}