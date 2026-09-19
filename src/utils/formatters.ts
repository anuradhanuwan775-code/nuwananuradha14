export function formatCurrency(value: number, decimals?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  
  if (decimals !== undefined) {
    return '$' + value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  if (value >= 1000) {
    return '$' + value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else if (value >= 1) {
    return '$' + value.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  } else {
    return '$' + value.toLocaleString(undefined, {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    });
  }
}

export function formatCompactNumber(value: number): string {
  if (!value || isNaN(value)) return '0';
  if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatTimestamp(timestampSec: number): string {
  if (!timestampSec) return '';
  const d = new Date(timestampSec * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(isoOrMs: string | number): string {
  const d = new Date(isoOrMs);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
