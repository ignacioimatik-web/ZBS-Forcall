
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { UnifiedCalendar } from './components/UnifiedCalendar';
import { CalendariosView } from './components/CalendariosView';
import { NotificationToast } from './components/NotificationToast';
import { LoginScreen } from './components/LoginScreen';
import { AlertasView } from './components/AlertasView';
import { TranscriptionTool } from './components/TranscriptionTool';
import { ManualHoliday } from './types';
import { useAuth } from './hooks/useAuth';
import { useGuardias } from './hooks/useGuardias';
import { useLibranzas } from './hooks/useLibranzas';
import { useDoblas } from './hooks/useDoblas';
import { useMeetings } from './hooks/useMeetings';

const App: React.FC = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { guardias, addGuardia, updateGuardia, deleteGuardia } = useGuardias();
  const { libranzas, addLibranza, updateLibranza, deleteLibranza } = useLibranzas();
  const { doblas, addDobla, updateDobla, deleteDobla } = useDoblas();
  const { meetings, addMeeting, updateMeeting, deleteMeeting } = useMeetings();
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [manualHolidays, setManualHolidays] = useState<ManualHoliday[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const handleLogout = useCallback(async (reason?: string) => {
    await signOut();
    setActiveTab('Dashboard');
    if (reason) setNotification(reason);
  }, [signOut]);

  const handleUpsertSession = useCallback(async (session: any) => {
    const existing = meetings.find(m => m.id === session.id);
    if (existing) {
      await updateMeeting(session);
    } else {
      await addMeeting(session);
    }
  }, [meetings, addMeeting, updateMeeting]);

  const handleUpsertGuardia = useCallback(async (guardia: any) => {
    const existing = guardias.find(g => g.id === guardia.id);
    if (existing) {
      await updateGuardia(guardia);
    } else {
      await addGuardia(guardia);
    }
  }, [guardias, addGuardia, updateGuardia]);

  const handleUpsertLibranza = useCallback(async (libranza: any) => {
    const existing = libranzas.find(l => l.id === libranza.id);
    if (existing) {
      await updateLibranza(libranza);
    } else {
      await addLibranza(libranza);
    }
  }, [libranzas, addLibranza, updateLibranza]);

  const handleUpsertDobla = useCallback(async (dobla: any) => {
    const existing = doblas.find(d => d.id === dobla.id);
    if (existing) {
      await updateDobla(dobla);
    } else {
      await addDobla(dobla);
    }
  }, [doblas, addDobla, updateDobla]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard 
          meetings={meetings} 
          guardias={guardias} 
          libranzas={libranzas}
          doblas={doblas}
          onNavigate={setActiveTab} 
          onAddGuardia={handleUpsertGuardia}
          onDeleteGuardia={deleteGuardia}
          onAddMeeting={handleUpsertSession}
          onAddLibranza={handleUpsertLibranza}
          onAddDobla={handleUpsertDobla}
          onDeleteLibranza={deleteLibranza}
          onDeleteDobla={deleteDobla}
          user={user} 
        />;
      case 'Guardias':
        return (
          <CalendariosView 
            meetings={meetings}
            guardias={guardias}
            libranzas={libranzas}
            doblas={doblas}
            manualHolidays={manualHolidays}
            onAddGuardia={handleUpsertGuardia}
            onDeleteGuardia={deleteGuardia}
            onAddLibranza={handleUpsertLibranza}
            onDeleteLibranza={deleteLibranza}
            onAddDobla={handleUpsertDobla}
            onDeleteDobla={deleteDobla}
            onAddMeeting={handleUpsertSession}
            user={user}
          />
        );
      case 'Dictado':
        return <TranscriptionTool />;
      case 'Alertas':
        return <AlertasView />;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-forcall-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0 relative animate-fade-in">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => handleLogout()} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default App;
