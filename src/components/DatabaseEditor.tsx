import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  RotateCcw,
  Save,
  Users,
  UserPlus,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  buildFullExternalPackJson,
  buildFullExternalPlayersCsv,
  buildFullExternalTeamsCsv,
  ExternalImportMode,
  ExternalImportResult,
  importExternalDatabaseContent,
} from '../services/externalDbImport';
import { ALL_TEAM_TEMPLATES } from '../data/teams';
import { getForeignLimitForLeague } from '../engine/ratings';
import {
  createRandomCustomPlayerTemplate,
  CustomEditorDatabase,
  CustomPlayerTemplate,
  CustomTeamOverride,
  getDefaultRosterTemplatesForTeam,
  loadEditorDatabase,
  resetEditorDatabase,
  saveEditorDatabase,
} from '../services/editorDbService';
import { LeagueId } from '../types';
import { ClubBadge } from './ClubBadge';
import { PlayerEditorModal } from './editor/PlayerEditorModal';
import { DatabaseClubPanel } from './editor/DatabaseClubPanel';
import { DatabasePlayersTable } from './editor/DatabasePlayersTable';
import { ExternalDbModal } from './editor/ExternalDbModal';
import { DatabaseTeamsSidebar } from './editor/DatabaseTeamsSidebar';
import { DatabaseFreeAgentsPanel } from './editor/DatabaseFreeAgentsPanel';

