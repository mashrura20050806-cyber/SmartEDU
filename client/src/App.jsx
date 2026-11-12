import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import PermissionsPage from './pages/permissions/PermissionsPage.jsx';
import UserListPage from './pages/users/UserListPage.jsx';
import ClassListPage from './pages/classes/ClassListPage.jsx';
import SectionManagerPage from './pages/classes/SectionManagerPage.jsx';
import SubjectManagerPage from './pages/subjects/SubjectManagerPage.jsx';
import TeacherAssignmentPage from './pages/assignments/TeacherAssignmentPage.jsx';
import FileBrowserPage from './pages/files/FileBrowserPage.jsx';
import FileUploadPage from './pages/files/FileUploadPage.jsx';
import NoticeListPage from './pages/notices/NoticeListPage.jsx';
import NoticeEditorPage from './pages/notices/NoticeEditorPage.jsx';
import MarksEntryPage from './pages/marks/MarksEntryPage.jsx';
import PerformancePage from './pages/marks/PerformancePage.jsx';
import StudentMarksPage from './pages/marks/StudentMarksPage.jsx';

function StartupScreen({ message, onRetry }) {
  return (
    <main className="startup-screen">
      <div className="startup-card">
        <span className="brand-mark">S</span>
        <h1>SmartEDU</h1>
        <p>{message}</p>
        {onRetry && <button className="button button-primary" onClick={onRetry}>Try again</button>}
      </div>
    </main>
  );
}

export default function App() {
  const { status, refresh, user, permissions } = useAuth();

  if (status === 'loading') return <StartupScreen message="Connecting to your school workspace…" />;
  if (status === 'error') return <StartupScreen message="We could not connect to SmartEDU. Check that the server is running, then try again." onRetry={refresh} />;

  return (
    <Routes>
      <Route path="/login" element={status === 'authenticated' ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/register" element={status === 'authenticated' ? <Navigate to="/app" replace /> : <RegisterPage />} />
      <Route path="/app" element={status === 'authenticated' ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="permissions"
          element={user?.role === 'ADMIN' ? <PermissionsPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="users"
          element={permissions.USERS?.canView ? <UserListPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="classes"
          element={permissions.CLASSES?.canView ? <ClassListPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="sections"
          element={permissions.CLASSES?.canView ? <SectionManagerPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="subjects"
          element={permissions.SUBJECTS?.canView ? <SubjectManagerPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="assignments"
          element={permissions.ASSIGNMENTS?.canView ? <TeacherAssignmentPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="files"
          element={permissions.FILES?.canView ? <FileBrowserPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="files/upload"
          element={permissions.FILES?.canWrite ? <FileUploadPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="notices"
          element={permissions.NOTICE?.canView ? <NoticeListPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="notices/new"
          element={permissions.NOTICE?.canWrite ? <NoticeEditorPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="notices/:id/edit"
          element={permissions.NOTICE?.canModify ? <NoticeEditorPage /> : <Navigate to="/app" replace />}
        />
        <Route
          path="marks"
          element={permissions.MARKS?.canView ? (user?.role === 'STUDENT' ? <StudentMarksPage /> : <MarksEntryPage />) : <Navigate to="/app" replace />}
        />
        <Route
          path="performance"
          element={permissions.MARKS?.canView ? <PerformancePage /> : <Navigate to="/app" replace />}
        />
      </Route>
      <Route path="*" element={<Navigate to={status === 'authenticated' ? '/app' : '/login'} replace />} />
    </Routes>
  );
}