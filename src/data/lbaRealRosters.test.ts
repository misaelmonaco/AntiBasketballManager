import { describe, expect, it } from 'vitest';
import { LBA_REAL_ROSTERS } from './lbaRealRosters';
import { A2_REAL_ROSTERS } from './a2RealRosters';
import { SERIE_B_REAL_ROSTERS } from './serieBRealRosters';
import { ALL_TEAM_TEMPLATES } from './teams';
import { generateLeagueTeams } from './generator';
import { validateRoster6Plus6 } from '../engine/ratings';
import { migrateCareerSave } from '../engine/saveMigration';
import { getDefaultRosterTemplatesForTeam } from '../services/editorDbService';
import { CareerSave } from '../types';

describe('LBA real rosters', () => {
  it('populates all 16 LBA teams with real players', () => {
    const lbaTeams = ALL_TEAM_TEMPLATES.filter((t) => t.leagueId === 'ITA_LBA');
    expect(lbaTeams).toHaveLength(16);

    let totalPlayers = 0;
    for (const team of lbaTeams) {
      const roster = LBA_REAL_ROSTERS[team.id];
      expect(roster, `Missing roster for ${team.name} (${team.id})`).toBeDefined();
      expect(roster.length).toBeGreaterThanOrEqual(11);
      totalPlayers += roster.length;

      // Also verify editorDbService returns the real roster by default
      const defaultRoster = getDefaultRosterTemplatesForTeam(team.id);
      expect(defaultRoster.length).toBe(roster.length);
      expect(defaultRoster[0].lastName).toBe(roster[0].lastName);
    }

    expect(totalPlayers).toBe(221);
  });

  it('preserves heightCm, secondaryPosition, Italian formation flags, and CSV overalls', () => {
    const roma = LBA_REAL_ROSTERS['ita_lba_roma_basket'];
    const mannion = roma.find((p) => p.lastName === 'Mannion');
    expect(mannion).toBeDefined();
    expect(mannion?.heightCm).toBe(190);
    expect(mannion?.isItalianFormation).toBe(true);
    expect(mannion?.overall).toBe(80);

    const olynyk = roma.find((p) => p.lastName === 'Olynyk');
    expect(olynyk?.overall).toBe(84);

    const strautins = roma.find((p) => p.lastName === 'Strautiņš');
    expect(strautins).toBeDefined();
    expect(strautins?.isItalianFormation).toBe(true);
    expect(strautins?.nationality).toBe('LAT');
    expect(strautins?.overall).toBe(76);

    const trento = LBA_REAL_ROSTERS['ita_lba_trento_eagles'];
    const bayehe = trento.find((p) => p.lastName === 'Bayehe');
    expect(bayehe).toBeDefined();
    expect(bayehe?.primaryPosition).toBe('PF');
    expect(bayehe?.secondaryPosition).toBe('C');
    expect(bayehe?.isItalianFormation).toBe(true);
    expect(bayehe?.overall).toBe(74);

    const milano = LBA_REAL_ROSTERS['ita_lba_milano_rossi'];
    expect(milano.find((p) => p.lastName === 'Gudurić')?.overall).toBe(84);

    const bologna = LBA_REAL_ROSTERS['ita_lba_v_nera_bologna'];
    expect(bologna.find((p) => p.lastName === 'Klintman')?.overall).toBe(82);
  });

  it('populates all 20 Serie A2 teams with real players and CSV overalls', () => {
    const a2Teams = ALL_TEAM_TEMPLATES.filter((t) => t.leagueId === 'ITA_A2');
    expect(a2Teams).toHaveLength(20);

    let totalPlayers = 0;
    for (const team of a2Teams) {
      const roster = A2_REAL_ROSTERS[team.id];
      expect(roster, `Missing A2 roster for ${team.name} (${team.id})`).toBeDefined();
      expect(roster.length).toBeGreaterThanOrEqual(10);
      totalPlayers += roster.length;

      const defaultRoster = getDefaultRosterTemplatesForTeam(team.id);
      expect(defaultRoster.length).toBe(roster.length);
      expect(defaultRoster[0].lastName).toBe(roster[0].lastName);
    }

    expect(totalPlayers).toBe(230);

    const avellino = A2_REAL_ROSTERS['ita_a2_basket_avellino'];
    expect(avellino.find((p) => p.lastName === 'Mussini')?.overall).toBe(74);
    expect(avellino.find((p) => p.lastName === 'Francis')?.overall).toBe(77);

    const brindisi = A2_REAL_ROSTERS['ita_a2_stella_brindisi'];
    expect(brindisi.find((p) => p.lastName === 'Cinciarini')?.overall).toBe(75);

    const urania = A2_REAL_ROSTERS['ita_a2_wildcat_milano'];
    expect(urania.find((p) => p.lastName === 'Gentile' && p.firstName === 'Alessandro')?.overall).toBe(76);
  });

  it('generates players whose overall and role attributes match CSV overall values', () => {
    const teams = generateLeagueTeams();
    const milano = teams.find((t) => t.id === 'ita_lba_milano_rossi')!;
    const guduric = milano.roster.find((p) => p.lastName === 'Gudurić')!;
    const wright = milano.roster.find((p) => p.lastName === 'Wright')!;

    expect(guduric.overall).toBe(84);
    expect(wright.overall).toBe(81);
    expect(wright.primaryPosition).toBe('C');
    expect(wright.attributes.rebounding).toBeGreaterThan(wright.attributes.ballHandling);

    const avellino = teams.find((t) => t.id === 'ita_a2_basket_avellino')!;
    const mussini = avellino.roster.find((p) => p.lastName === 'Mussini')!;
    expect(mussini.overall).toBe(74);
    expect(mussini.primaryPosition).toBe('PG');
    expect(mussini.attributes.passing).toBeGreaterThan(mussini.attributes.blocks);
  });

  it('populates all 36 Serie B teams (Girone A e Girone B) with real players', () => {
    const bTeams = ALL_TEAM_TEMPLATES.filter(
      (t) => t.leagueId === 'ITA_B' || t.leagueId === 'ITA_B2'
    );
    expect(bTeams).toHaveLength(36);

    let totalPlayers = 0;
    for (const team of bTeams) {
      const roster = SERIE_B_REAL_ROSTERS[team.id];
      expect(roster, `Missing Serie B roster for ${team.name} (${team.id})`).toBeDefined();
      expect(roster.length).toBeGreaterThanOrEqual(10);
      totalPlayers += roster.length;

      const defaultRoster = getDefaultRosterTemplatesForTeam(team.id);
      expect(defaultRoster.length).toBe(roster.length);
      expect(defaultRoster[0].lastName).toBe(roster[0].lastName);
    }

    expect(totalPlayers).toBe(501);
  });

  it('parses real LBA birth dates, computes season-start ages, handles N/D reserves, and backfills legacy saves', () => {
    const allLbaTemplates = Object.values(LBA_REAL_ROSTERS).flat();
    const withBirthDate = allLbaTemplates.filter((p) => Boolean(p.birthDate));
    expect(allLbaTemplates).toHaveLength(221);
    expect(withBirthDate).toHaveLength(214);
    expect(
      LBA_REAL_ROSTERS['ita_lba_roma_basket'].find((p) => p.lastName === 'Odzebe')
    ).toBeUndefined();

    const trentoTpl = LBA_REAL_ROSTERS['ita_lba_trento_eagles'];
    const forrayTpl = trentoTpl.find((p) => p.lastName === 'Forray')!;
    expect(forrayTpl.birthDate).toBe('20/03/1986');
    expect(forrayTpl.age).toBe(40);
    const fezzaniTpl = trentoTpl.find((p) => p.lastName === 'Fezzani')!;
    expect(fezzaniTpl.birthDate).toBeUndefined();
    expect(fezzaniTpl.age).toBeUndefined();

    const bolognaTpl = LBA_REAL_ROSTERS['ita_lba_v_nera_bologna'];
    const hackettTpl = bolognaTpl.find((p) => p.lastName === 'Hackett')!;
    expect(hackettTpl.birthDate).toBe('19/12/1987');
    expect(hackettTpl.age).toBe(38);

    const udineTpl = LBA_REAL_ROSTERS['ita_lba_udine_bk'];
    const valentineTpl = udineTpl.find((p) => p.lastName === 'Valentine')!;
    expect(valentineTpl.birthDate).toBe('16/11/1993');
    expect(valentineTpl.age).toBe(32);

    const teams = generateLeagueTeams();
    const roma = teams.find((t) => t.id === 'ita_lba_roma_basket')!;
    const mannion = roma.roster.find((p) => p.lastName === 'Mannion')!;
    expect(mannion.birthDate).toBe('14/03/2001');
    expect(mannion.age).toBe(25);

    const cantu = teams.find((t) => t.id === 'ita_lba_cantu_basket')!;
    const ventura = cantu.roster.find((p) => p.lastName === 'Ventura')!;
    expect(ventura.birthDate).toBe('06/06/2009');
    expect(ventura.age).toBe(17);

    const milano = teams.find((t) => t.id === 'ita_lba_milano_rossi')!;
    const guduric = milano.roster.find((p) => p.lastName === 'Gudurić')!;
    expect(guduric.birthDate).toBe('08/03/1995');
    expect(guduric.age).toBe(31);

    const trento = teams.find((t) => t.id === 'ita_lba_trento_eagles')!;
    const fezzani = trento.roster.find((p) => p.lastName === 'Fezzani')!;
    expect(fezzani.rosterSlot).toBe('reserve');
    expect(fezzani.age).toBeGreaterThanOrEqual(18);
    expect(fezzani.age).toBeLessThanOrEqual(20);

    const reggiana = teams.find((t) => t.id === 'ita_lba_reggio_basket')!;
    const rossato = reggiana.roster.find((p) => p.lastName === 'Rossato')!;
    expect(['bench', 'reserve']).toContain(rossato.rosterSlot);
    expect(rossato.age).toBeGreaterThanOrEqual(18);
    expect(rossato.age).toBeLessThanOrEqual(20);

    // Backfill su salvataggio legacy con età/date errate
    const legacyCareer: CareerSave = {
      version: 1,
      slotId: 'legacy_birth_test',
      slotName: 'Legacy Birth',
      savedAt: '2026-09-20T00:00:00.000Z',
      managerName: 'Coach Test',
      userTeamId: milano.id,
      seasonYear: 2027,
      currentRound: 1,
      phase: 'regular',
      teams: [
        {
          ...milano,
          roster: milano.roster.map((p) =>
            p.lastName === 'Gudurić' ? { ...p, age: 21, birthDate: '01/01/2005' } : p
          ),
        },
      ],
      freeAgents: [],
      staffMarket: [],
      scoutedPlayerIds: [],
      activeScouting: [],
      incomingOffers: [],
      schedule: [],
      playoffs: [],
      news: [],
    };
    const migrated = migrateCareerSave(legacyCareer);
    const migratedGuduric = migrated.teams[0].roster.find((p) => p.lastName === 'Gudurić')!;
    expect(migratedGuduric.birthDate).toBe('08/03/1995');
    expect(migratedGuduric.age).toBe(32);
  });

  it('parses real Serie A2 birth dates, jersey numbers, N/D youth fallbacks, and backfills legacy saves', () => {
    const allA2Templates = Object.values(A2_REAL_ROSTERS).flat();
    const withBirthDate = allA2Templates.filter((p) => Boolean(p.birthDate));
    expect(allA2Templates).toHaveLength(230);
    expect(withBirthDate).toHaveLength(225);

    const avellinoTpl = A2_REAL_ROSTERS['ita_a2_basket_avellino'];
    const mussiniTpl = avellinoTpl.find((p) => p.lastName === 'Mussini')!;
    expect(mussiniTpl.birthDate).toBe('12/03/1996');
    expect(mussiniTpl.age).toBe(30);
    expect(mussiniTpl.jerseyNumber).toBe(4);
    const zeriniTpl = avellinoTpl.find((p) => p.lastName === 'Zerini')!;
    expect(zeriniTpl.birthDate).toBe('25/10/1988');
    expect(zeriniTpl.age).toBe(37);
    expect(zeriniTpl.jerseyNumber).toBe(0);

    const centoTpl = A2_REAL_ROSTERS['ita_a2_cento_basket'];
    const aradoriTpl = centoTpl.find((p) => p.lastName === 'Aradori')!;
    expect(aradoriTpl.birthDate).toBe('09/12/1988');
    expect(aradoriTpl.age).toBe(37);
    expect(aradoriTpl.jerseyNumber).toBe(10);

    const uraniaTpl = A2_REAL_ROSTERS['ita_a2_wildcat_milano'];
    const stefanoGentileTpl = uraniaTpl.find(
      (p) => p.firstName === 'Stefano' && p.lastName === 'Gentile'
    )!;
    expect(stefanoGentileTpl.birthDate).toBe('20/08/1989');
    expect(stefanoGentileTpl.age).toBe(37);
    expect(stefanoGentileTpl.jerseyNumber).toBe(22);

    const rietiTpl = A2_REAL_ROSTERS['ita_a2_rieti_bk'];
    const attanasioTpl = rietiTpl.find((p) => p.lastName === 'Attanasio')!;
    expect(attanasioTpl.birthDate).toBe('22/12/2010');
    expect(attanasioTpl.age).toBe(15);

    const teams = generateLeagueTeams();
    const brindisi = teams.find((t) => t.id === 'ita_a2_stella_brindisi')!;
    const cinciarini = brindisi.roster.find((p) => p.lastName === 'Cinciarini')!;
    expect(cinciarini.birthDate).toBe('21/06/1986');
    expect(cinciarini.age).toBe(40);
    expect(cinciarini.jerseyNumber).toBe(40);
    const molinaro = brindisi.roster.find((p) => p.lastName === 'Molinaro')!;
    expect(molinaro.jerseyNumber).toBe(5);
    expect(molinaro.age).toBeGreaterThanOrEqual(18);
    expect(molinaro.age).toBeLessThanOrEqual(20);

    const cento = teams.find((t) => t.id === 'ita_a2_cento_basket')!;
    const tarallo = cento.roster.find((p) => p.lastName === 'Tarallo')!;
    expect(tarallo.birthDate).toBe('18/05/2004');
    expect(tarallo.age).toBe(22);
    expect(tarallo.jerseyNumber).toBe(17);

    const mestre = teams.find((t) => t.id === 'ita_a2_m_mestre')!;
    const bernardina = mestre.roster.find((p) => p.lastName === 'Dalla Bernardina')!;
    expect(bernardina.jerseyNumber).toBe(95);
    expect(bernardina.birthDate).toBe('07/03/2009');
    expect(bernardina.age).toBe(17);
    const zacchigna = mestre.roster.find((p) => p.lastName === 'Zacchigna')!;
    expect(zacchigna.jerseyNumber).toBe(11);
    expect(zacchigna.birthDate).toBe('16/06/2004');
    expect(zacchigna.age).toBe(22);

    const cividale = teams.find((t) => t.id === 'ita_a2_friuli_basket')!;
    const mobio = cividale.roster.find((p) => p.lastName === 'Mobio')!;
    expect(mobio.jerseyNumber).toBe(0);
    expect(mobio.birthDate).toBe('12/10/2004');
    expect(mobio.age).toBe(21);

    const urania = teams.find((t) => t.id === 'ita_a2_wildcat_milano')!;
    const calvio = urania.roster.find((p) => p.lastName === 'Calvio')!;
    expect(calvio.age).toBeGreaterThanOrEqual(18);
    expect(calvio.age).toBeLessThanOrEqual(20);

    const avellino = teams.find((t) => t.id === 'ita_a2_basket_avellino')!;
    const zerini = avellino.roster.find((p) => p.lastName === 'Zerini')!;
    expect(zerini.jerseyNumber).toBe(0);
    expect(zerini.birthDate).toBe('25/10/1988');
    expect(zerini.age).toBe(37);

    // Backfill su salvataggio legacy A2
    const legacyCareer: CareerSave = {
      version: 1,
      slotId: 'legacy_a2_birth_test',
      slotName: 'Legacy A2 Birth',
      savedAt: '2026-09-20T00:00:00.000Z',
      managerName: 'Coach Test',
      userTeamId: brindisi.id,
      seasonYear: 2027,
      currentRound: 1,
      phase: 'regular',
      teams: [
        {
          ...brindisi,
          roster: brindisi.roster.map((p) =>
            p.lastName === 'Cinciarini' ? { ...p, age: 24, birthDate: '01/01/2002' } : p
          ),
        },
      ],
      freeAgents: [],
      staffMarket: [],
      scoutedPlayerIds: [],
      activeScouting: [],
      incomingOffers: [],
      schedule: [],
      playoffs: [],
      news: [],
    };
    const migrated = migrateCareerSave(legacyCareer);
    const migratedCinciarini = migrated.teams[0].roster.find(
      (p) => p.lastName === 'Cinciarini'
    )!;
    expect(migratedCinciarini.birthDate).toBe('21/06/1986');
    expect(migratedCinciarini.age).toBe(41);
  });

  it('validates all 36 Serie B teams compliance, OVR-sorted foreign selection, birth dates, and anomaly handling', () => {
    const allBTemplates = Object.values(SERIE_B_REAL_ROSTERS).flat();
    expect(allBTemplates).toHaveLength(501);
    expect(allBTemplates.filter((p) => Boolean(p.birthDate))).toHaveLength(472);

    const napoliEstTpl = SERIE_B_REAL_ROSTERS['ita_b2_napoli_est_bk'];
    const marksSupeRows = napoliEstTpl.filter(
      (p) => p.firstName === 'Marks' && p.lastName === 'Supe'
    );
    expect(marksSupeRows).toHaveLength(1);
    expect(marksSupeRows[0].jerseyNumber).toBe(7);
    expect(marksSupeRows[0].primaryPosition).toBe('PG');
    expect(marksSupeRows[0].birthDate).toBe('23/03/2009');
    expect(marksSupeRows[0].age).toBe(17);

    // Date corrotte scartate sui template Serie B
    const piazzaTpl = SERIE_B_REAL_ROSTERS['ita_b_piazza_armerina_bk'];
    expect(piazzaTpl.find((p) => p.lastName === 'Dioumessy')?.birthDate).toBeUndefined();
    const vicenzaTpl = SERIE_B_REAL_ROSTERS['ita_b_vicenza_basket'];
    expect(
      vicenzaTpl.find(
        (p) => p.firstName === 'Oliver Seamus' && p.lastName === 'Lynch-Daniels'
      )?.birthDate
    ).toBeUndefined();
    const luccaTpl = SERIE_B_REAL_ROSTERS['ita_b2_lucca_bk'];
    expect(luccaTpl.find((p) => p.lastName === 'Dubois')?.birthDate).toBeUndefined();

    // Verifica generatore su tutte le 36 squadre di Serie B
    const teams = generateLeagueTeams();
    const serieBTeams = teams.filter(
      (t) => t.leagueId === 'ITA_B' || t.leagueId === 'ITA_B2'
    );
    expect(serieBTeams).toHaveLength(36);
    for (const team of serieBTeams) {
      const validation = validateRoster6Plus6(team.roster, team.leagueId);
      expect(
        validation.valid,
        `Non-compliant Serie B roster for ${team.name}: ${validation.errors.join('; ')}`
      ).toBe(true);
    }

    // Faenza: lo straniero titolare deve essere Stankevicius (OVR 70), non Rustenaj (OVR 52)
    const faenza = serieBTeams.find((t) => t.id === 'ita_b2_faenza_bk')!;
    const stankevicius = faenza.roster.find((p) => p.lastName === 'Stankevicius')!;
    const rustenaj = faenza.roster.find((p) => p.lastName === 'Rustenaj')!;
    expect(stankevicius.overall).toBe(70);
    expect(stankevicius.nationality).toBe('LTU');
    expect(stankevicius.jerseyNumber).toBe(4);
    expect(stankevicius.birthDate).toBe('01/04/1998');
    expect(stankevicius.age).toBe(28);
    expect(stankevicius.rosterSlot).not.toBe('reserve');
    expect(rustenaj.rosterSlot).toBe('reserve');

    // Francesco Iacono Quarantino (nato 01/11/2011 -> 14 anni al 20/09/2026)
    const agrigento = serieBTeams.find((t) => t.id === 'ita_b_agrigento_bk')!;
    const quarantino = agrigento.roster.find((p) => p.lastName === 'Iacono Quarantino')!;
    expect(quarantino.birthDate).toBe('01/11/2011');
    expect(quarantino.age).toBe(14);

    // Date corrotte hanno fallback valido nei team generati
    const lucca = serieBTeams.find((t) => t.id === 'ita_b2_lucca_bk')!;
    const dubois = lucca.roster.find((p) => p.lastName === 'Dubois')!;
    expect(dubois.age).toBeGreaterThanOrEqual(18);
    expect(dubois.age).toBeLessThanOrEqual(34);

    // Capo d'Orlando: Simas Jasaitis
    const cdo = serieBTeams.find((t) => t.id === 'ita_b_capo_d_orlando_bk')!;
    const jasaitis = cdo.roster.find((p) => p.lastName === 'Jasaitis')!;
    expect(jasaitis.nationality).toBe('LTU');
    expect(jasaitis.overall).toBe(70);
    expect(jasaitis.jerseyNumber).toBe(13);
    expect(jasaitis.birthDate).toBe('26/03/1982');
    expect(jasaitis.age).toBe(44);

    // Virtus Roma GVM: David Jelinek + Flavio Talone (invertito corretto) + Giannis Odzebe (solo Serie B)
    const virtusRoma = serieBTeams.find((t) => t.id === 'ita_b2_vir_roma_60')!;
    const jelinek = virtusRoma.roster.find((p) => p.lastName === 'Jelinek')!;
    expect(jelinek.overall).toBe(72);
    expect(jelinek.jerseyNumber).toBe(22);
    expect(jelinek.birthDate).toBe('07/09/1990');
    expect(jelinek.age).toBe(36);
    const talone = virtusRoma.roster.find(
      (p) => p.firstName === 'Flavio' && p.lastName === 'Talone'
    );
    expect(talone).toBeDefined();
    const odzebeB = SERIE_B_REAL_ROSTERS['ita_b2_vir_roma_60'].find(
      (p) => p.firstName === 'Giannis' && p.lastName === 'Odzebe'
    );
    expect(odzebeB).toBeDefined();
    expect(odzebeB?.primaryPosition).toBe('SF');
    expect(odzebeB?.birthDate).toBe('23/11/2008');
    expect(odzebeB?.age).toBe(17);

    // Campione di nomi composti/patronimici corretti in Serie B
    expect(
      SERIE_B_REAL_ROSTERS['ita_b_ferrara_basket'].find(
        (p) => p.firstName === 'Lucio Gabriel' && p.lastName === 'Delfino'
      )
    ).toBeDefined();
    expect(
      SERIE_B_REAL_ROSTERS['ita_b2_lucca_bk'].find(
        (p) => p.firstName === 'Gian Marco' && p.lastName === 'Drocker'
      )
    ).toBeDefined();
    expect(
      SERIE_B_REAL_ROSTERS['ita_b2_roma_l'].find(
        (p) => p.firstName === 'Juan Manuel' && p.lastName === 'Fernandez'
      )
    ).toBeDefined();
    expect(
      SERIE_B_REAL_ROSTERS['ita_b2_roseto_bk'].find(
        (p) => p.firstName === 'Kirill' && p.lastName === 'Selefenkov'
      )
    ).toBeDefined();
    expect(
      SERIE_B_REAL_ROSTERS['ita_b2_san_severo_bk'].find(
        (p) => p.firstName === 'René Maurice' && p.lastName === 'Ndour'
      )
    ).toBeDefined();

    // Backfill su salvataggio legacy Serie B
    const legacyCareer: CareerSave = {
      version: 1,
      slotId: 'legacy_b_birth_test',
      slotName: 'Legacy B Birth',
      savedAt: '2026-09-20T00:00:00.000Z',
      managerName: 'Coach Test',
      userTeamId: cdo.id,
      seasonYear: 2027,
      currentRound: 1,
      phase: 'regular',
      teams: [
        {
          ...cdo,
          roster: cdo.roster.map((p) =>
            p.lastName === 'Jasaitis' ? { ...p, age: 25, birthDate: '01/01/2001' } : p
          ),
        },
      ],
      freeAgents: [],
      staffMarket: [],
      scoutedPlayerIds: [],
      activeScouting: [],
      incomingOffers: [],
      schedule: [],
      playoffs: [],
      news: [],
    };
    const migrated = migrateCareerSave(legacyCareer);
    const migratedJasaitis = migrated.teams[0].roster.find((p) => p.lastName === 'Jasaitis')!;
    expect(migratedJasaitis.birthDate).toBe('26/03/1982');
    expect(migratedJasaitis.age).toBe(45);
  });
});
