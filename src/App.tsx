import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import StockEntry from './pages/StockEntry';
import SalesEntry from './pages/SalesEntry';
import RecipeManager from './pages/RecipeManager';
import WeeklyReport from './pages/WeeklyReport';
import Users from './pages/Users';
import Sidebar from './components/Sidebar';
import AIFloatingWidget from './components/AIFloatingWidget';
import CriticalStockBar from './components/CriticalStockBar';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/entrada"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StockEntry />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/saida"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SalesEntry />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receitas"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <RecipeManager />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorio"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <WeeklyReport />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <Users />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Layout component for authenticated pages
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CriticalStockBar />
      <div className="flex" style={{ minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 'var(--space-xl)', background: 'var(--bg-dark)' }}>
          {children}
        </main>
      </div>
      <AIFloatingWidget />
    </>
  );
}

export default App;
