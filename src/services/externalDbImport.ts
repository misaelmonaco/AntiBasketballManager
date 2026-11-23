import { ALL_TEAM_TEMPLATES } from '../data/teams';
import {
  computeAgeFromBirthDate,
  getSeasonAgeReferenceDate,
  parseBirthDateToItalian,
} from '../engine/calendarUtils';
import { LeagueId, Nationality, Position } from '../types';
import {
  createEmptyEditorDatabase,
  CustomEditorDatabase,
  CustomPlayerTemplate,
  CustomTeamOverride,
  getDefaultRosterTemplatesForTeam,
} from './editorDbService';

export interface ExternalPlayerEntry {
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  primaryPosition: Position;
  nationality: Nationality;
  isItalianFormation?: boolean;
  overall?: number;
  age?: number;
  birthDate?: string;
}

export interface ExternalTeamEntry {
  /** ID interno squadra (es. "lba_mil"). Opzionale se si usa matchName o name. */
  id?: string;
  /** Nome originale squadra su cui fare il match (es. "Milano Rossi"). */
  matchName?: string;
  /** Nuovo nome squadra (usato anche come fallback di match se id e matchName mancano). */
  name?: string;
  shortName?: string;
  city?: string;
  arena?: string;
  primaryColor?: string;
  secondaryColor?: string;
  roster?: ExternalPlayerEntry[];
}

export interface ExternalDatabasePack {
  format: 'basket-manager-italia-db';
  version: 2;
  exportedAt: string;
  teams: ExternalTeamEntry[];
}

export type ExternalImportMode = 'merge' | 'replace';

export interface ExternalImportResult {
  ok: boolean;
  db: CustomEditorDatabase;
  teamsUpdated: number;
  rostersUpdated: number;
  playersImported: number;
  warnings: string[];
  error?: string;
}

const VALID_POSITIONS: Set<Position> = new Set(['PG', 'SG', 'SF', 'PF', 'C']);
const VALID_NATIONALITIES: Set<Nationality> = new Set([
  'ITA',
  'USA',
  'SRB',
  'ESP',
  'LTU',
  'FRA',
  'GER',
  'ARG',
  'GRE',
  'SLO',
  'CRO',
  'LAT',
]);

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveTeamId(
  idCandidate?: string,
  matchNameCandidate?: string,
  nameCandidate?: string,
  currentDb?: CustomEditorDatabase
): string | null {
  if (idCandidate) {
    const byId = ALL_TEAM_TEMPLATES.find((t) => t.id === idCandidate.trim());
    if (byId) return byId.id;
  }

  const namesToTry = [matchNameCandidate, nameCandidate]
    .filter((n): n is string => Boolean(n && n.trim()))
    .map(normalizeText);

  for (const target of namesToTry) {
    const baseMatch = ALL_TEAM_TEMPLATES.find((t) => normalizeText(t.name) === target);
    if (baseMatch) return baseMatch.id;

    if (currentDb) {
      const overrideMatch = ALL_TEAM_TEMPLATES.find((t) => {
        const ovName = currentDb.teams[t.id]?.name;
        return ovName ? normalizeText(ovName) === target : false;
      });
      if (overrideMatch) return overrideMatch.id;
    }
  }

  return null;
}

function sanitizePosition(raw: unknown): Position | null {
  if (typeof raw !== 'string') return null;
  const upper = raw.trim().toUpperCase() as Position;
  return VALID_POSITIONS.has(upper) ? upper : null;
}

function sanitizeNationality(raw: unknown): Nationality | null {
  if (typeof raw !== 'string') return null;
  const upper = raw.trim().toUpperCase() as Nationality;
  return VALID_NATIONALITIES.has(upper) ? upper : null;
}

function sanitizeHexColor(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toUpperCase() : undefined;
}

