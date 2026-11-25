import { useEffect, useState } from 'react';
import ClassApi from '../../api/class.api.js';
import SubjectApi from '../../api/subject.api.js';
import { useCan } from '../../hooks/useCan.js';

const emptyForm = { name: '', code: '', classId: '', mt1MaxMarks: '100', hyMaxMarks: '100', mt2MaxMarks: '100' };

export default function SubjectManagerPage() {
  const canCreate = useCan('SUBJECTS', 'canWrite');
  const canModify = useCan('SUBJECTS', 'canModify');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState('');
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([ClassApi.list(), SubjectApi.list()])
      .then(([classData, subjectData]) => {
        setClasses(classData.classes);
        setSubjects(subjectData.subjects);
        if (classData.classes.length) setForm((current) => ({ ...current, classId: classData.classes[0].id }));
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  async function createSubject(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { subject } = await SubjectApi.create({
        ...form,
        code: form.code || null,
        mt1MaxMarks: Number(form.mt1MaxMarks),
        hyMaxMarks: Number(form.hyMaxMarks),
        mt2MaxMarks: Number(form.mt2MaxMarks),
      });
      setSubjects((rows) => [...rows, subject].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((current) => ({ ...emptyForm, classId: current.classId }));
      setNotice('Subject added to the selected class.');
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(subject) {
    setEditId(subject.id);
    setEditForm({
      name: subject.name, code: subject.code || '', classId: subject.classId,
      mt1MaxMarks: String(subject.mt1MaxMarks), hyMaxMarks: String(subject.hyMaxMarks),
      mt2MaxMarks: String(subject.mt2MaxMarks),
    });
    setNotice('');
    setError('');
  }

  async function saveSubject(id) {
    setBusy(true);
    setError('');
    try {
      const { subject } = await SubjectApi.update(id, {
        ...editForm,
        code: editForm.code || null,
        mt1MaxMarks: Number(editForm.mt1MaxMarks),
        hyMaxMarks: Number(editForm.hyMaxMarks),
        mt2MaxMarks: Number(editForm.mt2MaxMarks),
      });
      setSubjects((rows) => rows.map((row) => (row.id === id ? { ...row, ...subject } : row)));
      setEditId('');
      setNotice('Subject information updated.');
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
          <h1>Subjects</h1>
          <p className="welcome-subtitle">Browse subjects for your role or associate subjects with a class.</p>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {canCreate && (
        <form className="user-create-form" onSubmit={createSubject}>
          <h2>Add a subject</h2>
          <div className="user-form-grid">
            <label className="user-form-field"><span>Subject name</span><input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="user-form-field"><span>Code (optional)</span><input maxLength="30" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label>
            <label className="user-form-field"><span>Class</span><select required value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })}>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} · {schoolClass.academicYear}</option>)}</select></label>
            <label className="user-form-field"><span>MT1 maximum</span><input required type="number" min="0.01" step="any" value={form.mt1MaxMarks} onChange={(event) => setForm({ ...form, mt1MaxMarks: event.target.value })} /></label>
            <label className="user-form-field"><span>HY maximum</span><input required type="number" min="0.01" step="any" value={form.hyMaxMarks} onChange={(event) => setForm({ ...form, hyMaxMarks: event.target.value })} /></label>
            <label className="user-form-field"><span>MT2 maximum</span><input required type="number" min="0.01" step="any" value={form.mt2MaxMarks} onChange={(event) => setForm({ ...form, mt2MaxMarks: event.target.value })} /></label>
          </div>
          <button className="button button-primary" disabled={busy || !classes.length}>{busy ? 'Saving…' : 'Add subject'}</button>
        </form>
      )}
      {loading ? <p role="status">Loading subjects…</p> : (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead><tr><th>Subject</th><th>Code</th><th>Class</th><th>Term maxima</th><th>Teachers</th>{canModify && <th>Action</th>}</tr></thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  {editId === subject.id ? (
                    <>
                      <td><input aria-label="Subject name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></td>
                      <td><input aria-label="Subject code" value={editForm.code} onChange={(event) => setEditForm({ ...editForm, code: event.target.value })} /></td>
                      <td><select aria-label="Class" value={editForm.classId} onChange={(event) => setEditForm({ ...editForm, classId: event.target.value })}>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}</select></td>
                      <td className="subject-maxima-edit">
                        <label>MT1 <input aria-label="MT1 maximum marks" type="number" min="0.01" step="any" value={editForm.mt1MaxMarks} onChange={(event) => setEditForm({ ...editForm, mt1MaxMarks: event.target.value })} /></label>
                        <label>HY <input aria-label="HY maximum marks" type="number" min="0.01" step="any" value={editForm.hyMaxMarks} onChange={(event) => setEditForm({ ...editForm, hyMaxMarks: event.target.value })} /></label>
                        <label>MT2 <input aria-label="MT2 maximum marks" type="number" min="0.01" step="any" value={editForm.mt2MaxMarks} onChange={(event) => setEditForm({ ...editForm, mt2MaxMarks: event.target.value })} /></label>
                      </td>
                      <td>{subject.assignments?.map(({ teacher }) => teacher.name).join(', ') || '—'}</td>
                      <td className="user-row-actions"><button className="text-button" type="button" disabled={busy} onClick={() => saveSubject(subject.id)}>Save</button><button className="text-button" type="button" onClick={() => setEditId('')}>Cancel</button></td>
                    </>
                  ) : (
                    <>
                      <td>{subject.name}</td><td>{subject.code || '—'}</td><td>{subject.schoolClass.name} · {subject.schoolClass.academicYear}</td>
                      <td>MT1 {subject.mt1MaxMarks} · HY {subject.hyMaxMarks} · MT2 {subject.mt2MaxMarks}</td>
                      <td>{subject.assignments?.map(({ teacher }) => teacher.name).filter((name, index, names) => names.indexOf(name) === index).join(', ') || '—'}</td>
                      {canModify && <td><button className="text-button" type="button" onClick={() => startEdit(subject)}>Edit</button></td>}
                    </>
                  )}
                </tr>
              ))}
              {!subjects.length && <tr><td colSpan={canModify ? 6 : 5}>No subjects found for your account.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}