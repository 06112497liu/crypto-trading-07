import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Strategies from '@/pages/Strategies';
import CreateStrategy from '@/pages/CreateStrategy';
import StrategyDetail from '@/pages/StrategyDetail';
import Positions from '@/pages/Positions';
import Orders from '@/pages/Orders';
import Settings from '@/pages/Settings';
import { ws } from '@/services/websocket';
import { useStore } from '@/store/useStore';
import type { GridStrategy, Order, Position, TickerData } from '../shared/types';

function AppContent() {
  const { updateStrategy, updateOrder, updatePosition, setTicker, loadAll } = useStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    ws.connect();

    ws.on('ticker', (data: TickerData) => {
      setTicker(data);
    });

    ws.on('strategyUpdate', (data: GridStrategy | { id: string; deleted: boolean }) => {
      updateStrategy(data);
    });

    ws.on('orderUpdate', (data: Order | { allCanceled: boolean }) => {
      updateOrder(data);
    });

    ws.on('positionUpdate', (data: Position) => {
      updatePosition(data);
    });

    return () => {
      ws.disconnect();
    };
  }, [updateStrategy, updateOrder, updatePosition, setTicker]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="strategies" element={<Strategies />} />
        <Route path="strategies/create" element={<CreateStrategy />} />
        <Route path="strategies/:id" element={<StrategyDetail />} />
        <Route path="positions" element={<Positions />} />
        <Route path="orders" element={<Orders />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
