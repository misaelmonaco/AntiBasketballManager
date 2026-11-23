const ITALIAN_MONTHS_SHORT = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
];

const ITALIAN_MONTHS_FULL = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

const ITALIAN_DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function parseIsoUtc(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function toIsoUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isWeekendDate(isoDate: string): boolean {
  const dow = parseIsoUtc(isoDate).getUTCDay();
  return dow === 0 || dow === 6;
}

export function snapToWeekend(isoDate: string): string {
  const dow = parseIsoUtc(isoDate).getUTCDay();
  if (dow === 0 || dow === 6) return isoDate;
  if (dow === 1) return addDays(isoDate, -1); // Lun -> Dom
  if (dow === 2) return addDays(isoDate, -2); // Mar -> Dom
  if (dow === 3) return addDays(isoDate, 3); // Mer -> Sab
  if (dow === 4) return addDays(isoDate, 2); // Gio -> Sab
  return addDays(isoDate, 1); // Ven -> Sab
}

export function getNextWeekendDate(isoDate: string): string {
  const dow = parseIsoUtc(isoDate).getUTCDay();
  if (dow === 0 || dow === 6) return isoDate;
  return addDays(isoDate, 6 - dow);
}

export function getOffseasonStartDate(seasonYear: number): string {
  // Apertura nuova stagione sportiva e mercato estivo: 1 luglio
  return `${seasonYear}-07-01`;
}

export function getSeasonStartDate(seasonYear: number): string {
  // Terza settimana di settembre (domenica tra il 15 e il 21 settembre)
  for (let day = 15; day <= 21; day++) {
    const iso = `${seasonYear}-09-${String(day).padStart(2, '0')}`;
    if (parseIsoUtc(iso).getUTCDay() === 0) return iso;
  }
  return `${seasonYear}-09-20`;
}

export function getRegularSeasonEndDate(seasonYear: number): string {
  // Fine aprile / inizio maggio dell'anno successivo (sempre weekend)
  return snapToWeekend(`${seasonYear + 1}-05-02`);
}

export function getPlayoffsStartDate(seasonYear: number): string {
  // Metà maggio (sempre weekend)
  return snapToWeekend(`${seasonYear + 1}-05-15`);
}

export function getPlayoffsEndDate(seasonYear: number): string {
  // Fine playoff: intorno al 20 giugno (sempre weekend)
  return snapToWeekend(`${seasonYear + 1}-06-20`);
}

export function getMarketOpenDate(seasonYear: number): string {
  // Inizio mercato estivo: 1 giugno
  return `${seasonYear + 1}-06-01`;
}

export function getRoundDate(seasonYear: number, round: number, totalRounds = 30): string {
  const start = getSeasonStartDate(seasonYear);
  const regEnd = getRegularSeasonEndDate(seasonYear);
  if (round <= totalRounds) {
    if (totalRounds <= 1) return start;
    const totalSpanDays = Math.max(1, daysBetween(start, regEnd));
    const offsetDays = Math.round(((Math.max(1, round) - 1) / (totalRounds - 1)) * totalSpanDays);
    return snapToWeekend(addDays(start, offsetDays));
  }
  // Playoff: da metà maggio fino a fine giugno (tutte le gare nel weekend)
  const poStart = getPlayoffsStartDate(seasonYear);
  const poEnd = getPlayoffsEndDate(seasonYear);
  const poSpan = Math.max(1, daysBetween(poStart, poEnd));
  const poRoundIdx = Math.max(0, round - totalRounds - 1);
  const poOffset = Math.min(poSpan, Math.round((poRoundIdx / 14) * poSpan));
  return snapToWeekend(addDays(poStart, poOffset));
}

export function addDays(isoDate: string, days: number): string {
  const dt = parseIsoUtc(isoDate);
  dt.setUTCDate(dt.getUTCDate() + days);
  return toIsoUtc(dt);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseIsoUtc(fromIso).getTime();
  const b = parseIsoUtc(toIso).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function formatItalianDate(isoDate: string): string {
  const dt = parseIsoUtc(isoDate);
  const dow = ITALIAN_DAYS_SHORT[dt.getUTCDay()];
  const day = dt.getUTCDate();
  const mon = ITALIAN_MONTHS_SHORT[dt.getUTCMonth()];
  const year = dt.getUTCFullYear();
  return `${dow} ${day} ${mon} ${year}`;
}

export function formatItalianMonthYear(year: number, monthIndex0: number): string {
  return `${ITALIAN_MONTHS_FULL[monthIndex0]} ${year}`;
}

export function getIsoYearMonth(isoDate: string): { year: number; monthIndex0: number } {
  const dt = parseIsoUtc(isoDate);
  return { year: dt.getUTCFullYear(), monthIndex0: dt.getUTCMonth() };
}

export function getMonthCalendarCells(year: number, monthIndex0: number): (string | null)[] {
  const firstDay = new Date(Date.UTC(year, monthIndex0, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  // Lunedì = 0 ... Domenica = 6
  const startOffset = (firstDay.getUTCDay() + 6) % 7;

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toIsoUtc(new Date(Date.UTC(year, monthIndex0, d))));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function getSeasonAgeReferenceDate(seasonYear: number): string {
  return `${seasonYear}-09-20`;
}

export function parseBirthDateToItalian(raw?: string): string | undefined {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed || trimmed.toLowerCase() === 'n/d') return undefined;

  let year: number;
  let month: number;
  let day: number;

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    const itMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (!itMatch) return undefined;
    day = Number(itMatch[1]);
    month = Number(itMatch[2]);
    year = Number(itMatch[3]);
  }

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1970 ||
    year > 2015 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined;
  }

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

export function computeAgeFromBirthDate(
  rawBirthDate: string,
  referenceIsoDate = getSeasonAgeReferenceDate(2026)
): number | undefined {
  const normalized = parseBirthDateToItalian(rawBirthDate);
  if (!normalized) return undefined;

  const [bDay, bMonth, bYear] = normalized.split('/').map(Number);
  const [refYear, refMonth, refDay] = referenceIsoDate.split('-').map(Number);
  if (!Number.isFinite(refYear) || !Number.isFinite(refMonth) || !Number.isFinite(refDay)) {
    return undefined;
  }

  let age = refYear - bYear;
  if (refMonth < bMonth || (refMonth === bMonth && refDay < bDay)) {
    age -= 1;
  }

  return age >= 14 && age <= 50 ? age : undefined;
}
