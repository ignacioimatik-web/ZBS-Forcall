import React, { useState, useCallback, useEffect } from 'react';
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
import { canManageGuardiaType, getGuardiaPermissionMessage } from './lib/guardiaPermissions';

const AppLoader: React.FC<{ onTimeout: () => void }> = ({ onTimeout }) => {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const interval = setInterval(() => setDots(prev => (prev.length >= 3 ? '.' : prev + '.')), 500);
    const timeout = setTimeout(() => {
      console.warn('AppLoader timeout: forcing login screen');
      onTimeout();
    }, 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [onTimeout]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-forcall-600"></div>
        <p className="mt-4 text-gray-600">Cargando{dots}</p>
        <p className="mt-2 text-xs text-gray-400">Si tarda más de 5s, se mostrará el login</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [forceShowLogin, setForceShowLogin] = useState(false);

  const { guardias, addGuardia, updateGuardia, deleteGuardia, isLoading: guardiasLoading } = useGuardias();
  const { libranzas, addLibranza, updateLibranza, deleteLibranza, isLoading: libranzasLoading } = useLibranzas();
  const { doblas, addDobla, updateDobla, deleteDobla, isLoading: doblasLoading } = useDoblas();
  const { meetings, addMeeting, updateMeeting, deleteMeeting, isLoading: meetingsLoading } = useMeetings();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [manualHolidays, setManualHolidays] = useState<ManualHoliday[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const isDataLoading = guardiasLoading || libranzasLoading || doblasLoading || meetingsLoading;

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
    if (!canManageGuardiaType(user, guardia.type)) {
      setNotification(getGuardiaPermissionMessage(guardia.type));
      return false;
    }
    const existing = guardias.find(g => g.id === guardia.id);
    if (existing) {
      await updateGuardia(guardia);
    } else {
      await addGuardia(guardia);
    }
    return true;
  }, [user, guardias, addGuardia, updateGuardia]);

  const handleDeleteGuardia = useCallback(async (id: string) => {
    const existing = guardias.find(g => g.id === id);
    if (!existing) return false;
    if (!canManageGuardiaType(user, existing.type)) {
      setNotification(getGuardiaPermissionMessage(existing.type));
      return false;
    }
    await deleteGuardia(id);
    return true;
  }, [user, guardias, deleteGuardia]);

  const handleSwapGuardias = useCallback(async (event1: any, event2: any) => {
    if (!user) {
      setNotification('Debes iniciar sesión para hacer una permuta.');
      return false;
    }
    if (event1?._kind !== 'guardia' || event2?._kind !== 'guardia') {
      setNotification('Solo se permiten permutas de guardias.');
      return false;
    }
    const { id: id1, _kind: _kind1, ...event1Rest } = event1;
    const { id: id2, _kind: _kind2, ...event2Rest } = event2;
    await deleteGuardia(id1);
    await deleteGuardia(id2);
    await addGuardia({
      ...event1Rest,
      personnelName: event2.personnelName,
      isChange: true,
      modifiedBy: user.name || null,
      modifiedAt: new Date(),
    });
    await addGuardia({
      ...event2Rest,
      personnelName: event1.personnelName,
      isChange: true,
      modifiedBy: user.name || null,
      modifiedAt: new Date(),
    });
    return true;
  }, [user, addGuardia, deleteGuardia]);

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
        return (
          <Dashboard
            meetings={meetings}
            guardias={guardias}
            libranzas={libranzas}
            doblas={doblas}
            onNavigate={setActiveTab}
            onAddGuardia={handleUpsertGuardia}
            onDeleteGuardia={handleDeleteGuardia}
            onAddMeeting={handleUpsertSession}
            onAddLibranza={handleUpsertLibranza}
            onAddDobla={handleUpsertDobla}
            onDeleteLibranza={deleteLibranza}
            onDeleteDobla={deleteDobla}
            user={user}
          />
        );
      case 'Guardias':
        return (
          <CalendariosView
            meetings={meetings}
            guardias={guardias}
            libranzas={libranzas}
            doblas={doblas}
            manualHolidays={manualHolidays}
            onAddGuardia={handleUpsertGuardia}
            onDeleteGuardia={handleDeleteGuardia}
            onAddLibranza={handleUpsertLibranza}
            onDeleteLibranza={deleteLibranza}
            onAddDobla={handleUpsertDobla}
            onDeleteDobla={deleteDobla}
            onAddMeeting={handleUpsertSession}
            onSwapGuardias={handleSwapGuardias}
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

  // Show loading spinner while auth initializes
  if (authLoading && !forceShowLogin) {
    return <AppLoader onTimeout={() => setForceShowLogin(true)} />;
  }

  // Show login screen if not authenticated
  if (!user || forceShowLogin) {
    return <LoginScreen onLoginSuccess={() => setForceShowLogin(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0 relative animate-fade-in">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => handleLogout()} />
      {isDataLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-forcall-100">
          <div className="h-full bg-forcall-600 animate-pulse" style={{ width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default App;
