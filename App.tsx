import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CalendariosView } from './components/CalendariosView';
import { NotificationToast } from './components/NotificationToast';
import { LoginScreen } from './components/LoginScreen';
import { AlertasView } from './components/AlertasView';
import { ChatView } from './components/ChatView';
import { Footer } from './components/Footer';
import { TranscriptionTool } from './components/TranscriptionTool';
import { ManualHoliday, Vacacion, Meeting, Guardia, Libranza, Dobla, AuditLog } from './types';
import { useAuth } from './hooks/useAuth';
import { useGuardias } from './hooks/useGuardias';
import { useLibranzas } from './hooks/useLibranzas';
import { useDoblas } from './hooks/useDoblas';
import { useVacaciones } from './hooks/useVacaciones';
import { useMeetings } from './hooks/useMeetings';
import { useReminders } from './hooks/useReminders';
import { canManageGuardiaType, canManagePlanningType, canManageVacaciones, getGuardiaPermissionMessage } from './lib/guardiaPermissions';
import { useT } from './lib/i18n';

const AppLoader: React.FC<{ onTimeout: () => void }> = ({ onTimeout }) => {
  const { t } = useT();
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const interval = setInterval(() => setDots(prev => (prev.length >= 3 ? '.' : prev + '.')), 500);
    const timeout = setTimeout(() => {
      onTimeout();
    }, 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [onTimeout]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-forcall-600"></div>
        <p className="mt-4 text-gray-600">{t('app.loading')}{dots}</p>
        <p className="mt-2 text-xs text-gray-400">{t('app.slowLogin')}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { t } = useT();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [forceShowLogin, setForceShowLogin] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  const { guardias, addGuardia, updateGuardia, deleteGuardia, isLoading: guardiasLoading, refresh: refreshGuardias } = useGuardias();
  const { libranzas, addLibranza, updateLibranza, deleteLibranza, isLoading: libranzasLoading, refresh: refreshLibranzas } = useLibranzas();
  const { doblas, addDobla, updateDobla, deleteDobla, isLoading: doblasLoading, refresh: refreshDoblas } = useDoblas();
  const { vacaciones, addVacacion, deleteVacacion, isLoading: vacacionesLoading, refresh: refreshVacaciones } = useVacaciones();
  const { meetings, addMeeting, updateMeeting, deleteMeeting, isLoading: meetingsLoading, refresh: refreshMeetings } = useMeetings();

  const [activeTab, setActiveTab] = useState('Unificado');
  const [manualHolidays, setManualHolidays] = useState<ManualHoliday[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Inicializar recordatorios (notificaciones programadas) para el usuario actual
  useReminders(user?.name);

  // Refrescar datos cuando el usuario inicia sesión (pasa de null a no-null)
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current === null && user !== null) {
      refreshGuardias();
      refreshLibranzas();
      refreshDoblas();
      refreshVacaciones();
      refreshMeetings();
    }
    prevUserRef.current = user;
  }, [user, refreshGuardias, refreshLibranzas, refreshDoblas, refreshVacaciones, refreshMeetings]);

  // Refrescar datos al volver a la app (cambiar de pestaña, desbloquear iPad, etc.)
  useEffect(() => {
    if (!user) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshGuardias();
        refreshLibranzas();
        refreshDoblas();
        refreshVacaciones();
        refreshMeetings();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [user, refreshGuardias, refreshLibranzas, refreshDoblas, refreshVacaciones, refreshMeetings]);

  const isDataLoading = guardiasLoading || libranzasLoading || doblasLoading || vacacionesLoading || meetingsLoading;

  const handleLogout = useCallback(async (reason?: string) => {
    await signOut();
    setActiveTab('Unificado');
    if (reason) setNotification(reason);
  }, [signOut]);

  const handleUpsertSession = useCallback(async (session: Meeting) => {
    const existing = meetings.find(m => m.id === session.id);
    if (existing) {
      await updateMeeting(session);
    } else {
      await addMeeting(session);
    }
  }, [meetings, addMeeting, updateMeeting]);

  const handleUpsertGuardia = useCallback(async (guardia: Guardia) => {
    if (!canManageGuardiaType(user, guardia.type)) {
      setNotification(getGuardiaPermissionMessage(guardia.type, t));
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
      setNotification(getGuardiaPermissionMessage(existing.type, t));
      return false;
    }
    return await deleteGuardia(id);
  }, [user, guardias, deleteGuardia]);

  const handleSwapGuardias = useCallback(async (event1: Guardia & { _kind?: string }, event2: Guardia & { _kind?: string }) => {
    if (!user) {
      setNotification(t('app.mustLoginSwap'));
      return false;
    }
    if (event1?._kind !== 'guardia' || event2?._kind !== 'guardia') {
      setNotification(t('app.onlyGuardiaSwap'));
      return false;
    }
    if (event1.type !== event2.type) {
      setNotification(t('app.cannotCrossSwap'));
      return false;
    }
    if (user.role === 'Administrador') {
      setNotification(t('app.adminNoSwap'));
      return false;
    }
    if (user.role === 'Medico' && event1.type !== 'medica') {
      setNotification(t('app.onlyMedicinaSwap'));
      return false;
    }
    if (user.role === 'enfermera' && event1.type !== 'enfermeria') {
      setNotification(t('app.onlyEnfermeriaSwap'));
      return false;
    }
    // Intercambiar personnelName mediante actualización en sitio
    // Crear objetos LIMPIOS y EXPLÍCITOS para evitar mezclar tipos
    const guard1Update = {
      id: event1.id,
      date: event1.date,
      type: event1.type, // Mantener tipo original (medica/enfermeria)
      personnelName: event2.personnelName,
      isChange: true,
      modifiedBy: user.id || null,
      modifiedAt: new Date(),
    };
    const guard2Update = {
      id: event2.id,
      date: event2.date,
      type: event2.type, // Mantener tipo original (medica/enfermeria)
      personnelName: event1.personnelName,
      isChange: true,
      modifiedBy: user.id || null,
      modifiedAt: new Date(),
    };
    const success1 = await updateGuardia(guard1Update);
    const success2 = await updateGuardia(guard2Update);
    
    // El trigger de BD (audit_logs) ya registra el cambio como 'CAMBIO'.
    // Recargar logs manualmente para que se vea pronto.
    if (success1 && success2) {
      return true;
    } else {
      setNotification(t('app.swapError'));
      return false;
    }
  }, [user, updateGuardia]);

  const handleUndoSwap = useCallback(async (log: AuditLog): Promise<boolean> => {
    if (!user) return false;
    const details = log.details;
    if (!details || !details.date1 || !details.date2) return false;

    const date1 = new Date(details.date1);
    const date2 = new Date(details.date2);

    const guardiaA = guardias.find(g =>
      g.date.toDateString() === date1.toDateString() && g.personnelName === details.to
    );
    const guardiaB = guardias.find(g =>
      g.date.toDateString() === date2.toDateString() && g.personnelName === details.from
    );

    if (!guardiaA || !guardiaB) {
      setNotification(t('app.undoNotFound'));
      return false;
    }

    const updateA = { ...guardiaA, personnelName: details.from, isChange: true, modifiedBy: user.id || null, modifiedAt: new Date() };
    const updateB = { ...guardiaB, personnelName: details.to, isChange: true, modifiedBy: user.id || null, modifiedAt: new Date() };

    const ok1 = await updateGuardia(updateA);
    const ok2 = await updateGuardia(updateB);

    if (ok1 && ok2) {
      setNotification(t('app.swapUndone'));
      return true;
    }
    setNotification(t('app.undoError'));
    return false;
  }, [user, guardias, updateGuardia]);

  const handleUpsertLibranza = useCallback(async (libranza: Libranza) => {
    if (!canManagePlanningType(user, libranza.type)) {
      setNotification(t('app.noPermissionLibranza'));
      return;
    }
    const existing = libranzas.find(l => l.id === libranza.id);
    const ok = existing ? await updateLibranza(libranza) : await addLibranza(libranza);
    if (!ok) setNotification(t('app.libranzaSaveError'));
  }, [user, libranzas, addLibranza, updateLibranza]);

  const handleDeleteVacacion = useCallback(async (id: string) => {
    const existing = vacaciones.find(v => v.id === id);
    if (!existing) return;
    if (!canManageVacaciones(user, existing.type)) {
      setNotification(t('app.noPermissionVacacion'));
      return;
    }
    const ok = await deleteVacacion(id);
    if (!ok) setNotification(t('app.vacacionDeleteError'));
  }, [user, vacaciones, deleteVacacion]);

  const handleUpsertDobla = useCallback(async (dobla: Dobla) => {
    if (!canManagePlanningType(user, dobla.type)) {
      setNotification(t('app.noPermissionDobla'));
      return;
    }
    const existing = doblas.find(d => d.id === dobla.id);
    const ok = existing ? await updateDobla(dobla) : await addDobla(dobla);
    if (!ok) setNotification(t('app.doblaSaveError'));
  }, [user, doblas, addDobla, updateDobla]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Unificado':
        return (
          <Dashboard
            meetings={meetings}
            guardias={guardias}
            libranzas={libranzas}
            doblas={doblas}
            vacaciones={vacaciones}
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
            vacaciones={vacaciones}
            manualHolidays={manualHolidays}
            onAddGuardia={handleUpsertGuardia}
            onDeleteGuardia={handleDeleteGuardia}
            onAddLibranza={handleUpsertLibranza}
            onDeleteLibranza={deleteLibranza}
            onAddDobla={handleUpsertDobla}
            onDeleteDobla={deleteDobla}
            onAddVacacion={addVacacion}
            onDeleteVacacion={handleDeleteVacacion}
            onAddMeeting={handleUpsertSession}
            onSwapGuardias={handleSwapGuardias}
            onUndoSwap={handleUndoSwap}
            user={user}
          />
        );
      case 'Chat':
        return <ChatView currentUser={user} />;
      case 'Dictado':
        return <TranscriptionTool />;
      case 'Alertas':
        return <AlertasView />;
      default:
        return null;
    }
  };

  // Show loading spinner while auth initializes (only on first load)
  if (authLoading && !forceShowLogin && !loginAttempted) {
    return <AppLoader onTimeout={() => setForceShowLogin(true)} />;
  }

  // Show login screen if not authenticated
  if (!user || forceShowLogin) {
    return <LoginScreen onLoginSuccess={() => {
      setLoginAttempted(true);
      setForceShowLogin(false);
    }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0 relative animate-fade-in">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => handleLogout()} />
      {isDataLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-forcall-100">
          <div className="h-full bg-forcall-600 animate-pulse" style={{ width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-8rem)]">
        <div key={activeTab} className="animate-wave-in animate-stagger">
          {renderContent()}
        </div>
      </main>
      <Footer />
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default App;
