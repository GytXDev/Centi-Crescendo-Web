import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import HomePage from '@/pages/HomePage';
import AdminPage from '@/pages/AdminPage';
import HistoryPage from '@/pages/HistoryPage';
import CouponDashboardPage from '@/pages/CouponDashboardPage';
import ParticipantsPage from '@/pages/ParticipantsPage';
import TombolaRulesPage from '@/pages/TombolaRulesPage';

function App() {
  return (
    <Router>
      <Helmet>
        <title>Centi Crescendo - Tombola Digitale</title>
        <meta name="description" content="Participez à nos tombolas digitales et tentez de gagner d'importantes sommes d'argent ! Plateforme sécurisée avec paiement Airtel Money." />
      </Helmet>
      <div className="min-h-screen bg-[#0B0B0F]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/historique" element={<HistoryPage />} />
          <Route path="/coupons" element={<CouponDashboardPage />} />
          <Route path="/participants" element={<ParticipantsPage />} />
          <Route path="/tombola-reglement" element={<TombolaRulesPage />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;