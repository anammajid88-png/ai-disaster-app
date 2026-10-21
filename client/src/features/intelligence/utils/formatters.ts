/**
 * Shared Numeric & Metric Formatters for Disaster Intelligence
 *
 * Ensures consistent precision, prevents raw IEEE 754 floating-point artifacts
 * (e.g. +28.10000000000001%), and clearly labels percentage-point deltas.
 */

const countFmt = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 0,
});

const percentFmt = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Format a percentage value (0 to 100) with 1 decimal place.
 * Example: 91.4%
 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  if (digits === 0) {
    return `${Math.round(value)}%`;
  }
  return `${percentFmt.format(value)}%`;
}

/**
 * Format a difference between two percentage values in percentage points (pp).
 * Example: formatPercentPoints(97.2, 79.0) -> "+18.2 pp"
 *
 * NOTE: Subtracting two percentages produces percentage points (pp), NOT percent growth (%).
 * Calling a 10 pp rise a "10% increase" is mathematically misleading.
 */
export function formatPercentPoints(
  newPercent: number | null | undefined,
  oldPercent: number | null | undefined,
  digits = 1
): string {
  if (
    newPercent === null ||
    newPercent === undefined ||
    oldPercent === null ||
    oldPercent === undefined ||
    !Number.isFinite(newPercent) ||
    !Number.isFinite(oldPercent)
  ) {
    return '—';
  }

  const delta = newPercent - oldPercent;
  // Handle IEEE 754 near-zero floating edge cases
  if (Math.abs(delta) < 0.05) {
    return digits === 0 ? '0 pp' : '0.0 pp';
  }

  const sign = delta > 0 ? '+' : '';
  if (digits === 0) {
    return `${sign}${Math.round(delta)} pp`;
  }
  return `${sign}${percentFmt.format(delta)} pp`;
}

/**
 * Format integer count with locale thousand separators.
 * Example: 244818 -> "244,818"
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  return countFmt.format(Math.round(value));
}

/**
 * Format an integer difference with sign and comma formatting.
 * Example: +12,400 or -3,150
 */
export function formatCountDelta(
  newValue: number | null | undefined,
  oldValue: number | null | undefined
): string {
  if (
    newValue === null ||
    newValue === undefined ||
    oldValue === null ||
    oldValue === undefined ||
    !Number.isFinite(newValue) ||
    !Number.isFinite(oldValue)
  ) {
    return '—';
  }
  const delta = Math.round(newValue - oldValue);
  if (delta === 0) return 'Parity';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${countFmt.format(delta)}`;
}

/**
 * Format duration in hours/minutes.
 * Example: 1.5 -> "1h 30m"
 */
export function formatDuration(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || !Number.isFinite(hours)) {
    return '—';
  }
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format readiness or risk score out of 100.
 */
export function formatScore(score: number | null | undefined, max = 100): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return '—';
  }
  return `${Math.round(score)}/${max}`;
}
