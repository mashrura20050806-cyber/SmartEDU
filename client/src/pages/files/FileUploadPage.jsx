import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClassApi from '../../api/class.api.js';
import FileApi from '../../api/file.api.js';
import SectionApi from '../../api/section.api.js';
import { useCan } from '../../hooks/useCan.js';

export default function FileUploadPage() {
  const canUpload = useCan('FILES', 'canWrite');
  const canViewClasses = useCan('CLASSES', 'canView');
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    kind: 'MATERIAL',
    classId: '',
    sectionId: '',
    dueAt: '',
    file: null,
  });
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canViewClasses) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    ClassApi.list()
      .then(({ classes: rows }) => { if (active) setClasses(rows); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canViewClasses]);

  useEffect(() => {
    if (!form.classId) {
      setSections([]);
      return;
    }
    SectionApi.list(form.classId)
      .then(({ sections: rows }) => setSections(rows))
      .catch((loadError) => setError(loadError.message));
  }, [form.classId]);

  async function submit(event) {
    event.preventDefault();
    if (!canUpload) return;
    if (!form.file) {
      setError('Choose a PDF or image file to upload.');
      return;
    }
    if (form.file.size > 10 * 1024 * 1024) {
      setError('The maximum file size is 10 MB.');
      return;
    }
    setError('');
    setBusy(true);
    const data = new FormData();
    data.append('file', form.file);
    data.append('title', form.title);
    data.append('description', form.description);
    data.append('kind', form.kind);
    if (form.classId) data.append('classId', form.classId);
    if (form.sectionId) data.append('sectionId', form.sectionId);
    if (form.dueAt) data.append('dueAt', new Date(form.dueAt).toISOString());
    try {
      await FileApi.upload(data);
      navigate('/app/files', { replace: true, state: { message: 'File uploaded successfully.' } });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dashboard-page">
      <Link className="back-link" to="/app/files">← Back to files & tasks</Link>
      <div className="welcome-row">
        <div>
          <div className="page-kicker">LEARNING RESOURCES</div>
          <h1>Upload a file</h1>
          <p className="welcome-subtitle">Share a PDF or image with the school or a specific class section.</p>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {loading ? <p role="status">Loading classes…</p> : (
        <form className="user-create-form file-upload-form" onSubmit={submit}>
          <div className="user-form-grid">
            <label className="user-form-field"><span>Title</span><input required maxLength="160" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label className="user-form-field"><span>Type</span><select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}><option value="MATERIAL">Study material</option><option value="TASK">Class task</option></select></label>
            <label className="user-form-field"><span>Class (optional)</span><select value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value, sectionId: '' })}><option value="">School-wide</option>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} · {schoolClass.academicYear}</option>)}</select></label>
            {form.classId && <label className="user-form-field"><span>Section (optional)</span><select value={form.sectionId} onChange={(event) => setForm({ ...form, sectionId: event.target.value })}><option value="">All sections in class</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label>}
            {form.kind === 'TASK' && <label className="user-form-field"><span>Due date and time</span><input required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></label>}
            <label className="user-form-field file-upload-input"><span>PDF or image (max 10 MB)</span><input type="file" accept=".pdf,image/jpeg,image/png,image/webp" required onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} /></label>
          </div>
          <label className="user-form-field file-description"><span>Description (optional)</span><textarea rows="3" maxLength="1000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <button className="button button-primary" type="submit" disabled={busy || !canUpload}>{busy ? 'Uploading…' : 'Upload resource'}</button>
        </form>
      )}
    </section>
  );
}