import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import StockEntry from './pages/StockEntry';
import SalesEntry from './pages/SalesEntry';
import RecipeManager from './pages/RecipeManager';
import WeeklyReport from './pages/WeeklyReport';
import Users from './pages/Users';
import Ingredients from './pages/Ingredients';
import Categories from './pages/Categories';
import Timeline from './pages/Timeline';
import TrashBin from './pages/TrashBin';
import PlatformAdmin from './pages/platform/PlatformAdmin';
import Sidebar from './components/Sidebar';
import CriticalStockBar from './components/CriticalStockBar';
import FloatingAIButton from './components/AI/FloatingAIButton';
import AIChatPanel from './components/AI/AIChatPanel';
import { useAIChat } from './hooks/useAIChat';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Platform Admin (Super Admin only) */}
            <Route
              path="/platform/admin"
              element={
                <ProtectedRoute>
                  <PlatformAdmin />
                </ProtectedRoute>
              }
            />

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
              path="/ingredients"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Ingredients />
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
              path="/categories"
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <Categories />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeline"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Timeline />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trash"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TrashBin />
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
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Layout wrapper para rotas protegidas
function AppLayout({ children }: { children: React.ReactNode }) {
  const aiChat = useAIChat();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CriticalStockBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-xl)' }}>
          {children}
        </div>
      </main>

      {/* AI Assistant */}
      <FloatingAIButton
        onClick={aiChat.toggleChat}
        suggestionCount={aiChat.suggestionCount}
      />
      <AIChatPanel
        isOpen={aiChat.isOpen}
        onClose={aiChat.closeChat}
        messages={aiChat.messages}
        isTyping={aiChat.isTyping}
        onSendMessage={aiChat.sendMessage}
      />
    </div>
  );
}

export default App;
