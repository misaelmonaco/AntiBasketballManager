import React from 'react';
import { Download, FileJson, FileSpreadsheet, Upload, X } from 'lucide-react';
import { LEAGUES } from '../../data/teams';
import { ExternalImportMode, ExternalImportResult } from '../../services/externalDbImport';
import { LeagueId } from '../../types';

interface ExternalDbModalProps {
  exportScope: 'ALL' | LeagueId;
  importMode: ExternalImportMode;
  lastImportResult: ExternalImportResult | null;
  onChangeExportScope: (scope: 'ALL' | LeagueId) => void;
  onChangeImportMode: (mode: ExternalImportMode) => void;
  onExportPlayersCsv: () => void;
  onExportTeamsCsv: () => void;
  onExportFullJson: () => void;
  onTriggerImportFile: () => void;
  onClose: () => void;
}

export const ExternalDbModal: React.FC<ExternalDbModalProps> = ({
  exportScope,
  importMode,
  lastImportResult,
  onChangeExportScope,
  onChangeImportMode,
  onExportPlayersCsv,
  onExportTeamsCsv,
  onExportFullJson,
  onTriggerImportFile,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl fm-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h3 className="text-base font-black text-white">
              Import / Export Database Esterno
            </h3>
            <p className="text-xs text-slate-400">
              Modifica squadre e giocatori comodamente in Excel, Google Sheets o JSON e reimporta tutto in un clic.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Step 1: Export Templates */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-black text-white uppercase tracking-wider text-[11px]">
                1. Esporta Template Modificabili
              </div>
              <select
                value={exportScope}
                onChange={(e) => onChangeExportScope(e.target.value as 'ALL' | LeagueId)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold"
              >
                <option value="ALL">Tutte le 5 Leghe (86 squadre)</option>
                {LEAGUES.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    Solo {lg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={onExportPlayersCsv}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                CSV Giocatori (Excel)
              </button>
              <button
                onClick={onExportTeamsCsv}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 font-bold cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                CSV Squadre (Excel)
              </button>
              <button
                onClick={onExportFullJson}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/35 text-orange-300 font-bold cursor-pointer"
              >
                <FileJson className="w-4 h-4 shrink-0" />
                JSON Completo (v2)
              </button>
            </div>
          </div>

          {/* Step 2: Import */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="font-black text-white uppercase tracking-wider text-[11px]">
              2. Importa File Esterno (.json o .csv)
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onChangeImportMode('merge')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  importMode === 'merge'
                    ? 'bg-orange-500/15 border-orange-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">Unisci al DB attuale</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Aggiorna solo le squadre presenti nel file (ideale per pacchetti parziali).
                </div>
              </button>
              <button
                onClick={() => onChangeImportMode('replace')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-red-500/15 border-red-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">Sostituisci tutto il DB</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Azzera le modifiche precedenti e carica solo il contenuto del file.
                </div>
              </button>
            </div>

            <button
              onClick={onTriggerImportFile}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black uppercase tracking-wider cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Seleziona File .json o .csv da Importare
            </button>

            {lastImportResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  lastImportResult.ok
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-red-950/40 border-red-800/60 text-red-200'
                }`}
              >
                {lastImportResult.ok ? (
                  <div className="space-y-1">
                    <div className="font-bold">
                      Importazione riuscita: {lastImportResult.teamsUpdated} club aggiornati,{' '}
                      {lastImportResult.rostersUpdated} roster, {lastImportResult.playersImported}{' '}
                      giocatori importati.
                    </div>
                    {lastImportResult.warnings.length > 0 && (
                      <div className="text-[11px] text-amber-300 max-h-24 overflow-y-auto">
                        Avvisi ({lastImportResult.warnings.length}):{' '}
                        {lastImportResult.warnings.slice(0, 5).join(' • ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="font-bold">{lastImportResult.error}</div>
                )}
              </div>
            )}
          </div>

          {/* Schema reference */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-200">Specifiche Rapide Colonne CSV:</div>
            <div>
              • <strong className="text-slate-300">Giocatori CSV:</strong>{' '}
              <code>teamId,teamName,leagueId,firstName,lastName,jerseyNumber,position,nationality,isItalianFormation,overall</code>
            </div>
            <div>
              • <strong className="text-slate-300">Squadre CSV:</strong>{' '}
              <code>teamId,leagueId,name,shortName,city,arena,primaryColor,secondaryColor</code>
            </div>
            <div>
              • Supporta separatori <code>,</code> e <code>;</code> (Excel italiano). Il match squadra funziona sia per <code>teamId</code> che per nome squadra.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
