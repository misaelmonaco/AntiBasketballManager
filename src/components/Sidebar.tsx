import React, { useState } from 'react';
import {
  LayoutDashboard,
  Mail,
  MessageSquare,
  Star,
  Users,
  ListOrdered,
  Dumbbell,
  CalendarDays,
  Trophy,
  Award,
  Coins,
  Sliders,
  UserCog,
  Binoculars,
  Globe,
  UserPlus,
  Search,
  Shield,
  ChevronDown,
  ChevronRight,
  Save,
  LogOut,
  Download,
  X,
} from 'lucide-react';
import { DashboardTab, useGameStore } from '../store/gameStore';
import { exportCareerToFileDialog, isTauriRuntime } from '../services/saveService';
import { ClubBadge } from './ClubBadge';
import { LEAGUES } from '../data/teams';

interface SidebarItem {
  key: string;
  tab: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOP_ITEMS: SidebarItem[] = [
  { key: 'partite', tab: 'office', label: 'Partite', icon: LayoutDashboard },
  { key: 'messaggi', tab: 'messages', label: 'Mail', icon: Mail },
  { key: 'watchlist', tab: 'free_agents', label: 'Lista di monitoraggio', icon: Star },
];

const CLUB_ITEMS: SidebarItem[] = [
  { key: 'giocatori', tab: 'roster', label: 'Roster', icon: Users },
  { key: 'rotazioni', tab: 'rotations', label: 'Rotazioni', icon: ListOrdered },
  { key: 'allenamento', tab: 'training', label: 'Allenamento', icon: Dumbbell },
  { key: 'calendario', tab: 'calendar', label: 'Calendario', icon: CalendarDays },
  { key: 'classifiche', tab: 'standings', label: 'Classifiche', icon: Trophy },
  { key: 'albo', tab: 'awards', label: "Albo d'Oro", icon: Award },
  { key: 'finanze', tab: 'finances', label: 'Finanze', icon: Coins },
  { key: 'tattiche', tab: 'tactics', label: 'Tattiche', icon: Sliders },
  { key: 'staff', tab: 'staff', label: 'Staff', icon: UserCog },
  { key: 'reclutamento', tab: 'market', label: 'Mercato', icon: Binoculars },
];

const WORLD_ITEMS: SidebarItem[] = [
  { key: 'avversarie', tab: 'opponents', label: 'Squadre Avversarie', icon: Shield },
  { key: 'free_agent', tab: 'free_agents', label: 'Free Agent', icon: UserPlus },
  { key: 'ricerca', tab: 'search', label: 'Ricerca & Scouting', icon: Search },
];

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    career,
    activeChatModal,
    openChatModal,
    saveCurrentCareer,
    exitToMenu,
    setToast,
  } = useGameStore();

  const [selectedKey, setSelectedKey] = useState<string>('partite');
  const [worldOpen, setWorldOpen] = useState<boolean>(true);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);
  const unreadMessages = (career?.messages ?? []).filter((m) => !m.read).length;
  const leagueLabel =
    LEAGUES.find((l) => l.id === userTeam?.leagueId)?.name ?? 'Serie A LBA';

  const handleSelect = (item: SidebarItem) => {
    setSelectedKey(item.key);
    setActiveTab(item.tab);
  };

  const isItemActive = (item: SidebarItem): boolean => {
    if (selectedKey === item.key && activeTab === item.tab) return true;
    const allItems = [...TOP_ITEMS, ...CLUB_ITEMS, ...WORLD_ITEMS];
    const selectedObj = allItems.find((i) => i.key === selectedKey);
    if (selectedObj && selectedObj.tab === activeTab) return false;
    // Fallback if activeTab was changed externally
    const firstMatch = allItems.find((i) => i.tab === activeTab);
    return firstMatch?.key === item.key;
  };

  const handleConfirmSave = async () => {
    setConfirmSaveOpen(false);
    await saveCurrentCareer();
  };

  const handleExport = async () => {
    if (!career) return;
    const ok = await exportCareerToFileDialog(career);
    if (ok) {
      setToast('Salvataggio esportato su file .json.');
    }
  };

  const renderNavItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const active = isItemActive(item);
    return (
      <button
        key={item.key}
        onClick={() => handleSelect(item)}
        className={`relative w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
          active
            ? 'bg-orange-500/15 text-orange-300 font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-orange-400" />
        )}
        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-orange-400' : 'text-slate-400'}`} />
        <span className="truncate flex-1 text-left">{item.label}</span>
        {item.key === 'messaggi' && unreadMessages > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-slate-950 text-[10px] font-black leading-none tabular-nums">
            {unreadMessages}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-60 bg-[#0c111b] border-r border-slate-800/90 flex flex-col justify-between shrink-0 relative overflow-hidden">
      <div className="overflow-y-auto flex-1">
        {/* Top section: Partite, Mail, Chat & Lista di monitoraggio */}
        <div className="py-1.5 border-b border-slate-800/80">
          {TOP_ITEMS.slice(0, 2).map(renderNavItem)}
          <button
            type="button"
            onClick={() => openChatModal({ channel: 'player' })}
            className={`relative w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              activeChatModal !== null
                ? 'bg-orange-500/15 text-orange-300 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            {activeChatModal !== null && (
              <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-orange-400" />
            )}
            <MessageSquare
              className={`w-3.5 h-3.5 shrink-0 ${
                activeChatModal !== null ? 'text-orange-400' : 'text-sky-400'
              }`}
            />
            <span className="truncate flex-1 text-left">Chat &amp; Colloqui</span>
          </button>
          {TOP_ITEMS.slice(2).map(renderNavItem)}
        </div>

        {/* Club Header */}
        {userTeam && (
          <div
            className="px-3.5 py-2.5 border-b border-slate-800/90 flex items-center gap-2.5"
            style={{
              background: `linear-gradient(90deg, ${userTeam.primaryColor}40 0%, #111827 85%)`,
            }}
          >
            <ClubBadge
              shortName={userTeam.shortName}
              primaryColor={userTeam.primaryColor}
              secondaryColor={userTeam.secondaryColor}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-wide text-white truncate">
                {userTeam.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{leagueLabel}</div>
            </div>
          </div>
        )}

        {/* Club Items */}
        <div className="py-1.5 border-b border-slate-800/80">
          {CLUB_ITEMS.map(renderNavItem)}
        </div>

        {/* MONDO Section */}
        <div>
          <button
            onClick={() => setWorldOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900/70 hover:bg-slate-900 border-b border-slate-800/70 text-xs font-black uppercase tracking-wider text-slate-200 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-300" />
              MONDO
            </span>
            {worldOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          {worldOpen && <div className="py-1.5">{WORLD_ITEMS.map(renderNavItem)}</div>}
        </div>
      </div>

      {/* Bottom Save / Export / Exit */}
      <div className="p-2.5 border-t border-slate-800/90 bg-slate-950/90 space-y-1">
        <button
          onClick={() => setConfirmSaveOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 text-xs font-bold transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          Salva Carriera
        </button>

        {isTauriRuntime() && (
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800/80 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Esporta File .JSON
          </button>
        )}

        <button
          onClick={exitToMenu}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Menu Principale
        </button>
      </div>

      {/* Modale conferma salvataggio */}
      {confirmSaveOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fm-modal rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">Conferma Salvataggio</h3>
              <button
                onClick={() => setConfirmSaveOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Vuoi salvare i progressi attuali della carriera nello slot di{' '}
              <span className="font-bold text-orange-400">{userTeam?.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmSaveOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
              >
                Salva Ora
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
