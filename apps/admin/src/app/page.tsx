'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, getAdminToken } from '../lib/api';

// --- Types ---

interface Stats {
  totalProviders: number;
  activeProviders: number;
  pendingProviders: number;
  totalBookings: number;
  totalUsers: number;
}

interface Provider {
  id: string;
  displayName: string;
  slug: string;
  city: string;
  commune: string | null;
  status: string;
  avgRating: number;
  totalReviews: number;
  totalBookings: number;
  idVerified: boolean;
  kycStatus: string;
  createdAt: string;
  user: { name: string; phone: string };
}

interface Booking {
  id: string;
  ref: string;
  status: string;
  date: string;
  startTime: string;
  agreedPrice: number;
  currency: string;
  createdAt: string;
  service: { name: string };
  client: { name: string; phone: string };
  provider: { displayName?: string; user: { name: string } };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  client: { name: string };
  booking: { ref: string; provider: { displayName: string } };
}

interface KycDoc {
  id: string;
  type: string;
  imageUrl: string;
  status: string;
  createdAt: string;
  provider: { id: string; displayName: string; slug: string; city: string; user: { name: string; phone: string } };
}

// --- Status helpers ---

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'En attente', CONFIRMED: 'Confirmée', DEPOSIT_PAID: 'Acompte payé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée',
  NO_SHOW: 'Absent', DISPUTED: 'Litige',
  PENDING: 'En attente', ACTIVE: 'Actif', SUSPENDED: 'Suspendu', INACTIVE: 'Inactif',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-green-100 text-green-700',
  DEPOSIT_PAID: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-600', CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700', ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700', INACTIVE: 'bg-gray-100 text-gray-600',
};

type Tab = 'overview' | 'providers' | 'bookings' | 'reviews' | 'kyc';

