import {
  DefenseType,
  DefensiveIntensity,
  OffensiveAggression,
  OffensiveFocus,
  OffensivePlayId,
  OpponentDefensiveFocus,
  OpponentPlayerRule,
  PaceType,
  PickAndRollCoverage,
  ReboundPolicy,
  TacticsPreset,
} from '../types';

export interface TacticOption<T extends string> {
  value: T;
  label?: string;
  desc: string;
}

export const PACE_OPTIONS: TacticOption<PaceType>[] = [
  {
    value: 'Controllo',
    desc: 'Possessi lunghi vicino ai 20s, riduce al minimo palle perse e fatica.',
  },
  {
    value: 'Lento',
    desc: 'Gioco ragionato a metà campo, ritmo controllato e buona tenuta atletica.',
  },
  {
    value: 'Bilanciato',
    desc: 'Ritmo FIBA classico, equilibrio tra transizione e metà campo.',
  },
  {
    value: 'Ritmo Alto',
    desc: 'Transizione attiva e prime soluzioni veloci senza forzare ogni azione.',
  },
  {
    value: 'Run & Gun',
    desc: 'Contropiede spinto, più possessi e punteggi alti, consumo energia elevato.',
  },
];

export const OFFENSIVE_FOCUS_OPTIONS: TacticOption<OffensiveFocus>[] = [
  {
    value: 'Tiro da 3',
    desc: 'Spaziature larghe e scarichi sul perimetro per massimizzare i tiri dall’arco.',
  },
  {
    value: 'Gioco interno',
    desc: 'Palla in post basso per lunghi (PF/C) e penetrazioni al ferro.',
  },
  {
    value: 'Pick & Roll',
    desc: 'Collaborazione centrale portatore-lungo per generare vantaggi e scarichi.',
  },
  {
    value: 'Motion',
    desc: 'Circolazione continua e tagli backdoor: +assist, -palle perse, premia IQ.',
  },
  {
    value: 'Isolamento',
    desc: '1vs1 per i migliori creatori dal palleggio: +falli subiti, meno assist.',
  },
  {
    value: 'Transizione',
    desc: 'Corri il campo prima che la difesa si schieri per conclusioni rapide al ferro.',
  },
];

export const AGGRESSION_OPTIONS: TacticOption<OffensiveAggression>[] = [
  {
    value: 'Normale',
    desc: 'Lettura standard della difesa senza forzature particolari.',
  },
  {
    value: 'Attacca il ferro',
    desc: 'Più penetrazioni nel pitturato e falli subiti, leggermente meno triple.',
  },
  {
    value: 'Tiro rapido',
    desc: 'Conclude nei primi secondi dell’azione sfruttando la prima finestra aperta.',
  },
  {
    value: 'Gestione cronometro',
    desc: 'Congela i possessi e limita le palle perse nei minuti caldi.',
  },
];

export const REBOUND_POLICY_OPTIONS: TacticOption<ReboundPolicy>[] = [
  {
    value: 'Aggredisci Rimbalzo',
    desc: 'Manda 3 giocatori a rimbalzo offensivo: +second-chance, ma +contropiedi subiti.',
  },
  {
    value: 'Equilibrato',
    desc: 'Equilibrio tra lotta a rimbalzo offensivo e sicurezza difensiva.',
  },
  {
    value: 'Rientro Difensivo',
    desc: 'Priorità a chiudere il contropiede avversario: -contropiedi subiti, meno rimbalzi in attacco.',
  },
];

export const DEFENSE_OPTIONS: TacticOption<DefenseType>[] = [
  {
    value: 'Uomo',
    desc: 'Marcatura individuale equilibrata su tutto l’arco e nel pitturato.',
  },
  {
    value: 'Cambio Sistematico',
    desc: 'Cambia su ogni blocco per togliere i tiri dal P&R (rischio mismatch interno).',
  },
  {
    value: 'Zona 2-3',
    desc: 'Protegge l’area e limita i falli, concedendo qualcosa sul perimetro.',
  },
  {
    value: 'Zona 3-2',
    desc: 'Copre forte l’arco da 3 punti, lasciando però più spazi nel pitturato.',
  },
  {
    value: 'Zona 1-3-1',
    desc: 'Trappole sugli esterni e linee di passaggio chiuse (+rubate, rischia dagli angoli).',
  },
  {
    value: 'Box-and-One',
    desc: '4 difensori a zona e 1 a uomo fisso sulla stella avversaria per neutralizzarla.',
  },
  {
    value: 'Pressing',
    desc: 'Pressione alta sulla palla: aumenta le rubate ma consuma stamina e causa falli.',
  },
];

export const PNR_COVERAGE_OPTIONS: TacticOption<PickAndRollCoverage>[] = [
  {
    value: 'Drop',
    desc: 'Il lungo protegge il ferro: limita le penetrazioni ma concede pull-up dalla media.',
  },
  {
    value: 'Hedge & Recover',
    desc: 'Uscita forte e recupero equilibrato sul P&R, leggermente più dispendiosa.',
  },
  {
    value: 'Switch',
    desc: 'Cambio immediato sul blocco: toglie la tripla al portatore con possibile mismatch.',
  },
  {
    value: 'Trap',
    desc: 'Raddoppio aggressivo sul portatore: forza palle perse ma espone agli scarichi.',
  },
];

export const DEFENSIVE_INTENSITY_OPTIONS: TacticOption<DefensiveIntensity>[] = [
  {
    value: 'Conservativa',
    desc: 'Evita falli e situazioni di bonus preservando l’energia dei titolari.',
  },
  {
    value: 'Standard',
    desc: 'Contatto e pressione equilibrata secondo i principi di reparto.',
  },
  {
    value: 'Fisica',
    desc: 'Contatto duro e contestazione continua (-% avversarie, ma +falli e +fatica).',
  },
];