function sanitizePlayer(
  raw: Partial<ExternalPlayerEntry> & { position?: unknown },
  fallbackIndex: number
): { player: CustomPlayerTemplate | null; warning?: string } {
  const firstName = String(raw.firstName ?? '').trim();
  const lastName = String(raw.lastName ?? '').trim();
  if (!firstName || !lastName) {
    return { player: null, warning: 'Giocatore saltato: nome o cognome mancante.' };
  }

  const pos = sanitizePosition(raw.primaryPosition ?? raw.position) ?? 'SG';
  const nat = sanitizeNationality(raw.nationality) ?? 'ITA';

  const parsedJersey = Number(raw.jerseyNumber);
  const jerseyNumber =
    Number.isFinite(parsedJersey) && parsedJersey >= 0 && parsedJersey <= 99
      ? Math.round(parsedJersey)
      : (fallbackIndex * 3 + 1) % 99;

  const parsedOvr = Number(raw.overall);
  const overall = Number.isFinite(parsedOvr)
    ? Math.max(35, Math.min(95, Math.round(parsedOvr)))
    : 68;

  const isItalianFormation =
    typeof raw.isItalianFormation === 'boolean' ? raw.isItalianFormation : nat === 'ITA';
  const birthDate = parseBirthDateToItalian(
    typeof raw.birthDate === 'string' ? raw.birthDate : undefined
  );
  const parsedAge = Number(raw.age);
  const ageFromRaw =
    Number.isFinite(parsedAge) && parsedAge >= 15 && parsedAge <= 50
      ? Math.round(parsedAge)
      : undefined;
  const age =
    ageFromRaw ??
    (birthDate ? computeAgeFromBirthDate(birthDate, getSeasonAgeReferenceDate(2026)) : undefined);

  return {
    player: {
      firstName,
      lastName,
      jerseyNumber,
      primaryPosition: pos,
      nationality: nat,
      isItalianFormation,
      overall,
      ...(birthDate ? { birthDate } : {}),
      ...(age !== undefined ? { age } : {}),
    },
  };
}

export function buildFullExternalPackJson(
  db: CustomEditorDatabase,
  leagueFilter?: LeagueId | 'ALL'
): ExternalDatabasePack {
  const templates =
    leagueFilter && leagueFilter !== 'ALL'
      ? ALL_TEAM_TEMPLATES.filter((t) => t.leagueId === leagueFilter)
      : ALL_TEAM_TEMPLATES;

  const teams: ExternalTeamEntry[] = templates.map((tpl) => {
    const ov = db.teams[tpl.id];
    const roster = db.rosters[tpl.id] ?? getDefaultRosterTemplatesForTeam(tpl.id);
    return {
      id: tpl.id,
      matchName: tpl.name,
      name: ov?.name ?? tpl.name,
      shortName: ov?.shortName ?? tpl.shortName,
      city: ov?.city ?? tpl.city,
      arena: ov?.arena ?? tpl.arena,
      primaryColor: ov?.primaryColor ?? tpl.primaryColor,
      secondaryColor: ov?.secondaryColor ?? tpl.secondaryColor,
      roster: roster.map((p) => ({ ...p })),
    };
  });

  return {
    format: 'basket-manager-italia-db',
    version: 2,
    exportedAt: new Date().toISOString(),
    teams,
  };
}

