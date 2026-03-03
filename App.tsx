
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { UnifiedCalendar } from './components/UnifiedCalendar';
import { CalendariosView } from './components/CalendariosView';
import { NotificationToast } from './components/NotificationToast';
import { LoginScreen } from './components/LoginScreen';
import { AlertasView } from './components/AlertasView';
import { TranscriptionTool } from './components/TranscriptionTool';
import { Meeting, MeetingType, User, UserRole, Guardia, ManualHoliday, Libranza, Dobla } from './types';

const generateMockData = (): Meeting[] => {
  const today = new Date();
  const meetings: Meeting[] = [];
  const addDays = (d: Date, days: number) => {
    const copy = new Date(d);
    copy.setDate(d.getDate() + days);
    return copy;
  };

  meetings.push({
    id: 'team-1',
    title: 'Reunión General de Zona',
    type: MeetingType.TEAM,
    date: addDays(today, 5),
    time: '13:30',
    speaker: 'Dra. Elena Benages',
    isConfirmed: true,
    description: 'Revisión de objetivos mensuales y coordinación.'
  });

  return meetings;
};

const generateMockGuardias = (): Guardia[] => {
  const guardias: Guardia[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const doctors = ["Dra. Elena Benages", "Dra. Delia Mestre", "Dr. Fernando Sierra", "Dr. Jorge Ramón", "Dr. Frank Castillo", "Dr. Ilie Popov"];
  const nurses = ["Enf. María Pilar", "Enf. Jose Vicente", "Enf. Silvia Mir", "Enf. Carlos Giner"];

  for (let mOffset = 0; mOffset <= 1; mOffset++) {
    const targetMonth = month + mOffset;
    const daysInMonth = new Date(year, targetMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, targetMonth, day);
      guardias.push({
        id: `g-med-${year}-${targetMonth}-${day}`,
        date,
        time: '08:00',
        type: 'Médica',
        personnelName: doctors[day % doctors.length]
      });
      guardias.push({
        id: `g-enf-${year}-${targetMonth}-${day}`,
        date,
        time: '08:00',
        type: 'Enfermería',
        personnelName: nurses[day % nurses.length]
      });
    }
  }
  return guardias;
}

type AuthStep = 'login' | 'app';

const App: React.FC = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [libranzas, setLibranzas] = useState<Libranza[]>([]);
  const [doblas, setDoblas] = useState<Dobla[]>([]);
  const [manualHolidays, setManualHolidays] = useState<ManualHoliday[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setMeetings(generateMockData());
    setGuardias(generateMockGuardias());
  }, []);

  const handleLogout = useCallback((reason?: string) => {
    setCurrentUser(null);
    setAuthStep('login');
    setActiveTab('Dashboard');
    if (reason) setNotification(reason);
  }, []);

  const handleUpsertSession = (session: Meeting) => {
    setMeetings(prev => {
      const exists = prev.find(m => m.id === session.id);
      if (exists) return prev.map(m => m.id === session.id ? session : m);
      return [...prev, session];
    });
  };

  const handleUpsertGuardia = (guardia: Guardia) => {
    setGuardias(prev => {
      const exists = prev.find(g => g.id === guardia.id);
      if (exists) return prev.map(g => g.id === guardia.id ? guardia : g);
      return [...prev, guardia];
    });
  };

  const handleUpsertLibranza = (libranza: Libranza) => {
    setLibranzas(prev => {
      const exists = prev.find(l => l.id === libranza.id);
      if (exists) return prev.map(l => l.id === libranza.id ? libranza : l);
      return [...prev, libranza];
    });
  };

  const handleUpsertDobla = (dobla: Dobla) => {
    setDoblas(prev => {
      const exists = prev.find(d => d.id === dobla.id);
      if (exists) return prev.map(d => d.id === dobla.id ? dobla : d);
      return [...prev, dobla];
    });
  };

  const handleDeleteGuardia = (id: string) => setGuardias(prev => prev.filter(g => g.id !== id));
  const handleDeleteLibranza = (id: string) => setLibranzas(prev => prev.filter(l => l.id !== id));
  const handleDeleteDobla = (id: string) => setDoblas(prev => prev.filter(d => d.id !== id));

  const handleLoginSuccess = (method: string, email: string, role: UserRole, phone?: string) => {
    setCurrentUser({
      id: 'user-1',
      name: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      email: email,
      phone: phone,
      role: role,
      is2FAEnabled: false
    });
    setAuthStep('app');
  };

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
          onDeleteGuardia={handleDeleteGuardia}
          onAddMeeting={handleUpsertSession}
          onAddLibranza={handleUpsertLibranza}
          onAddDobla={handleUpsertDobla}
          onDeleteLibranza={handleDeleteLibranza}
          onDeleteDobla={handleDeleteDobla}
          user={currentUser} 
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
            onDeleteGuardia={handleDeleteGuardia}
            onAddLibranza={handleUpsertLibranza}
            onDeleteLibranza={handleDeleteLibranza}
            onAddDobla={handleUpsertDobla}
            onDeleteDobla={handleDeleteDobla}
            onAddMeeting={handleUpsertSession}
            user={currentUser}
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

  if (authStep === 'login') return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

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
