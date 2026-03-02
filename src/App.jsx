import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Shared/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import CanvasEditor from './pages/CanvasEditor';
import './App.css';

const Layout = () => (
  <AuthProvider>
    <Navbar />
    <Outlet />
  </AuthProvider>
);

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/',          element: <Landing /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/editor',    element: <Editor /> },
      { path: '/canvas',    element: <CanvasEditor /> },
      { path: '*',          element: <Navigate to="/" replace /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