function csvEscape(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildFullExternalPlayersCsv(
  db: CustomEditorDatabase,
  leagueFilter?: LeagueId | 'ALL'
): string {
  const templates =
    leagueFilter && leagueFilter !== 'ALL'
      ? ALL_TEAM_TEMPLATES.filter((t) => t.leagueId === leagueFilter)
      : ALL_TEAM_TEMPLATES;

  const headers = [
    'teamId',
    'teamName',
    'leagueId',
    'firstName',
    'lastName',
    'jerseyNumber',
    'position',
    'nationality',
    'isItalianFormation',
    'overall',
    'birthDate',
  ];

  const rows: string[] = [headers.join(',')];
  for (const tpl of templates) {
    const teamName = db.teams[tpl.id]?.name ?? tpl.name;
    const roster = db.rosters[tpl.id] ?? getDefaultRosterTemplatesForTeam(tpl.id);
    for (const p of roster) {
      rows.push(
        [
          tpl.id,
          teamName,
          tpl.leagueId,
          p.firstName,
          p.lastName,
          p.jerseyNumber,
          p.primaryPosition,
          p.nationality,
          p.isItalianFormation ? 'true' : 'false',
          p.overall,
          p.birthDate ?? '',
        ]
          .map(csvEscape)
          .join(',')
      );
    }
  }

  return '\uFEFF' + rows.join('\n');
}

export function buildFullExternalTeamsCsv(
  db: CustomEditorDatabase,
  leagueFilter?: LeagueId | 'ALL'
): string {
  const templates =
    leagueFilter && leagueFilter !== 'ALL'
      ? ALL_TEAM_TEMPLATES.filter((t) => t.leagueId === leagueFilter)
      : ALL_TEAM_TEMPLATES;

  const headers = [
    'teamId',
    'leagueId',
    'name',
    'shortName',
    'city',
    'arena',
    'primaryColor',
    'secondaryColor',
  ];

  const rows: string[] = [headers.join(',')];
  for (const tpl of templates) {
    const ov = db.teams[tpl.id];
    rows.push(
      [
        tpl.id,
        tpl.leagueId,
        ov?.name ?? tpl.name,
        ov?.shortName ?? tpl.shortName,
        ov?.city ?? tpl.city,
        ov?.arena ?? tpl.arena,
        ov?.primaryColor ?? tpl.primaryColor,
        ov?.secondaryColor ?? tpl.secondaryColor,
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  return '\uFEFF' + rows.join('\n');
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function parseBooleanCell(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  const v = raw.trim().toLowerCase();
  if (['true', '1', 'si', 'sì', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return fallback;
}

function importExternalJson(
  rawJson: string,
  currentDb: CustomEditorDatabase,
  mode: ExternalImportMode
): ExternalImportResult {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawJson) as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      db: currentDb,
      teamsUpdated: 0,
      rostersUpdated: 0,
      playersImported: 0,
      warnings: [],
      error: 'JSON non valido: controlla la sintassi del file.',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      db: currentDb,
      teamsUpdated: 0,
      rostersUpdated: 0,
      playersImported: 0,
      warnings: [],
      error: 'Il file JSON deve contenere un oggetto radice.',
    };
  }

  const baseDb: CustomEditorDatabase =
    mode === 'replace'
      ? createEmptyEditorDatabase()
      : {
          ...currentDb,
          teams: { ...currentDb.teams },
          rosters: { ...currentDb.rosters },
        };

  const warnings: string[] = [];
  let teamsUpdated = 0;
  let rostersUpdated = 0;
  let playersImported = 0;

  // Formato v2 esterno: { teams: ExternalTeamEntry[] }
  if (Array.isArray(parsed.teams)) {
    const entries = parsed.teams as ExternalTeamEntry[];
    for (const entry of entries) {
      const teamId = resolveTeamId(entry.id, entry.matchName, entry.name, baseDb);
      if (!teamId) {
        warnings.push(
          `Squadra ignorata (non trovata): ${entry.id ?? entry.matchName ?? entry.name ?? 'sconosciuta'}`
        );
        continue;
      }

      const ov: CustomTeamOverride = { ...(baseDb.teams[teamId] ?? {}) };
      let hasTeamChange = false;
      if (entry.name?.trim()) {
        ov.name = entry.name.trim();
        hasTeamChange = true;
      }
      if (entry.shortName?.trim()) {
        ov.shortName = entry.shortName.trim().toUpperCase().slice(0, 4);
        hasTeamChange = true;
      }
      if (entry.city?.trim()) {
        ov.city = entry.city.trim();
        hasTeamChange = true;
      }
      if (entry.arena?.trim()) {
        ov.arena = entry.arena.trim();
        hasTeamChange = true;
      }
      const pCol = sanitizeHexColor(entry.primaryColor);
      if (pCol) {
        ov.primaryColor = pCol;
        hasTeamChange = true;
      }
      const sCol = sanitizeHexColor(entry.secondaryColor);
      if (sCol) {
        ov.secondaryColor = sCol;
        hasTeamChange = true;
      }
      if (hasTeamChange) {
        baseDb.teams[teamId] = ov;
        teamsUpdated++;
      }

      if (Array.isArray(entry.roster) && entry.roster.length > 0) {
        const cleanRoster: CustomPlayerTemplate[] = [];
        entry.roster.forEach((rawPlayer, idx) => {
          const { player, warning } = sanitizePlayer(rawPlayer, idx);
          if (player) {
            cleanRoster.push(player);
          } else if (warning) {
            warnings.push(`${teamId}: ${warning}`);
          }
        });
        if (cleanRoster.length > 0) {
          baseDb.rosters[teamId] = cleanRoster;
          rostersUpdated++;
          playersImported += cleanRoster.length;
        }
      }
    }

    baseDb.updatedAt = new Date().toISOString();
    return {
      ok: true,
      db: baseDb,
      teamsUpdated,
      rostersUpdated,
      playersImported,
      warnings,
    };
  }

  // Formato v1 legacy: { teams: Record<string, CustomTeamOverride>, rosters: Record<string, CustomPlayerTemplate[]> }
  const v1Teams =
    parsed.teams && typeof parsed.teams === 'object' && !Array.isArray(parsed.teams)
      ? (parsed.teams as Record<string, CustomTeamOverride>)
      : {};
  const v1Rosters =
    parsed.rosters && typeof parsed.rosters === 'object' && !Array.isArray(parsed.rosters)
      ? (parsed.rosters as Record<string, CustomPlayerTemplate[]>)
      : {};

  for (const [teamId, ov] of Object.entries(v1Teams)) {
    if (!ALL_TEAM_TEMPLATES.some((t) => t.id === teamId)) {
      warnings.push(`Squadra v1 ignorata: ${teamId}`);
      continue;
    }
    baseDb.teams[teamId] = { ...ov };
    teamsUpdated++;
  }

  for (const [teamId, roster] of Object.entries(v1Rosters)) {
    if (!ALL_TEAM_TEMPLATES.some((t) => t.id === teamId) || !Array.isArray(roster)) {
      warnings.push(`Roster v1 ignorato: ${teamId}`);
      continue;
    }
    const cleanRoster: CustomPlayerTemplate[] = [];
    roster.forEach((rawP, idx) => {
      const { player } = sanitizePlayer(rawP, idx);
      if (player) cleanRoster.push(player);
    });
    if (cleanRoster.length > 0) {
      baseDb.rosters[teamId] = cleanRoster;
      rostersUpdated++;
      playersImported += cleanRoster.length;
    }
  }

  baseDb.updatedAt = new Date().toISOString();
  return {
    ok: true,
    db: baseDb,
    teamsUpdated,
    rostersUpdated,
    playersImported,
    warnings,
  };
}

function importExternalCsv(
  rawCsv: string,
  currentDb: CustomEditorDatabase,
  mode: ExternalImportMode
): ExternalImportResult {
  const cleaned = rawCsv.replace(/^\uFEFF/, '').trim();
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      db: currentDb,
      teamsUpdated: 0,
      rostersUpdated: 0,
      playersImported: 0,
      warnings: [],
      error: 'Il file CSV deve contenere almeno l’intestazione e una riga dati.',
    };
  }

  const headerLine = lines[0];
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const headers = parseCsvLine(headerLine, delimiter).map((h) => h.toLowerCase());
  const colIndex = (names: string[]): number => {
    for (const n of names) {
      const idx = headers.indexOf(n.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const baseDb: CustomEditorDatabase =
    mode === 'replace'
      ? createEmptyEditorDatabase()
      : {
          ...currentDb,
          teams: { ...currentDb.teams },
          rosters: { ...currentDb.rosters },
        };

  const warnings: string[] = [];
  const isPlayersCsv = colIndex(['firstName', 'nome']) !== -1 && colIndex(['lastName', 'cognome']) !== -1;

  if (isPlayersCsv) {
    const idxTeamId = colIndex(['teamId', 'idSquadra']);
    const idxTeamName = colIndex(['teamName', 'squadra']);
    const idxFirst = colIndex(['firstName', 'nome']);
    const idxLast = colIndex(['lastName', 'cognome']);
    const idxJersey = colIndex(['jerseyNumber', 'numero', 'maglia']);
    const idxPos = colIndex(['position', 'primaryPosition', 'ruolo']);
    const idxNat = colIndex(['nationality', 'nazionalita', 'nazionalità']);
    const idxItaForm = colIndex(['isItalianFormation', 'formazioneItaliana', 'ita']);
    const idxOvr = colIndex(['overall', 'ovr']);
    const idxBirthDate = colIndex(['birthDate', 'dataDiNascita', 'data_nascita', 'nascita']);
    const idxAge = colIndex(['age', 'eta', 'età']);

    const grouped = new Map<string, CustomPlayerTemplate[]>();
    let playersImported = 0;

    for (let r = 1; r < lines.length; r++) {
      const cells = parseCsvLine(lines[r], delimiter);
      const tId = resolveTeamId(
        idxTeamId !== -1 ? cells[idxTeamId] : undefined,
        idxTeamName !== -1 ? cells[idxTeamName] : undefined,
        undefined,
        baseDb
      );
      if (!tId) {
        warnings.push(`Riga ${r + 1}: squadra non riconosciuta.`);
        continue;
      }

      const nat =
        sanitizeNationality(idxNat !== -1 ? cells[idxNat] : 'ITA') ?? 'ITA';
      const isItaForm = parseBooleanCell(
        idxItaForm !== -1 ? cells[idxItaForm] : undefined,
        nat === 'ITA'
      );
      const rawAgeStr = idxAge !== -1 ? (cells[idxAge] ?? '').trim() : '';
      const parsedAgeNum = rawAgeStr ? Number(rawAgeStr) : undefined;

      const { player, warning } = sanitizePlayer(
        {
          firstName: cells[idxFirst] ?? '',
          lastName: cells[idxLast] ?? '',
          jerseyNumber: idxJersey !== -1 ? Number(cells[idxJersey]) : undefined,
          primaryPosition:
            sanitizePosition(idxPos !== -1 ? cells[idxPos] : 'SG') ?? 'SG',
          nationality: nat,
          isItalianFormation: isItaForm,
          overall: idxOvr !== -1 ? Number(cells[idxOvr]) : undefined,
          birthDate: idxBirthDate !== -1 ? cells[idxBirthDate] : undefined,
          age: parsedAgeNum,
        },
        grouped.get(tId)?.length ?? 0
      );

      if (!player) {
        warnings.push(`Riga ${r + 1}: ${warning ?? 'dati giocatore non validi.'}`);
        continue;
      }

      const list = grouped.get(tId) ?? [];
      list.push(player);
      grouped.set(tId, list);
      playersImported++;
    }

    for (const [tId, roster] of grouped.entries()) {
      baseDb.rosters[tId] = roster;
    }

    baseDb.updatedAt = new Date().toISOString();
    return {
      ok: true,
      db: baseDb,
      teamsUpdated: 0,
      rostersUpdated: grouped.size,
      playersImported,
      warnings,
    };
  }

  // Teams CSV
  const idxId = colIndex(['teamId', 'id']);
  const idxName = colIndex(['name', 'teamName', 'squadra']);
  const idxShort = colIndex(['shortName', 'sigla']);
  const idxCity = colIndex(['city', 'citta', 'città']);
  const idxArena = colIndex(['arena', 'palazzetto']);
  const idxPrimary = colIndex(['primaryColor', 'colore1']);
  const idxSecondary = colIndex(['secondaryColor', 'colore2']);

  if (idxId === -1 && idxName === -1) {
    return {
      ok: false,
      db: currentDb,
      teamsUpdated: 0,
      rostersUpdated: 0,
      playersImported: 0,
      warnings: [],
      error: 'Intestazione CSV non riconosciuta. Usa il template CSV Giocatori o Squadre.',
    };
  }

  let teamsUpdated = 0;
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r], delimiter);
    const tId = resolveTeamId(
      idxId !== -1 ? cells[idxId] : undefined,
      undefined,
      idxName !== -1 ? cells[idxName] : undefined,
      baseDb
    );
    if (!tId) {
      warnings.push(`Riga ${r + 1}: squadra non riconosciuta.`);
      continue;
    }

    const ov: CustomTeamOverride = { ...(baseDb.teams[tId] ?? {}) };
    if (idxName !== -1 && cells[idxName]) ov.name = cells[idxName];
    if (idxShort !== -1 && cells[idxShort]) ov.shortName = cells[idxShort].toUpperCase().slice(0, 4);
    if (idxCity !== -1 && cells[idxCity]) ov.city = cells[idxCity];
    if (idxArena !== -1 && cells[idxArena]) ov.arena = cells[idxArena];
    const pCol = idxPrimary !== -1 ? sanitizeHexColor(cells[idxPrimary]) : undefined;
    if (pCol) ov.primaryColor = pCol;
    const sCol = idxSecondary !== -1 ? sanitizeHexColor(cells[idxSecondary]) : undefined;
    if (sCol) ov.secondaryColor = sCol;

    baseDb.teams[tId] = ov;
    teamsUpdated++;
  }

  baseDb.updatedAt = new Date().toISOString();
  return {
    ok: true,
    db: baseDb,
    teamsUpdated,
    rostersUpdated: 0,
    playersImported: 0,
    warnings,
  };
}

export function importExternalDatabaseContent(
  rawText: string,
  fileName: string,
  currentDb: CustomEditorDatabase,
  mode: ExternalImportMode = 'merge'
): ExternalImportResult {
  const lower = fileName.toLowerCase();
  const trimmed = rawText.trim();
  const looksLikeJson = lower.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[');

  if (looksLikeJson) {
    return importExternalJson(rawText, currentDb, mode);
  }
  return importExternalCsv(rawText, currentDb, mode);
}
