export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = '+243' + cleaned.slice(1); // Default RDC
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatCurrency(amount: number, currency: 'CDF' | 'XAF' = 'CDF'): string {
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

export function generateRef(prefix: string = 'TKS'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${ref}`;
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parsePagination(query: { page?: string; pageSize?: string }): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize || '20', 10) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function canTransitionBooking(current: string, next: string): boolean {
  const transitions: Record<string, string[]> = {
    REQUESTED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['DEPOSIT_PAID', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
    DEPOSIT_PAID: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
    COMPLETED: ['DISPUTED'],
    CANCELLED: [],
    NO_SHOW: [],
    DISPUTED: ['COMPLETED', 'CANCELLED'],
  };
  return (transitions[current] || []).includes(next);
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function computeEndTime(startTime: string, durationMin: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + durationMin;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}
