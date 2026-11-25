import { useEffect, useMemo, useState } from 'react';
import AssignmentApi from '../../api/assignment.api.js';
import ClassApi from '../../api/class.api.js';
import SectionApi from '../../api/section.api.js';
import SubjectApi from '../../api/subject.api.js';
import UserApi from '../../api/user.api.js';
import { useCan } from '../../hooks/useCan.js';

const emptyForm = { teacherId: '', classId: '', sectionId: '', subjectId: '' };

export default function TeacherAssignmentPage() {
  const canCreate = useCan('ASSIGNMENTS', 'canWrite');
  const canModify = useCan('ASSIGNMENTS', 'canModify');
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState('');
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const resources = [
      AssignmentApi.list(),
      ClassApi.list(),
      SubjectApi.list(),
      canCreate ? SectionApi.list() : Promise.resolve({ sections: [] }),
      canCreate ? UserApi.list() : Promise.resolve({ users: [] }),
    ];
    Promise.all(resources)
      .then(([assignmentData, classData, subjectData, sectionData, userData]) => {
        setAssignments(assignmentData.assignments);
        setClasses(classData.classes);
        setSubjects(subjectData.subjects);
        setSections(sectionData.sections);
        setTeachers(userData.users.filter((account) => (
          ['TEACHER', 'CLASS_TEACHER'].includes(account.role) && account.status === 'ACTIVE'
        )));
        const firstClassId = classData.classes[0]?.id || '';
        const firstTeacherId = userData.users.find((account) => (
          ['TEACHER', 'CLASS_TEACHER'].includes(account.role) && account.status === 'ACTIVE'
        ))?.id || '';
        setForm({ ...emptyForm, classId: firstClassId, teacherId: firstTeacherId });
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [canCreate]);

  const visibleSections = useMemo(
    () => sections.filter((section) => section.classId === form.classId),
    [sections, form.classId],
  );
  const visibleSubjects = useMemo(
    () => subjects.filter((subject) => subject.classId === form.classId),
    [subjects, form.classId],
  );
  const editSections = useMemo(
    () => sections.filter((section) => section.classId === editForm.classId),
    [sections, editForm.classId],
  );
  const editSubjects = useMemo(
    () => subjects.filter((subject) => subject.classId === editForm.classId),
    [subjects, editForm.classId],
  );

  function setCreateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'classId' ? { sectionId: '', subjectId: '' } : {}),
    }));
  }

  function setEditField(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'classId' ? { sectionId: '', subjectId: '' } : {}),
    }));
  }

  async function createAssignment(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { assignment } = await AssignmentApi.create({
        ...form,
        sectionId: form.sectionId || null,
        subjectId: form.subjectId || null,
      });
      setAssignments((rows) => [...rows, assignment]);
      setNotice('Teacher assignment created.');
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(assignment) {
    setEditId(assignment.id);
    setEditForm({
      teacherId: assignment.teacherId,
      classId: assignment.classId,
      sectionId: assignment.sectionId || '',
      subjectId: assignment.subjectId || '',
    });
    setError('');
    setNotice('');
  }

  async function saveAssignment(id) {
    setBusy(true);
    setError('');
    try {
      const { assignment } = await AssignmentApi.update(id, {
        ...editForm,
        sectionId: editForm.sectionId || null,
        subjectId: editForm.subjectId || null,
      });
      setAssignments((rows) => rows.map((row) => (row.id === id ? assignment : row)));
      setEditId('');
      setNotice('Teacher assignment updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  function fields(value, setter, availableSections, availableSubjects) {
    return (
      <div className="user-form-grid assignment-fields">
        <label className="user-form-field"><span>Teacher</span><select required value={value.teacherId} onChange={(event) => setter('teacherId', event.target.value)}>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.role.replaceAll('_', ' ')}</option>)}</select></label>
        <label className="user-form-field"><span>Class</span><select required value={value.classId} onChange={(event) => setter('classId', event.target.value)}>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} · {schoolClass.academicYear}</option>)}</select></label>
        <label className="user-form-field"><span>Section (optional)</span><select value={value.sectionId} onChange={(event) => setter('sectionId', event.target.value)}><option value="">All sections</option>{availableSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label>
        <label className="user-form-field"><span>Subject (optional)</span><select value={value.subjectId} onChange={(event) => setter('subjectId', event.target.value)}><option value="">All subjects</option>{availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
      </div>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="welcome-row">
        <div>
          <div className="page-kicker">TEACHING RESPONSIBILITIES</div>
          <h1>Teacher assignments</h1>
          <p className="welcome-subtitle">Review the classes, sections, and subjects assigned to each teacher.</p>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {canCreate && (
        <form className="user-create-form" onSubmit={createAssignment}>
          <h2>Assign a teacher</h2>
          {fields(form, setCreateField, visibleSections, visibleSubjects)}
          <button className="button button-primary" disabled={busy || !teachers.length || !classes.length}>{busy ? 'Saving…' : 'Create assignment'}</button>
        </form>
      )}
      {loading ? <p role="status">Loading assignments…</p> : (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead><tr><th>Teacher</th><th>Class</th><th>Section</th><th>Subject</th>{canModify && <th>Action</th>}</tr></thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  {editId === assignment.id ? (
                    <td colSpan={canModify ? 5 : 4} className="assignment-edit-cell">
                      {fields(editForm, setEditField, editSections, editSubjects)}
                      <button className="text-button" type="button" disabled={busy} onClick={() => saveAssignment(assignment.id)}>Save</button>
                      <button className="text-button" type="button" onClick={() => setEditId('')}>Cancel</button>
                    </td>
                  ) : (
                    <>
                      <td>{assignment.teacher.name}</td><td>{assignment.schoolClass.name} · {assignment.schoolClass.academicYear}</td>
                      <td>{assignment.section?.name || 'All sections'}</td><td>{assignment.subject?.name || 'All subjects'}</td>
                      {canModify && <td><button className="text-button" type="button" onClick={() => startEdit(assignment)}>Edit</button></td>}
                    </>
                  )}
                </tr>
              ))}
              {!assignments.length && <tr><td colSpan={canModify ? 5 : 4}>No teaching assignments found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}