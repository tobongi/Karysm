'use client';
import { useState } from 'react';

const MOCK_STATS = {
  totalProviders: 47,
  activeProviders: 32,
  pendingProviders: 8,
  totalBookings: 312,
  totalUsers: 1204,
};

const MOCK_PENDING = [
  { id: '1', name: 'Fatima Coiffure', city: 'Kinshasa', commune: 'Lemba', phone: '+243812345678', date: '2026-03-14' },
  { id: '2', name: 'Beauty Queen Nails', city: 'Douala', commune: 'Bonanjo', phone: '+237651234567', date: '2026-03-13' },
  { id: '3', name: 'Massage Pro KIN', city: 'Kinshasa', commune: 'Gombe', phone: '+243971234567', date: '2026-03-12' },
];

const MOCK_RECENT_BOOKINGS = [
  { id: '1', ref: 'TKS-A3B7C2', client: 'Sophie K.', provider: 'Marie Tresses', service: 'Tresses collees', status: 'CONFIRMED', date: '2026-03-15' },
  { id: '2', ref: 'TKS-D8E4F1', client: 'Grace M.', provider: 'Nails by Grace', service: 'Pose gel UV', status: 'COMPLETED', date: '2026-03-14' },
  { id: '3', ref: 'TKS-G5H9J3', client: 'Jean P.', provider: 'Barber King', service: 'Coupe homme', status: 'REQUESTED', date: '2026-03-15' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'bookings'>('overview');

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-accent text-white px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tokoss Admin</h1>
          <p className="text-sm text-white/60">Tableau de bord</p>
        </div>
        <div className="text-sm text-white/80">admin@tokoss.com</div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b px-8 flex gap-1">
        {[
          { key: 'overview', label: 'Vue d\'ensemble' },
          { key: 'providers', label: 'Prestataires' },
          { key: 'bookings', label: 'Reservations' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-8">
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Prestataires total', value: MOCK_STATS.totalProviders, color: 'text-accent' },
                { label: 'Prestataires actifs', value: MOCK_STATS.activeProviders, color: 'text-green-600' },
                { label: 'En attente', value: MOCK_STATS.pendingProviders, color: 'text-yellow-600' },
                { label: 'Reservations', value: MOCK_STATS.totalBookings, color: 'text-primary' },
                { label: 'Utilisateurs', value: MOCK_STATS.totalUsers, color: 'text-accent' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-black/[0.06]">
                  <p className="text-xs text-gray-500 font-medium uppercase">{kpi.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Pending Providers */}
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Prestataires en attente d'approbation</h2>
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b">
                    <th className="text-left py-3">Nom</th>
                    <th className="text-left py-3">Ville</th>
                    <th className="text-left py-3">Telephone</th>
                    <th className="text-left py-3">Date</th>
                    <th className="text-right py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PENDING.map(p => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-gray-600">{p.city}, {p.commune}</td>
                      <td className="py-3 text-gray-600">{p.phone}</td>
                      <td className="py-3 text-gray-500 text-sm">{p.date}</td>
                      <td className="py-3 text-right">
                        <button className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium mr-2 hover:bg-green-600">
                          Approuver
                        </button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-600">
                          Refuser
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reservations recentes</h2>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b">
                  <th className="text-left py-3">Ref</th>
                  <th className="text-left py-3">Client</th>
                  <th className="text-left py-3">Prestataire</th>
                  <th className="text-left py-3">Service</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_BOOKINGS.map(b => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-sm font-medium">{b.ref}</td>
                    <td className="py-3">{b.client}</td>
                    <td className="py-3">{b.provider}</td>
                    <td className="py-3 text-gray-600">{b.service}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        b.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                        b.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {b.status === 'CONFIRMED' ? 'Confirme' :
                         b.status === 'COMPLETED' ? 'Termine' :
                         b.status === 'REQUESTED' ? 'En attente' : b.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-sm">{b.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tous les prestataires</h2>
            <p className="text-gray-500">Liste complete des prestataires inscrits (a connecter a l'API).</p>
          </div>
        )}
      </main>
    </div>
  );
}