// --- Component ---

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push('/login');
      return;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('karysm_admin_user');
      if (saved) setAdminUser(JSON.parse(saved));
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, providersRes, bookingsRes, reviewsRes, kycRes] = await Promise.all([
        adminApi('/admin/stats').catch(() => ({ data: null })),
        adminApi('/admin/providers').catch(() => ({ data: [] })),
        adminApi('/admin/bookings').catch(() => ({ data: [] })),
        adminApi('/admin/reviews').catch(() => ({ data: [] })),
        adminApi('/admin/kyc/pending').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setProviders(providersRes.data || []);
      setBookings(bookingsRes.data || []);
      setReviews(reviewsRes.data || []);
      setKycDocs(kycRes.data || []);
    } catch (err: any) { alert(err.message || 'Erreur de chargement'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (getAdminToken()) fetchData();
  }, [fetchData]);

  async function handleProviderStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      await adminApi(`/admin/providers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setProviders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (err: any) { alert(err.message || 'Erreur'); }
    setActionLoading(null);
  }

  async function handleKycAction(docId: string, action: 'approve' | 'reject') {
    setActionLoading(docId);
    try {
      await adminApi(`/admin/kyc/${docId}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: action === 'reject' ? 'Document non conforme' : undefined }),
      });
      setKycDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) { alert(err.message || 'Erreur'); }
    setActionLoading(null);
  }

  async function handleToggleReview(reviewId: string) {
    setActionLoading(reviewId);
    try {
      const res: any = await adminApi(`/admin/reviews/${reviewId}/visibility`, { method: 'PATCH' });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isVisible: res.data.isVisible } : r));
    } catch (err: any) { alert(err.message || 'Erreur'); }
    setActionLoading(null);
  }

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('karysm_admin_token');
      localStorage.removeItem('karysm_admin_user');
    }
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Vue d\'ensemble' },
    { key: 'providers', label: 'Prestataires', badge: stats?.pendingProviders },
    { key: 'bookings', label: 'Réservations' },
    { key: 'kyc', label: 'KYC', badge: kycDocs.length },
    { key: 'reviews', label: 'Avis' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-accent text-white px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Karysm Admin</h1>
          <p className="text-sm text-white/60">Tableau de bord</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80">{adminUser?.email}</span>
          <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b px-8 flex gap-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <main className="p-8">
        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Prestataires', value: stats.totalProviders, color: 'text-accent' },
                { label: 'Actifs', value: stats.activeProviders, color: 'text-green-600' },
                { label: 'En attente', value: stats.pendingProviders, color: 'text-yellow-600' },
                { label: 'Réservations', value: stats.totalBookings, color: 'text-primary' },
                { label: 'Utilisateurs', value: stats.totalUsers, color: 'text-accent' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-black/[0.06]">
                  <p className="text-xs text-gray-500 font-medium uppercase">{kpi.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Pending providers */}
            {providers.filter(p => p.status === 'PENDING').length > 0 && (
              <div className="bg-white rounded-xl border border-black/[0.06] p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Prestataires en attente ({providers.filter(p => p.status === 'PENDING').length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b">
                        <th className="text-left py-3">Nom</th>
                        <th className="text-left py-3">Ville</th>
                        <th className="text-left py-3">Téléphone</th>
                        <th className="text-left py-3">Date</th>
                        <th className="text-right py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.filter(p => p.status === 'PENDING').map(p => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">{p.displayName}</td>
                          <td className="py-3 text-gray-600">{p.commune ? `${p.commune}, ` : ''}{p.city}</td>
                          <td className="py-3 text-gray-600">{p.user.phone}</td>
                          <td className="py-3 text-gray-500 text-sm">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleProviderStatus(p.id, 'ACTIVE')}
                              disabled={actionLoading === p.id}
                              className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium mr-2 hover:bg-green-600 disabled:opacity-50"
                            >
                              Approuver
                            </button>
                            <button
                              onClick={() => handleProviderStatus(p.id, 'SUSPENDED')}
                              disabled={actionLoading === p.id}
                              className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                            >
                              Refuser
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* KYC pending */}
            {kycDocs.length > 0 && (
              <div className="bg-white rounded-xl border border-black/[0.06] p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Documents KYC en attente ({kycDocs.length})
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  <button onClick={() => setActiveTab('kyc')} className="text-primary hover:underline">
                    Voir tout &rarr;
                  </button>
                </p>
              </div>
            )}

            {/* Recent bookings */}
            <div className="bg-white rounded-xl border border-black/[0.06] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Réservations récentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b">
                      <th className="text-left py-3">Réf</th>
                      <th className="text-left py-3">Client</th>
                      <th className="text-left py-3">Prestataire</th>
                      <th className="text-left py-3">Service</th>
                      <th className="text-left py-3">Statut</th>
                      <th className="text-left py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 10).map(b => (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-3 font-mono text-sm font-medium">{b.ref}</td>
                        <td className="py-3">{b.client.name}</td>
                        <td className="py-3">{b.provider.displayName || b.provider.user.name}</td>
                        <td className="py-3 text-gray-600">{b.service.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[b.status] || b.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-sm">{new Date(b.date).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── PROVIDERS ── */}
        {activeTab === 'providers' && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Tous les prestataires ({providers.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b">
                    <th className="text-left py-3">Nom</th>
                    <th className="text-left py-3">Ville</th>
                    <th className="text-left py-3">Statut</th>
                    <th className="text-left py-3">KYC</th>
                    <th className="text-left py-3">Note</th>
                    <th className="text-left py-3">Bookings</th>
                    <th className="text-left py-3">Téléphone</th>
                    <th className="text-right py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">
                        <span className="font-medium">{p.displayName}</span>
                        {p.idVerified && <span className="ml-1" title="Vérifié">✅</span>}
                      </td>
                      <td className="py-3 text-gray-600">{p.city}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-500">{p.kycStatus || 'N/A'}</td>
                      <td className="py-3 text-sm">
                        <span className="text-terracotta font-medium">{p.avgRating.toFixed(1)}</span>
                        <span className="text-gray-400 ml-1">({p.totalReviews})</span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{p.totalBookings}</td>
                      <td className="py-3 text-gray-600 text-sm">{p.user.phone}</td>
                      <td className="py-3 text-right">
                        {p.status === 'PENDING' && (
                          <button
                            onClick={() => handleProviderStatus(p.id, 'ACTIVE')}
                            disabled={actionLoading === p.id}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium mr-1 hover:bg-green-600 disabled:opacity-50"
                          >
                            Activer
                          </button>
                        )}
                        {p.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleProviderStatus(p.id, 'SUSPENDED')}
                            disabled={actionLoading === p.id}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                          >
                            Suspendre
                          </button>
                        )}
                        {p.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleProviderStatus(p.id, 'ACTIVE')}
                            disabled={actionLoading === p.id}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                          >
                            Réactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Réservations ({bookings.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b">
                    <th className="text-left py-3">Réf</th>
                    <th className="text-left py-3">Client</th>
                    <th className="text-left py-3">Prestataire</th>
                    <th className="text-left py-3">Service</th>
                    <th className="text-left py-3">Prix</th>
                    <th className="text-left py-3">Statut</th>
                    <th className="text-left py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono text-sm font-medium">{b.ref}</td>
                      <td className="py-3">
                        <div className="font-medium text-sm">{b.client.name}</div>
                        <div className="text-xs text-gray-400">{b.client.phone}</div>
                      </td>
                      <td className="py-3 text-sm">{b.provider.displayName || b.provider.user.name}</td>
                      <td className="py-3 text-gray-600 text-sm">{b.service.name}</td>
                      <td className="py-3 text-sm font-medium text-terracotta">
                        {b.agreedPrice.toLocaleString('fr-FR')} {b.currency === 'CDF' ? 'FC' : 'FCFA'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-sm">
                        {new Date(b.date).toLocaleDateString('fr-FR')}
                        <span className="text-gray-400 ml-1">{b.startTime}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── KYC ── */}
        {activeTab === 'kyc' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Documents KYC en attente ({kycDocs.length})
            </h2>
            {kycDocs.length === 0 ? (
              <div className="bg-white rounded-xl border border-black/[0.06] p-12 text-center">
                <p className="text-4xl mb-4">✅</p>
                <p className="text-gray-500">Aucun document en attente de vérification</p>
              </div>
            ) : (
              kycDocs.map(doc => (
                <div key={doc.id} className="bg-white rounded-xl border border-black/[0.06] p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{doc.provider.displayName}</h3>
                      <p className="text-sm text-gray-500">
                        {doc.provider.city} &middot; {doc.provider.user.phone}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Type: <span className="font-medium">{doc.type.replace(/_/g, ' ')}</span>
                        &middot; Soumis le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleKycAction(doc.id, 'approve')}
                        disabled={actionLoading === doc.id}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleKycAction(doc.id, 'reject')}
                        disabled={actionLoading === doc.id}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                  <img
                    src={doc.imageUrl}
                    alt={doc.type}
                    className="w-full max-w-md rounded-lg border border-black/[0.06]"
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Modération des avis ({reviews.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b">
                    <th className="text-left py-3">Client</th>
                    <th className="text-left py-3">Prestataire</th>
                    <th className="text-left py-3">Note</th>
                    <th className="text-left py-3">Commentaire</th>
                    <th className="text-left py-3">Visible</th>
                    <th className="text-left py-3">Date</th>
                    <th className="text-right py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} className={`border-b last:border-0 ${!r.isVisible ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 text-sm font-medium">{r.client.name}</td>
                      <td className="py-3 text-sm">{r.booking.provider.displayName}</td>
                      <td className="py-3">
                        <span className="text-terracotta font-bold">{r.rating}/5</span>
                      </td>
                      <td className="py-3 text-sm text-gray-600 max-w-xs truncate">
                        {r.comment || <span className="text-gray-400 italic">Aucun commentaire</span>}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.isVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.isVisible ? 'Visible' : 'Masqué'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-sm">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleReview(r.id)}
                          disabled={actionLoading === r.id}
                          className={`px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-50 ${
                            r.isVisible
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {r.isVisible ? 'Masquer' : 'Afficher'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