interface DatabaseEditorProps {
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const DatabaseEditor: React.FC<DatabaseEditorProps> = ({ onClose, onToast }) => {
  const [db, setDb] = useState<CustomEditorDatabase>(() => loadEditorDatabase());
  const [dirty, setDirty] = useState(false);
  const [activeLeague, setActiveLeague] = useState<LeagueId>('ITA_LBA');
  const [search, setSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(ALL_TEAM_TEMPLATES[0].id);
  const [editorTab, setEditorTab] = useState<'club' | 'players' | 'free_agents'>('club');
  const [externalModalOpen, setExternalModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<ExternalImportMode>('merge');
  const [exportScope, setExportScope] = useState<'ALL' | LeagueId>('ALL');
  const [lastImportResult, setLastImportResult] = useState<ExternalImportResult | null>(
    null
  );
  const [editingPlayerIdx, setEditingPlayerIdx] = useState<number | null>(null);
  const [editingFreeAgentIdx, setEditingFreeAgentIdx] = useState<number | null>(null);
  const [creatingPlayer, setCreatingPlayer] = useState<CustomPlayerTemplate | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customFreeAgents = db.freeAgents ?? [];

  const handleOpenCreatePlayer = () => {
    setCreatingPlayer(createRandomCustomPlayerTemplate());
  };

  const handleCreatePlayerSave = (
    created: CustomPlayerTemplate,
    destinationId?: string
  ) => {
    const target = destinationId ?? '__FREE_AGENT__';
    if (target === '__FREE_AGENT__') {
      setDb((prev) => ({
        ...prev,
        freeAgents: [...(prev.freeAgents ?? []), created],
      }));
      setDirty(true);
      setCreatingPlayer(null);
      setEditorTab('free_agents');
      onToast(
        `Creato ${created.firstName} ${created.lastName} in Free Agency (ricorda di salvare il DB).`
      );
      return;
    }

    const existingRoster =
      db.rosters[target] ?? getDefaultRosterTemplatesForTeam(target);
    setDb((prev) => ({
      ...prev,
      rosters: {
        ...prev.rosters,
        [target]: [...existingRoster, created],
      },
    }));
    setDirty(true);
    setCreatingPlayer(null);
    const targetTeamName =
      ALL_TEAM_TEMPLATES.find((t) => t.id === target)?.name ?? target;
    onToast(
      `Creato ${created.firstName} ${created.lastName} in ${targetTeamName} (ricorda di salvare il DB).`
    );
  };

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_TEAM_TEMPLATES.filter((t) => {
      if (t.leagueId !== activeLeague) return false;
      if (!q) return true;
      const ov = db.teams[t.id];
      const effName = (ov?.name ?? t.name).toLowerCase();
      const effCity = (ov?.city ?? t.city).toLowerCase();
      return effName.includes(q) || effCity.includes(q);
    });
  }, [activeLeague, search, db.teams]);

  const baseTpl =
    ALL_TEAM_TEMPLATES.find((t) => t.id === selectedTeamId) ?? ALL_TEAM_TEMPLATES[0];
  const teamOv = db.teams[baseTpl.id] ?? {};
  const effTeam = {
    name: teamOv.name ?? baseTpl.name,
    shortName: teamOv.shortName ?? baseTpl.shortName,
    city: teamOv.city ?? baseTpl.city,
    arena: teamOv.arena ?? baseTpl.arena,
    primaryColor: teamOv.primaryColor ?? baseTpl.primaryColor,
    secondaryColor: teamOv.secondaryColor ?? baseTpl.secondaryColor,
  };

  const currentRoster: CustomPlayerTemplate[] = useMemo(
    () => db.rosters[baseTpl.id] ?? getDefaultRosterTemplatesForTeam(baseTpl.id),
    [db.rosters, baseTpl.id]
  );

  const itaCount = currentRoster.filter((p) => p.isItalianFormation).length;
  const foreignCount = currentRoster.length - itaCount;
  const leagueLimit = getForeignLimitForLeague(baseTpl.leagueId);

  const updateTeamField = <K extends keyof CustomTeamOverride>(
    field: K,
    value: CustomTeamOverride[K]
  ) => {
    setDb((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [baseTpl.id]: {
          ...prev.teams[baseTpl.id],
          [field]: value,
        },
      },
    }));
    setDirty(true);
  };

  const updatePlayerField = <K extends keyof CustomPlayerTemplate>(
    idx: number,
    field: K,
    value: CustomPlayerTemplate[K]
  ) => {
    setDb((prev) => {
      const existing =
        prev.rosters[baseTpl.id] ?? getDefaultRosterTemplatesForTeam(baseTpl.id);
      const nextRoster = existing.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      );
      return {
        ...prev,
        rosters: {
          ...prev.rosters,
          [baseTpl.id]: nextRoster,
        },
      };
    });
    setDirty(true);
  };

  const updatePlayerTemplate = (idx: number, updated: CustomPlayerTemplate) => {
    setDb((prev) => {
      const existing =
        prev.rosters[baseTpl.id] ?? getDefaultRosterTemplatesForTeam(baseTpl.id);
      const nextRoster = existing.map((p, i) => (i === idx ? updated : p));
      return {
        ...prev,
        rosters: {
          ...prev.rosters,
          [baseTpl.id]: nextRoster,
        },
      };
    });
    setDirty(true);
  };

  const handleSave = () => {
    saveEditorDatabase(db);
    setDirty(false);
    onToast(
      'Database personalizzato salvato! Verrà applicato alle nuove carriere.'
    );
  };

  const handleResetTeam = () => {
    setDb((prev) => {
      const nextTeams = { ...prev.teams };
      const nextRosters = { ...prev.rosters };
      delete nextTeams[baseTpl.id];
      delete nextRosters[baseTpl.id];
      return { ...prev, teams: nextTeams, rosters: nextRosters };
    });
    setDirty(true);
    onToast(`Ripristinati i valori predefiniti per ${baseTpl.name}.`);
  };

  const handleResetAll = () => {
    const empty = resetEditorDatabase();
    setDb(empty);
    setDirty(false);
    onToast('Database ripristinato completamente ai valori originali.');
  };

  const downloadTextFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullJson = () => {
    const pack = buildFullExternalPackJson(db, exportScope);
    downloadTextFile(
      JSON.stringify(pack, null, 2),
      `basket_italia_db_${exportScope.toLowerCase()}_${new Date()
        .toISOString()
        .slice(0, 10)}.json`,
      'application/json'
    );
    onToast(`Template JSON (${pack.teams.length} squadre) esportato!`);
  };

  const handleExportPlayersCsv = () => {
    const csv = buildFullExternalPlayersCsv(db, exportScope);
    downloadTextFile(
      csv,
      `basket_italia_giocatori_${exportScope.toLowerCase()}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
    onToast('CSV Giocatori esportato (compatibile con Excel / Google Sheets)!');
  };

  const handleExportTeamsCsv = () => {
    const csv = buildFullExternalTeamsCsv(db, exportScope);
    downloadTextFile(
      csv,
      `basket_italia_squadre_${exportScope.toLowerCase()}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
    onToast('CSV Squadre esportato (compatibile con Excel / Google Sheets)!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importExternalDatabaseContent(
        String(reader.result ?? ''),
        file.name,
        db,
        importMode
      );
      setLastImportResult(result);
      if (!result.ok) {
        onToast(result.error ?? 'Errore durante l’importazione del file.');
        return;
      }
      saveEditorDatabase(result.db);
      setDb(result.db);
      setDirty(false);
      onToast(
        `Importazione completata: ${result.teamsUpdated} club, ${result.rostersUpdated} roster, ${result.playersImported} giocatori.`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const modifiedTeamsCount = Object.keys(db.teams).length;
  const modifiedRostersCount = Object.keys(db.rosters).length;

  return (
    <div className="w-full max-w-6xl fm-panel rounded-2xl shadow-2xl relative z-10 h-[88vh] flex flex-col overflow-hidden border border-white/15">
      {/* Top Bar */}
      <div
        className="relative px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${effTeam.primaryColor}a8 0%, #090d16f5 55%)`,
        }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Editor Database Pre-Carriera
            </h2>
            <p className="text-[11px] text-slate-400">
              {modifiedTeamsCount} club modificati • {modifiedRostersCount} roster personalizzati
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => setExternalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-xs font-bold text-sky-300 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Import / Export Esterno (JSON / CSV)
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-xs font-semibold text-red-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ripristina Tutto
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              dirty
                ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
            }`}
          >
            {dirty ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {dirty ? 'Salva Modifiche' : 'Salvato'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <DatabaseTeamsSidebar
          activeLeague={activeLeague}
          search={search}
          selectedTeamId={selectedTeamId}
          filteredTeams={filteredTeams}
          db={db}
          onSelectLeague={(lgId) => {
            setActiveLeague(lgId);
            const first = ALL_TEAM_TEMPLATES.find((t) => t.leagueId === lgId);
            if (first) setSelectedTeamId(first.id);
          }}
          onChangeSearch={setSearch}
          onSelectTeam={setSelectedTeamId}
        />

        <div className="lg:col-span-8 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <ClubBadge
                shortName={effTeam.shortName}
                primaryColor={effTeam.primaryColor}
                secondaryColor={effTeam.secondaryColor}
                size="md"
              />
              <div>
                <h3 className="text-base font-extrabold text-white">{effTeam.name}</h3>
                <p className="text-xs text-slate-400">
                  {effTeam.city} • {effTeam.arena}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setEditorTab('club')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    editorTab === 'club'
                      ? 'bg-orange-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Club &amp; Colori
                </button>
                <button
                  onClick={() => setEditorTab('players')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    editorTab === 'players'
                      ? 'bg-orange-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Giocatori ({currentRoster.length})
                </button>
                <button
                  onClick={() => setEditorTab('free_agents')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    editorTab === 'free_agents'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Free Agency ({customFreeAgents.length})
                </button>
              </div>

              <button
                onClick={handleOpenCreatePlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Crea Giocatore
              </button>

              <button
                onClick={handleResetTeam}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 cursor-pointer"
              >
                Ripristina Club
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {editorTab === 'club' && (
              <DatabaseClubPanel effTeam={effTeam} onUpdateField={updateTeamField} />
            )}

            {editorTab === 'players' && (
              <DatabasePlayersTable
                roster={currentRoster}
                leagueLimit={leagueLimit}
                itaCount={itaCount}
                foreignCount={foreignCount}
                onUpdatePlayerField={updatePlayerField}
                onOpenPlayerModal={setEditingPlayerIdx}
              />
            )}

            {editorTab === 'free_agents' && (
              <DatabaseFreeAgentsPanel
                customFreeAgents={customFreeAgents}
                onCreateFreeAgent={handleOpenCreatePlayer}
                onEditFreeAgent={setEditingFreeAgentIdx}
                onDeleteFreeAgent={(idx) => {
                  setDb((prev) => ({
                    ...prev,
                    freeAgents: (prev.freeAgents ?? []).filter((_, i) => i !== idx),
                  }));
                  setDirty(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {externalModalOpen && (
        <ExternalDbModal
          exportScope={exportScope}
          importMode={importMode}
          lastImportResult={lastImportResult}
          onChangeExportScope={setExportScope}
          onChangeImportMode={setImportMode}
          onExportPlayersCsv={handleExportPlayersCsv}
          onExportTeamsCsv={handleExportTeamsCsv}
          onExportFullJson={handleExportFullJson}
          onTriggerImportFile={() => fileInputRef.current?.click()}
          onClose={() => setExternalModalOpen(false)}
        />
      )}

      {editingPlayerIdx !== null && currentRoster[editingPlayerIdx] && (
        <PlayerEditorModal
          player={currentRoster[editingPlayerIdx]}
          teamName={effTeam.name}
          onSave={(updated) => {
            updatePlayerTemplate(editingPlayerIdx, updated);
            setEditingPlayerIdx(null);
            onToast(
              `Aggiornato ${updated.firstName} ${updated.lastName} (ricorda di salvare il DB).`
            );
          }}
          onClose={() => setEditingPlayerIdx(null)}
        />
      )}

      {editingFreeAgentIdx !== null && customFreeAgents[editingFreeAgentIdx] && (
        <PlayerEditorModal
          player={customFreeAgents[editingFreeAgentIdx]}
          teamName="Free Agency"
          onSave={(updated) => {
            setDb((prev) => ({
              ...prev,
              freeAgents: (prev.freeAgents ?? []).map((p, i) =>
                i === editingFreeAgentIdx ? updated : p
              ),
            }));
            setDirty(true);
            setEditingFreeAgentIdx(null);
            onToast(
              `Aggiornato ${updated.firstName} ${updated.lastName} in Free Agency.`
            );
          }}
          onClose={() => setEditingFreeAgentIdx(null)}
        />
      )}

      {creatingPlayer && (
        <PlayerEditorModal
          player={creatingPlayer}
          teamName={editorTab === 'free_agents' ? 'Free Agency' : effTeam.name}
          isNew
          destinationOptions={{
            teams: ALL_TEAM_TEMPLATES.map((t) => ({
              id: t.id,
              name: db.teams[t.id]?.name ?? t.name,
            })),
            initialTarget:
              editorTab === 'free_agents' ? '__FREE_AGENT__' : baseTpl.id,
          }}
          onSave={handleCreatePlayerSave}
          onClose={() => setCreatingPlayer(null)}
        />
      )}
    </div>
  );
};
