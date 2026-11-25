import { useEffect, useMemo, useState } from 'react';
import ClassApi from '../../api/class.api.js';
import SectionApi from '../../api/section.api.js';
import UserApi from '../../api/user.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCan } from '../../hooks/useCan.js';

export default function SectionManagerPage() {
  const { user } = useAuth();
  const canCreate = useCan('CLASSES', 'canWrite');
  const canModify = useCan('CLASSES', 'canModify');
  const canAssignTeachers = useCan('ASSIGNMENTS', 'canModify');
  const canWriteMarks = useCan('MARKS', 'canWrite');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);
  const [rosters, setRosters] = useState({});
  const [sectionModes, setSectionModes] = useState({});
  const [resultSubjects, setResultSubjects] = useState({});
  const [markEdits, setMarkEdits] = useState({});
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const activeStudents = useMemo(
    () => students.filter((student) => student.status === 'ACTIVE'),
    [students],
  );

  useEffect(() => {
    Promise.all([
      ClassApi.list(),
      canModify || canAssignTeachers ? UserApi.list() : Promise.resolve({ users: [] }),
    ])
      .then(([classData, userData]) => {
        setClasses(classData.classes);
        setStudents(userData.users.filter((student) => student.role === 'STUDENT'));
        setClassTeachers(userData.users.filter((account) => account.role === 'CLASS_TEACHER' && account.status === 'ACTIVE'));
        if (classData.classes.length) setClassId(classData.classes[0].id);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [canModify, canAssignTeachers]);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      return;
    }
    SectionApi.list(classId)
      .then(({ sections: rows }) => {
        setSections(rows);
        setRosters((current) => ({
          ...current,
          ...Object.fromEntries(rows.map((section) => [section.id, (section.students || []).map(({ id }) => id)])),
        }));
      })
      .catch((loadError) => setError(loadError.message));
  }, [classId]);

  async function createSection(event) {
    event.preventDefault();
    setError('');
    setBusyId('create');
    try {
      const { section } = await SectionApi.create({ name: newName, classId });
      const { sections: latestSections } = await SectionApi.list(classId);
      setSections(latestSections);
      setRosters((current) => ({ ...current, [section.id]: [] }));
      setNewName('');
      setNotice('Section created.');
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusyId('');
    }
  }

  async function saveSection(sectionId) {
    setError('');
    setBusyId(sectionId);
    try {
      await SectionApi.update(sectionId, { name: editName });
      const { sections: latestSections } = await SectionApi.list(classId);
      setSections(latestSections);
      setEditingId('');
      setNotice('Section updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusyId('');
    }
  }

  async function saveRoster(sectionId) {
    setError('');
    setBusyId(sectionId);
    try {
      const { section } = await SectionApi.assignStudents(sectionId, rosters[sectionId] || []);
      const { sections: latestSections } = await SectionApi.list(classId);
      setSections(latestSections);
      setNotice(`Student assignments saved for ${section.name}.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusyId('');
    }
  }

  async function selectResultsSubject(section, subjectId) {
    setResultSubjects((current) => ({ ...current, [section.id]: subjectId }));
    if (!subjectId) return;
    try {
      const { section: updatedSection } = await SectionApi.roster(section.id);
      setSections((rows) => rows.map((row) => row.id === section.id ? updatedSection : row));
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function saveTermMarks(section, subject) {
    setError('');
    setBusyId(`marks-${section.id}`);
    try {
      const marks = section.students.map((student) => {
        const existing = student.termMarks.find((row) => (
          row.subject.id === subject.id && row.academicYear === section.schoolClass.academicYear
        ));
        const edited = markEdits[`${section.id}:${subject.id}:${student.id}`] || {};
        return {
          studentId: student.id,
          mt1Mark: edited.mt1Mark === undefined ? existing?.mt1Mark ?? null : edited.mt1Mark === '' ? null : Number(edited.mt1Mark),
          hyMark: edited.hyMark === undefined ? existing?.hyMark ?? null : edited.hyMark === '' ? null : Number(edited.hyMark),
          mt2Mark: edited.mt2Mark === undefined ? existing?.mt2Mark ?? null : edited.mt2Mark === '' ? null : Number(edited.mt2Mark),
        };
      });
      await SectionApi.saveTermMarks(section.id, {
        subjectId: subject.id,
        academicYear: section.schoolClass.academicYear,
        marks,
      });
      const { section: updatedSection } = await SectionApi.roster(section.id);
      setSections((rows) => rows.map((row) => row.id === section.id ? updatedSection : row));
      setNotice(`Term marks saved for ${section.name} · ${subject.name}.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusyId('');
    }
  }

  async function setClassTeacher(sectionId, teacherId) {
    setError('');
    setBusyId(`teacher-${sectionId}`);
    try {
      const { section: teacherInfo } = await SectionApi.assignClassTeacher(sectionId, teacherId || null);
      setSections((rows) => rows.map((row) => (
        row.id === sectionId ? { ...row, classTeacher: teacherInfo.classTeacher, classTeacherId: teacherInfo.classTeacher?.id || null } : row
      )));
      setNotice('Class teacher assignment updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusyId('');
    }
  }

  function toggleStudent(sectionId, studentId, checked) {
    setRosters((current) => {
      const selected = new Set(current[sectionId] || []);
      if (checked) selected.add(studentId);
      else selected.delete(studentId);
      return { ...current, [sectionId]: [...selected] };
    });
  }

  return (
    <section className="dashboard-page">
      <div className="welcome-row">
        <div>
          <div className="page-kicker">ACADEMIC ORGANIZATION</div>
          <h1>Sections</h1>
          <p className="welcome-subtitle">View class sections and assign active student accounts.</p>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {loading ? <p role="status">Loading sections…</p> : (
        <>
          <label className="section-class-picker">
            <span>Class</span>
            <select value={classId} onChange={(event) => setClassId(event.target.value)}>
              {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} · {schoolClass.academicYear}</option>)}
            </select>
          </label>
          {canCreate && (
            <form className="section-create-form" onSubmit={createSection}>
              <label className="user-form-field"><span>New section name</span><input required maxLength="50" value={newName} onChange={(event) => setNewName(event.target.value)} /></label>
              <button className="button button-primary" disabled={busyId !== '' || !classId}>{busyId === 'create' ? 'Creating…' : 'Add section'}</button>
            </form>
          )}
          {user.role === 'STUDENT' ? sections.map((section) => (
            <article className="section-card" key={section.id}>
              <div className="section-card-heading">
                <div>
                  <h2>{section.schoolClass.name} · {section.name}</h2>
                  <p>Academic year: {section.schoolClass.academicYear}</p>
                </div>
              </div>
            </article>
          )) : sections.map((section) => (
            <article className="section-card" key={section.id}>
              <div className="section-card-heading">
                <div>
                  {editingId === section.id ? (
                    <input aria-label="Section name" value={editName} onChange={(event) => setEditName(event.target.value)} />
                  ) : <h2>{section.name}</h2>}
                  <p>{section.schoolClass.name} · {section.schoolClass.academicYear} · {section.students?.length ?? 0} students</p>
                  <p>
                    Class teacher: {section.classTeacher ? `${section.classTeacher.name} · ${section.classTeacher.phone || 'No phone listed'}` : 'Not assigned'}
                  </p>
                </div>
                {canAssignTeachers && (
                  <label className="user-form-field class-teacher-picker">
                    <span>Class teacher</span>
                    <select value={section.classTeacher?.id || ''} onChange={(event) => setClassTeacher(section.id, event.target.value)} disabled={busyId !== ''}>
                      <option value="">Not assigned</option>
                      {classTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.phone || 'No phone listed'}</option>)}
                    </select>
                  </label>
                )}
              </div>
                <div className="section-view-tabs" role="tablist" aria-label={`${section.name} roster views`}>
                  <button type="button" className={sectionModes[section.id] !== 'results' ? 'active' : ''} onClick={() => setSectionModes((current) => ({ ...current, [section.id]: 'information' }))}>Information</button>
                  <button type="button" className={sectionModes[section.id] === 'results' ? 'active' : ''} onClick={() => setSectionModes((current) => ({ ...current, [section.id]: 'results' }))}>Results</button>
                </div>
                <div className="section-teacher-list">
                  <strong>Assigned teachers</strong>
                  {[...(section.assignments || []), ...(section.schoolClass.assignments || [])]
                    .filter((assignment, index, rows) => rows.findIndex((item) => item.teacher.id === assignment.teacher.id && item.subject?.id === assignment.subject?.id) === index)
                    .map((assignment) => <span key={`${assignment.teacher.id}-${assignment.subject?.id || 'all'}`}>{assignment.teacher.name} · {assignment.teacher.phone || 'No phone listed'}{assignment.subject?.name ? ` · ${assignment.subject.name}` : ''}</span>)}
                  {!section.assignments?.length && !section.schoolClass.assignments?.length && <span>No teachers assigned.</span>}
                </div>
                {sectionModes[section.id] !== 'results' ? (
                  <div className="user-table-wrap section-roster-table">
                    <table className="user-table">
                      <thead><tr><th>Name</th><th>Roll</th><th>Guardian phone</th></tr></thead>
                      <tbody>{section.students?.map((student) => <tr key={student.id}><td>{student.name}</td><td>{student.rollNumber || '—'}</td><td>{student.guardianPhone || '—'}</td></tr>)}
                        {!section.students?.length && <tr><td colSpan="3">No students are assigned to this section.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <label className="user-form-field result-subject-picker">
                      <span>Subject</span>
                      <select value={resultSubjects[section.id] || ''} onChange={(event) => selectResultsSubject(section, event.target.value)}>
                        <option value="">Select subject</option>
                        {(section.schoolClass.subjects || []).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                      </select>
                    </label>
                    {resultSubjects[section.id] && (() => {
                      const subject = section.schoolClass.subjects.find((item) => item.id === resultSubjects[section.id]);
                      if (!subject) return <p>No subject found for this class.</p>;
                      return (
                        <div className="user-table-wrap section-roster-table">
                          <table className="user-table">
                            <thead><tr><th>Name</th><th>Roll</th><th>MT1 / {subject.mt1MaxMarks}</th><th>HY / {subject.hyMaxMarks}</th><th>MT2 / {subject.mt2MaxMarks}</th></tr></thead>
                            <tbody>{section.students?.map((student) => {
                              const result = student.termMarks.find((row) => row.subject.id === subject.id && row.academicYear === section.schoolClass.academicYear);
                              const edits = markEdits[`${section.id}:${subject.id}:${student.id}`] || {};
                              return <tr key={student.id}>
                                <td>{student.name}</td><td>{student.rollNumber || '—'}</td>
                                {[
                                  ['mt1Mark', result?.mt1Mark, subject.mt1MaxMarks],
                                  ['hyMark', result?.hyMark, subject.hyMaxMarks],
                                  ['mt2Mark', result?.mt2Mark, subject.mt2MaxMarks],
                                ].map(([field, score, maximum]) => <td key={field}>{canWriteMarks
                                  ? <input aria-label={`${student.name} ${field}`} type="number" min="0" max={maximum} step="any" value={edits[field] ?? score ?? ''} onChange={(event) => setMarkEdits((current) => ({ ...current, [`${section.id}:${subject.id}:${student.id}`]: { ...current[`${section.id}:${subject.id}:${student.id}`], [field]: event.target.value } }))} />
                                  : score ?? '—'}</td>)}
                              </tr>;
                            })}
                            {!section.students?.length && <tr><td colSpan="5">No students are assigned to this section.</td></tr>}
                            </tbody>
                          </table>
                          {canWriteMarks && <button className="button button-secondary permission-save" type="button" disabled={busyId !== ''} onClick={() => saveTermMarks(section, subject)}>{busyId === `marks-${section.id}` ? 'Saving…' : 'Save term marks'}</button>}
                        </div>
                      );
                    })()}
                    {!section.schoolClass.subjects?.length && <p>No subjects have been created for this class.</p>}
                  </>
                )}
                {canModify && (
                  <div className="user-row-actions">
                    {editingId === section.id ? (
                      <>
                        <button className="text-button" type="button" disabled={busyId !== ''} onClick={() => saveSection(section.id)}>Save name</button>
                        <button className="text-button" type="button" onClick={() => setEditingId('')}>Cancel</button>
                      </>
                    ) : (
                      <button className="text-button" type="button" onClick={() => { setEditingId(section.id); setEditName(section.name); }}>Edit</button>
                    )}
                  </div>
                )}
              {canModify && (
                <div className="roster-editor">
                  <strong>Assign students</strong>
                  <div className="roster-student-list">
                    {activeStudents.map((student) => (
                      <label key={student.id}>
                        <input
                          type="checkbox"
                          checked={(rosters[section.id] || []).includes(student.id)}
                          onChange={(event) => toggleStudent(section.id, student.id, event.target.checked)}
                        />
                        <span>{student.name} <small>{student.institutionalId}</small></span>
                      </label>
                    ))}
                    {!activeStudents.length && <p>No active student accounts are available.</p>}
                  </div>
                  <button className="button button-secondary permission-save" type="button" disabled={busyId !== ''} onClick={() => saveRoster(section.id)}>
                    {busyId === section.id ? 'Saving…' : 'Save student assignments'}
                  </button>
                </div>
              )}
            </article>
          ))}
          {!sections.length && <p className="empty-section-list">No sections found for this class.</p>}
        </>
      )}
    </section>
  );
}