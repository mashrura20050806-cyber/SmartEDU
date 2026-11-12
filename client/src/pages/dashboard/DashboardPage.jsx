import { BookOpen, CalendarDays, ClipboardCheck, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ClassApi from '../../api/class.api.js';
import FileApi from '../../api/file.api.js';
import MarksApi from '../../api/marks.api.js';
import NoticeApi from '../../api/notice.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCan } from '../../hooks/useCan.js';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const canViewNotices = useCan('NOTICE');
  const canViewFiles = useCan('FILES');
  const canViewMarks = useCan('MARKS');
  const canViewClasses = useCan('CLASSES');
  const [data, setData] = useState({ notices: [], tasks: [], marks: [], exams: [], classes: [] });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests = [];
    if (canViewNotices) requests.push(['notices', NoticeApi.list()]);
    if (canViewFiles) requests.push(['tasks', FileApi.list('TASK')]);
    if (canViewMarks) {
      requests.push(user?.role === 'STUDENT'
        ? ['marks', MarksApi.mine()]
        : ['exams', MarksApi.listExams()]);
    }
    if (canViewClasses) requests.push(['classes', ClassApi.list()]);
    let active = true;
    Promise.all(requests.map(async ([key, request]) => {
      try {
        const result = await request;
        return { key, value: key === 'tasks' ? result.files : result[key] };
      } catch (error) {
        return { key, error: error.message };
      }
    })).then((results) => {
      if (!active) return;
      const nextData = { notices: [], tasks: [], marks: [], exams: [], classes: [] };
      const nextErrors = [];
      for (const result of results) {
        if (result.error) nextErrors.push(result.error);
        else nextData[result.key] = Array.isArray(result.value) ? result.value : [];
      }
      setData(nextData);
      setErrors(nextErrors);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canViewClasses, canViewFiles, canViewMarks, canViewNotices, user?.role]);

  return (
    <div className="dashboard-page">
      <div className="welcome-row"><div><h1>{greeting()}, {user?.name?.split(' ')[0]}</h1></div><div className="date-chip"><CalendarDays size={17} /><span>{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span></div></div>
      <div className="section-heading"><h2>Academic overview</h2></div>
      {loading && <p role="status">Loading your updates…</p>}
      {errors.length > 0 && <div className="form-error" role="alert">{errors.join(' ')}</div>}
      <section className="quick-grid">
        {canViewNotices && <Link className="quick-card quick-card-link" to="/app/notices"><span className="quick-icon icon-mint"><FileText size={20} /></span><div className="quick-card-copy"><h3>Notices</h3><p>{data.notices.length ? `${data.notices.length} notice${data.notices.length === 1 ? '' : 's'}` : 'No notices yet.'}</p>{data.notices.slice(0, 2).map((notice) => <small key={notice.id}>{notice.title}</small>)}</div></Link>}
        {canViewFiles && <Link className="quick-card quick-card-link" to="/app/files"><span className="quick-icon icon-sage"><ClipboardCheck size={20} /></span><div className="quick-card-copy"><h3>Class tasks</h3><p>{data.tasks.length ? `${data.tasks.length} task${data.tasks.length === 1 ? '' : 's'}` : 'No tasks yet.'}</p>{data.tasks.slice(0, 2).map((task) => <small key={task.id}>{task.title}{task.dueAt && ` Due ${new Date(task.dueAt).toLocaleDateString()}`}</small>)}</div></Link>}
        {canViewMarks && user?.role === 'STUDENT' && <Link className="quick-card quick-card-link" to="/app/marks"><span className="quick-icon icon-olive"><BookOpen size={20} /></span><div className="quick-card-copy"><h3>Marks & performance</h3><p>{data.marks.length ? `${data.marks.length} assessment${data.marks.length === 1 ? '' : 's'} marked` : 'No marks yet.'}</p></div></Link>}
        {canViewMarks && user?.role !== 'STUDENT' && <Link className="quick-card quick-card-link" to="/app/marks"><span className="quick-icon icon-olive"><BookOpen size={20} /></span><div className="quick-card-copy"><h3>Exams & marks</h3><p>{data.exams.length} assessment{data.exams.length === 1 ? '' : 's'}</p></div></Link>}
        {canViewClasses && <Link className="quick-card quick-card-link" to="/app/classes"><span className="quick-icon icon-sage"><BookOpen size={20} /></span><div className="quick-card-copy"><h3>Classes & subjects</h3><p>{data.classes.length ? `${data.classes.length} class${data.classes.length === 1 ? '' : 'es'}` : 'No classes yet.'}</p></div></Link>}
      </section>
    </div>
  );
}