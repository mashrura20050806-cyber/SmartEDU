import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FileApi from '../../api/file.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCan } from '../../hooks/useCan.js';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileBrowserPage() {
  const { user } = useAuth();
  const location = useLocation();
  const canUpload = useCan('FILES', 'canWrite');
  const canModify = useCan('FILES', 'canModify');
  const [kind, setKind] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({ title: '', description: '', dueAt: '' });

  useEffect(() => {
    if (location.state?.message) setNotice(location.state.message);
  }, [location.state]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    FileApi.list(kind)
      .then(({ files: rows }) => {
        if (current) setFiles(rows);
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
  }, [kind]);

  async function downloadFile(file) {
    setError('');
    try {
      const blob = await FileApi.download(file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(downloadError.message);
    }
  }

  function beginEdit(file) {
    setEditingId(file.id);
    setEditForm({
      title: file.title,
      description: file.description || '',
      dueAt: file.dueAt
        ? new Date(new Date(file.dueAt).getTime() - new Date(file.dueAt).getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16)
        : '',
    });
    setError('');
    setNotice('');
  }

  async function saveFile(file) {
    setError('');
    try {
      const changes = {
        title: editForm.title,
        description: editForm.description || null,
      };
      if (file.kind === 'TASK') changes.dueAt = new Date(editForm.dueAt).toISOString();
      const { file: updated } = await FileApi.update(file.id, changes);
      setFiles((rows) => rows.map((row) => (row.id === file.id ? { ...row, ...updated } : row)));
      setEditingId('');
      setNotice('File details updated.');
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteFile(file) {
    if (!window.confirm(`Delete "${file.title}"? This cannot be undone.`)) return;
    setError('');
    try {
      await FileApi.remove(file.id);
      setFiles((rows) => rows.filter((row) => row.id !== file.id));
      setNotice('File deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="dashboard-page">
      <div className="welcome-row">
        <div>
          <div className="page-kicker">LEARNING RESOURCES</div>
          <h1>Files & tasks</h1>
          <p className="welcome-subtitle">Browse materials and tasks shared with your class.</p>
        </div>
        {canUpload && <Link className="button button-primary" to="/app/files/upload">Upload file</Link>}
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      <label className="section-class-picker">
        <span>Show</span>
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="">All resources</option><option value="MATERIAL">Study materials</option><option value="TASK">Class tasks</option>
        </select>
      </label>
      {loading ? <p role="status">Loading files…</p> : (
        <div className="file-card-list">
          {files.map((file) => (
            <article className="file-resource-card" key={file.id}>
              <div className="file-resource-main">
                <span className={`file-kind-badge ${file.kind === 'TASK' ? 'file-kind-task' : ''}`}>{file.kind === 'TASK' ? 'TASK' : 'MATERIAL'}</span>
                {editingId === file.id ? (
                  <div className="file-edit-fields">
                    <input aria-label="Title" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} />
                    <input aria-label="Description" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
                    {file.kind === 'TASK' && <input aria-label="Due date" type="datetime-local" required value={editForm.dueAt} onChange={(event) => setEditForm({ ...editForm, dueAt: event.target.value })} />}
                  </div>
                ) : (
                  <>
                    <h2>{file.title}</h2>
                    {file.description && <p>{file.description}</p>}
                    <div className="file-resource-meta">
                      <span>{file.schoolClass?.name || 'School-wide'}{file.section ? ` · ${file.section.name}` : ''}</span>
                      <span>{file.originalName} · {formatSize(file.sizeBytes)}</span>
                      {file.kind === 'TASK' && file.dueAt && <span>Due {new Date(file.dueAt).toLocaleString()}</span>}
                      <span>Shared by {file.uploader.name}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="file-resource-actions">
                <button className="button button-secondary permission-save" type="button" onClick={() => downloadFile(file)}>Download</button>
                {canModify && (user?.role === 'ADMIN' || file.uploaderId === user?.id) && (
                  editingId === file.id ? (
                    <>
                      <button className="text-button" type="button" onClick={() => saveFile(file)}>Save</button>
                      <button className="text-button" type="button" onClick={() => setEditingId('')}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="text-button" type="button" onClick={() => beginEdit(file)}>Edit</button>
                      <button className="text-button" type="button" onClick={() => deleteFile(file)}>Delete</button>
                    </>
                  )
                )}
              </div>
            </article>
          ))}
          {!files.length && <div className="empty-section-list">No materials or tasks are available for your account yet.</div>}
        </div>
      )}
    </section>
  );
}