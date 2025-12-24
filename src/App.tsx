import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StockEntry from './pages/StockEntry';
import SalesEntry from './pages/SalesEntry';
import RecipeManager from './pages/RecipeManager';
import WeeklyReport from './pages/WeeklyReport';
import Sidebar from './components/Sidebar';
import AIFloatingWidget from './components/AIFloatingWidget';
import CriticalStockBar from './components/CriticalStockBar';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <CriticalStockBar />
      <div className="flex" style={{ minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 'var(--space-xl)', background: 'var(--bg-dark)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/entrada" element={<StockEntry />} />
            <Route path="/saida" element={<SalesEntry />} />
            <Route path="/receitas" element={<RecipeManager />} />
            <Route path="/relatorio" element={<WeeklyReport />} />
          </Routes>
        </main>
      </div>
      <AIFloatingWidget />
    </BrowserRouter>
  );
}

export default App;
