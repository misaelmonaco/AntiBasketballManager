import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  PenTool,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { CustomPlay } from '../../types';
import {
  PlayTemplateKey,
  analyzeCustomPlay,
  parseImportedCustomPlaysJson,
} from '../../engine/customPlayEngine';

const TEMPLATES: { key: PlayTemplateKey; label: string }[] = [
  { key: 'motion_flex', label: 'Flex 4 Fasi' },
  { key: 'horns', label: 'Horns 3PT' },
  { key: 'five_out', label: '5-Out Cut' },
  { key: 'floppy', label: 'Floppy' },
  { key: 'box_set', label: 'Box ATO' },
  { key: 'pnr_side', label: 'Side P&R' },
];

interface CustomPlayLibrarySidebarProps {
  customPlays: CustomPlay[];
  selectedPlayId: string | null;
  onSelectPlay: (id: string) => void;
  onAddTemplate: (key: PlayTemplateKey) => void;
  onDuplicatePlay: (play: CustomPlay) => void;
  onDeletePlay: (id: string) => void;
  onTogglePlayActive: (play: CustomPlay) => void;
  onImportPlays: (plays: CustomPlay[]) => void;
}

export const CustomPlayLibrarySidebar: React.FC<CustomPlayLibrarySidebarProps> = ({
  customPlays,
  selectedPlayId,
  onSelectPlay,
  onAddTemplate,
  onDuplicatePlay,
  onDeletePlay,
  onTogglePlayActive,
  onImportPlays,
}) => {
  const [importOpen, setImportOpen] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleExportJson = () => {
    const payload = JSON.stringify(customPlays, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playbook_schemi_personalizzati.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const res = parseImportedCustomPlaysJson(importText);
    if (res.error) {
      setImportMsg(res.error);
      return;
    }
    onImportPlays(res.plays);
    setImportText('');
    setImportMsg(`Importati ${res.plays.length} schemi con successo.`);
    setImportOpen(false);
  };

  return (
    <div className="xl:col-span-4 fm-card rounded-2xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-white">Playbook Disegnati ({customPlays.length})</h3>
          <p className="text-[11px] text-slate-400">
            Gli schemi attivi vengono eseguiti in partita e animati in 2D.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportJson}
            disabled={customPlays.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] font-bold text-slate-200 cursor-pointer"
            title="Esporta tutti gli schemi in JSON"
          >
            <Download className="w-3.5 h-3.5" />
            Esporta
          </button>
          <button
            type="button"
            onClick={() => {
              setImportOpen((v) => !v);
              setImportMsg(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-sky-300 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Importa
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="rounded-xl bg-slate-950/90 border border-slate-700 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>Incolla JSON o carica file</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                file.text().then((txt) => setImportText(txt));
              }}
              className="text-[10px] text-slate-400 max-w-[160px]"
            />
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={3}
            placeholder='[{"name": "Horns...", ...}]'
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-sky-500"
          />
          {importMsg && <div className="text-[11px] text-amber-300">{importMsg}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={!importText.trim()}
              className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 text-[11px] font-extrabold cursor-pointer"
            >
              Importa Schemi
            </button>
          </div>
        </div>
      )}

      {/* Crea da Zero o da Template */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => onAddTemplate('blank')}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-sm cursor-pointer transition-colors"
        >
          <PenTool className="w-3.5 h-3.5" />
          + Disegna Nuovo Schema da Zero
        </button>

        <div className="space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
            Oppure parti da un Modello Base
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => onAddTemplate(tpl.key)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 text-[11px] font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista Schemi Salvati */}
      <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
        {customPlays.length === 0 ? (
          <div className="rounded-xl bg-slate-950/70 border border-dashed border-slate-800 p-5 text-center text-xs text-slate-400">
            Nessuno schema personalizzato. Clicca &quot;Disegna Nuovo Schema da Zero&quot; o un modello base per iniziare!
          </div>
        ) : (
          customPlays.map((cp) => {
            const info = analyzeCustomPlay(cp);
            const isSelected = selectedPlayId === cp.id;
            return (
              <div
                key={cp.id}
                onClick={() => onSelectPlay(cp.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500'
                    : 'bg-slate-950/75 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate">
                      {cp.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {info.stepCount} Fasi · {info.summaryBadge} · Tiro: <b className="text-emerald-300">{cp.shooterRole}</b>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onDuplicatePlay(cp)}
                      title="Duplica"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePlay(cp.id)}
                      title="Elimina"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between gap-2 text-[10px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-slate-400">{info.bestAgainst}</span>
                  <button
                    type="button"
                    onClick={() => onTogglePlayActive(cp)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                      cp.active
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {cp.active ? 'Attivo in Gara' : 'Inattivo'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
