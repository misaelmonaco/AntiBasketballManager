import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { MainMenu } from './components/MainMenu';
import { Sidebar } from './components/Sidebar';
import { OfficeView } from './components/OfficeView';
import { MessagesView } from './components/MessagesView';
import { RosterView } from './components/RosterView';
import { RotationsView } from './components/RotationsView';
import { TacticsView } from './components/TacticsView';
import { StaffView } from './components/StaffView';
import { TrainingView } from './components/TrainingView';
import { MarketView } from './components/MarketView';
import { FreeAgentsView } from './components/FreeAgentsView';
import { PlayerSearchView } from './components/PlayerSearchView';
import { OpponentsView } from './components/OpponentsView';
import { CalendarView } from './components/CalendarView';
import { AwardsView } from './components/AwardsView';
import { FinancesView } from './components/FinancesView';
import { MatchLiveView } from './components/MatchLiveView';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { DashboardTopBar } from './components/DashboardTopBar';
import { FastSimModal } from './components/FastSimModal';
import { OffseasonRosterModal } from './components/OffseasonRosterModal';
import { CoachFiredModal } from './components/CoachFiredModal';
import { InteractionChatModal } from './components/InteractionChatModal';
import { useGameStore } from './store/gameStore';

export const App: React.FC = () => {
  const { screen, activeTab, toast, clearToast } = useGameStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 3500);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden border border-slate-800/80">
      <TitleBar />

      {screen === 'menu' && <MainMenu />}

      {screen === 'dashboard' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardTopBar />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 tactical-grid-bg overflow-hidden">
              {activeTab === 'office' && <OfficeView />}
              {activeTab === 'messages' && <MessagesView />}
              {activeTab === 'roster' && <RosterView />}
              {activeTab === 'rotations' && <RotationsView />}
              {activeTab === 'tactics' && <TacticsView />}
              {activeTab === 'training' && <TrainingView />}
              {activeTab === 'staff' && <StaffView />}
              {activeTab === 'market' && <MarketView />}
              {activeTab === 'free_agents' && <FreeAgentsView />}
              {activeTab === 'search' && <PlayerSearchView />}
              {activeTab === 'opponents' && <OpponentsView />}
              {activeTab === 'calendar' && <CalendarView defaultTab="monthly" />}
              {activeTab === 'standings' && <CalendarView defaultTab="standings" />}
              {activeTab === 'awards' && <AwardsView />}
              {activeTab === 'finances' && <FinancesView />}
            </main>
          </div>
        </div>
      )}

      {screen === 'match' && <MatchLiveView />}

      <PlayerProfileModal />
      <InteractionChatModal />
      <FastSimModal />
      <OffseasonRosterModal />
      <CoachFiredModal />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl fm-panel border-orange-500/50 text-sm font-semibold text-orange-200 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
