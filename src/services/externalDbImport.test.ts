import { describe, expect, it } from 'vitest';
import { createEmptyEditorDatabase } from './editorDbService';
import {
  buildFullExternalPackJson,
  buildFullExternalPlayersCsv,
  buildFullExternalTeamsCsv,
  importExternalDatabaseContent,
} from './externalDbImport';

describe('externalDbImport', () => {
  it('esporta il template completo JSON v2 con tutte le 86 squadre', () => {
    const db = createEmptyEditorDatabase();
    const pack = buildFullExternalPackJson(db);
    expect(pack.format).toBe('basket-manager-italia-db');
    expect(pack.version).toBe(2);
    expect(pack.teams.length).toBe(86);
    expect(pack.teams[0].roster?.length).toBe(16);
  });

  it('importa un file JSON v2 parziale facendo match per nome squadra e unendo al DB', () => {
    const db = createEmptyEditorDatabase();
    const firstTeam = buildFullExternalPackJson(db).teams[0];

    const payload = JSON.stringify({
      format: 'basket-manager-italia-db',
      version: 2,
      teams: [
        {
          matchName: firstTeam.matchName,
          name: 'Club Custom Test',
          shortName: 'CCT',
          primaryColor: '#123456',
          roster: [
            {
              firstName: 'Mario',
              lastName: 'Rossi',
              jerseyNumber: 9,
              primaryPosition: 'PG',
              nationality: 'ITA',
              overall: 81,
            },
          ],
        },
      ],
    });

    const res = importExternalDatabaseContent(payload, 'custom.json', db, 'merge');
    expect(res.ok).toBe(true);
    expect(res.teamsUpdated).toBe(1);
    expect(res.rostersUpdated).toBe(1);
    expect(res.playersImported).toBe(1);
    expect(res.db.teams[firstTeam.id!]?.name).toBe('Club Custom Test');
    expect(res.db.rosters[firstTeam.id!]?.[0].lastName).toBe('Rossi');
  });

  it('importa CSV Giocatori con separatore punto e virgola (Excel italiano)', () => {
    const db = createEmptyEditorDatabase();
    const firstTeam = buildFullExternalPackJson(db).teams[0];
    const csv = [
      'teamId;teamName;leagueId;firstName;lastName;jerseyNumber;position;nationality;isItalianFormation;overall',
      `${firstTeam.id};${firstTeam.name};ITA_LBA;Luca;Bianchi;10;SG;ITA;si;77`,
      `${firstTeam.id};${firstTeam.name};ITA_LBA;John;Doe;23;PF;USA;no;83`,
    ].join('\n');

    const res = importExternalDatabaseContent(csv, 'players.csv', db, 'merge');
    expect(res.ok).toBe(true);
    expect(res.rostersUpdated).toBe(1);
    expect(res.playersImported).toBe(2);
    expect(res.db.rosters[firstTeam.id!]?.[0].isItalianFormation).toBe(true);
    expect(res.db.rosters[firstTeam.id!]?.[1].isItalianFormation).toBe(false);
    expect(res.db.rosters[firstTeam.id!]?.[1].overall).toBe(83);
  });

  it('esporta e reimporta CSV Squadre e Giocatori senza errori', () => {
    const db = createEmptyEditorDatabase();
    const teamsCsv = buildFullExternalTeamsCsv(db, 'ITA_LBA');
    const playersCsv = buildFullExternalPlayersCsv(db, 'ITA_LBA');

    const resTeams = importExternalDatabaseContent(teamsCsv, 'teams.csv', db, 'replace');
    expect(resTeams.ok).toBe(true);
    expect(resTeams.teamsUpdated).toBe(16);

    const resPlayers = importExternalDatabaseContent(playersCsv, 'players.csv', resTeams.db, 'merge');
    expect(resPlayers.ok).toBe(true);
    expect(resPlayers.rostersUpdated).toBe(16);
    expect(resPlayers.playersImported).toBe(221);

    const importedGuduric = resPlayers.db.rosters['ita_lba_milano_rossi']?.find(
      (p) => p.lastName === 'Gudurić'
    );
    expect(importedGuduric?.birthDate).toBe('08/03/1995');
    expect(importedGuduric?.age).toBe(31);
  });
});