export const OPPONENT_FOCUS_OPTIONS: TacticOption<OpponentDefensiveFocus>[] = [
  {
    value: 'Equilibrata',
    desc: 'Copertura standard su tutti gli avversari senza sbilanciarsi.',
  },
  {
    value: 'Raddoppia Stella',
    desc: 'Raddoppio aggressivo sul miglior giocatore avversario in campo.',
  },
  {
    value: 'Chiudi Arco 3PT',
    desc: 'Contesta forte tutti i tiratori da 3 punti, concedendo qualcosa in area.',
  },
  {
    value: 'Proteggi Area',
    desc: 'Intasa il pitturato contro penetrazioni e lunghi, rischiando sul perimetro.',
  },
  {
    value: 'Ferma Transizione',
    desc: 'Taglia le linee di corsa in campo aperto contro squadre Run & Gun.',
  },
  {
    value: 'Attacca i Lunghi',
    desc: 'Cerca contatti continui contro i lunghi avversari per caricarli di falli.',
  },
];

export const OPPONENT_PLAYER_RULE_OPTIONS: TacticOption<OpponentPlayerRule>[] = [
  {
    value: 'Standard',
    desc: 'Marcatura normale secondo il piano di squadra.',
  },
  {
    value: 'Nega Ricezione',
    desc: 'Limita i tiri presi dal giocatore (-volume offensivo, leggero rischio fallo).',
  },
  {
    value: 'Raddoppia',
    desc: 'Raddoppio sistematico al tocco (-% al tiro e +perse, ma può liberare i compagni).',
  },
  {
    value: 'Passa Sotto (3PT)',
    desc: 'Concede spazio sull’arco per togliere la penetrazione (ideale su tiratori deboli).',
  },
  {
    value: 'Caccia Mismatch',
    desc: 'In attacco attacca questo giocatore in difesa sfruttando i punti deboli o i falli.',
  },
];

export interface PlaybookPlayInfo {
  id: OffensivePlayId;
  label: string;
  category: string;
  desc: string;
}

export const PLAYBOOK_PLAYS: PlaybookPlayInfo[] = [
  {
    id: 'pick_and_roll_centrale',
    label: 'Pick & Roll Centrale',
    category: 'P&R',
    desc: 'Blocco alto centrale per creare vantaggio tra playmaker e centro.',
  },
  {
    id: 'horns',
    label: 'Set Horns (1-4 Alto)',
    category: 'Spaziature',
    desc: 'Doppio blocco in punta di 4 e 5 con tiratori pronti negli angoli.',
  },
  {
    id: 'spain_pnr',
    label: 'Spain Pick & Roll',
    category: 'P&R Avanzato',
    desc: 'Blocco sulla palla con contro-blocco cieco sul difensore del lungo rollante.',
  },
  {
    id: 'floppy',
    label: 'Uscita Floppy (Triple)',
    category: 'Perimetro',
    desc: 'Uscita della guardia dai blocchi laterali sul lato debole per tiro da 3.',
  },
  {
    id: 'drive_kick_3pt',
    label: 'Drive & Kick 3PT',
    category: '5-Out',
    desc: 'Penetrazione aggressiva dal palleggio e scarico sul perimetro libero.',
  },
  {
    id: 'high_low',
    label: 'Gioco Alto-Basso (Post)',
    category: 'Post Basso',
    desc: 'Passaggio dal gomito alto al centro sigillato vicino al ferro.',
  },
  {
    id: 'transizione',
    label: 'Transizione & Contropiede',
    category: 'Velocità',
    desc: 'Corsa immediata sulle corsie laterali nei primi 6 secondi del possesso.',
  },
];

export const BUILT_IN_PRESETS: TacticsPreset[] = [
  {
    id: 'preset_base',
    name: 'Tattica Base',
    tactics: {
      pace: 'Bilanciato',
      offensiveFocus: 'Pick & Roll',
      defense: 'Uomo',
      offensiveAggression: 'Normale',
      reboundPolicy: 'Equilibrato',
      pnrCoverage: 'Hedge & Recover',
      defensiveIntensity: 'Standard',
      opponentFocus: 'Equilibrata',
      playbook: ['pick_and_roll_centrale', 'horns', 'floppy'],
    },
  },
  {
    id: 'preset_comeback',
    name: 'Assetto Rimonta',
    tactics: {
      pace: 'Run & Gun',
      offensiveFocus: 'Tiro da 3',
      defense: 'Pressing',
      offensiveAggression: 'Tiro rapido',
      reboundPolicy: 'Aggredisci Rimbalzo',
      pnrCoverage: 'Trap',
      defensiveIntensity: 'Fisica',
      opponentFocus: 'Raddoppia Stella',
      playbook: ['drive_kick_3pt', 'floppy', 'transizione'],
    },
  },
  {
    id: 'preset_lockdown',
    name: 'Gestione Finale',
    tactics: {
      pace: 'Controllo',
      offensiveFocus: 'Motion',
      defense: 'Cambio Sistematico',
      offensiveAggression: 'Gestione cronometro',
      reboundPolicy: 'Rientro Difensivo',
      pnrCoverage: 'Switch',
      defensiveIntensity: 'Conservativa',
      opponentFocus: 'Chiudi Arco 3PT',
      playbook: ['horns', 'pick_and_roll_centrale', 'high_low'],
    },
  },
];
