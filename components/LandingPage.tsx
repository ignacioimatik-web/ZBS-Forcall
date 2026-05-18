import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: 'calendar_month',
      title: 'Cuadrante Unificado',
      description: 'Visualiza todas las guardias, libranzas, refuerzos y vacaciones en un solo calendario integrado.',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'schedule',
      title: 'Gestión de Turnos',
      description: 'Administra guardias médicas y de enfermería, libranzas, refuerzos y vacaciones con permisos por rol.',
      color: 'bg-rose-500',
      gradient: 'from-rose-500 to-rose-600'
    },
    {
      icon: 'swap_horiz',
      title: 'Sistema de Permutas',
      description: 'Intercambia turnos entre profesionales con registro automático y trazabilidad completa.',
      color: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      icon: 'auto_awesome',
      title: 'IAassist',
      description: 'Importa cuadrantes automáticamente desde PDF, imágenes con OCR o dictado por voz con IA.',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'forum',
      title: 'Chat de Equipo',
      description: 'Comunicación en tiempo real con tu equipo sanitario e integración con Telegram.',
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: 'cloud',
      title: 'Alertas Meteo y Emergencias',
      description: 'Información meteorológica de AEMET y avisos de Protección Civil para Els Ports en tiempo real.',
      color: 'bg-sky-500',
      gradient: 'from-sky-500 to-sky-600'
    },
    {
      icon: 'picture_as_pdf',
      title: 'Exportación PDF/ICS',
      description: 'Descarga calendarios en PDF o formato ICS para sincronizar con tu app de calendario.',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: 'verified_user',
      title: 'Control de Acceso',
      description: 'Permisos granulares por rol: Administrador, Coordinador, Médico y Enfermería.',
      color: 'bg-teal-500',
      gradient: 'from-teal-500 to-teal-600'
    }
  ];

  const stats = [
    { value: '8', label: 'Municipios' },
    { value: '24/7', label: 'Cobertura' },
    { value: '100%', label: 'Digital' },
    { value: '0', label: 'Papel' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100 font-sans overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-200/40 via-amber-200/30 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-blue-200/30 via-sky-200/20 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-emerald-200/20 via-teal-200/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200/50 bg-white/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="material-symbols-outlined text-white text-xl">local_hospital</span>
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900 tracking-tight">ZBS Forcall</h1>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Gestión Sanitaria</p>
              </div>
            </div>
            <button
              onClick={onEnterApp}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-95"
            >
              Acceder
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`relative z-10 py-16 sm:py-24 lg:py-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <span className="material-symbols-outlined text-sm">verified</span>
              Zona Básica de Salud Els Ports
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              Gestión de guardias
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
                simplificada
              </span>
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
              La plataforma integral para coordinar turnos, guardias médicas y de enfermería, comunicación del equipo y alertas de emergencia en la comarca de Els Ports.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onEnterApp}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl text-base font-bold hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/30 active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">login</span>
                Entrar a la aplicación
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-2xl text-base font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                Ver funcionalidades
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 sm:mt-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className={`bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-200/50 shadow-sm transition-all duration-700 hover:shadow-md hover:bg-white/80 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${index * 100 + 300}ms` }}
                >
                  <p className="text-3xl sm:text-4xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-16 sm:py-24 bg-gradient-to-b from-transparent via-white/80 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-black text-orange-600 uppercase tracking-[0.25em] mb-3">Funcionalidades</p>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Todo lo que necesitas para gestionar tu equipo
            </h3>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Diseñado específicamente para las necesidades de los centros de salud rurales y equipos sanitarios de atención primaria.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group bg-white rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-xl hover:border-gray-300/50 transition-all duration-500 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-white text-xl">{feature.icon}</span>
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="relative z-10 py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-black text-orange-600 uppercase tracking-[0.25em] mb-3">Diseño intuitivo</p>
              <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-6">
                Una interfaz pensada para profesionales sanitarios
              </h3>
              <p className="text-gray-600 leading-relaxed mb-8">
                Accede desde cualquier dispositivo: ordenador, tablet o móvil. La aplicación se adapta a tu forma de trabajar, con un diseño limpio y accesible que reduce la curva de aprendizaje.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: 'devices', text: 'Responsive: funciona en cualquier dispositivo' },
                  { icon: 'offline_bolt', text: 'Sincronización automática de datos' },
                  { icon: 'translate', text: 'Disponible en Español y Valenciano' },
                  { icon: 'dark_mode', text: 'Temas personalizables y efectos visuales' }
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-orange-600 text-lg">{item.icon}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onEnterApp}
                className="mt-8 flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
              >
                Probar ahora
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>

            <div className="relative">
              {/* Mockup Window */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-lg px-4 py-1 text-xs text-gray-500 border border-gray-200">
                      zbs-forcall.vercel.app
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-stone-50">
                  {/* Simplified dashboard preview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">dashboard</span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Cuadrante Unificado</p>
                        <p className="text-[10px] text-gray-500">Gestión centralizada de equipos</p>
                      </div>
                    </div>

                    {/* Calendar mockup */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-700">Mayo 2026</span>
                        <div className="flex gap-1">
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 text-sm">chevron_left</span>
                          </div>
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                          <div key={d} className="text-[8px] font-bold text-gray-400 py-1">{d}</div>
                        ))}
                        {Array.from({ length: 21 }, (_, i) => (
                          <div 
                            key={i} 
                            className={`text-[9px] py-1.5 rounded ${i === 13 ? 'bg-blue-500 text-white font-bold' : i === 8 || i === 15 ? 'bg-orange-100 text-orange-700' : 'text-gray-600'}`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Med', value: '12', color: 'bg-blue-500' },
                        { label: 'Enf', value: '10', color: 'bg-rose-500' },
                        { label: 'Lib', value: '4', color: 'bg-green-500' },
                        { label: 'Vac', value: '2', color: 'bg-purple-400' }
                      ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-2 text-center">
                          <div className={`w-1.5 h-1.5 ${stat.color} rounded-full mx-auto mb-1`}></div>
                          <p className="text-sm font-black text-gray-900">{stat.value}</p>
                          <p className="text-[8px] text-gray-500 uppercase">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">verified</span>
                Tiempo real
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg border border-gray-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-500 text-sm">cloud_sync</span>
                Sincronizado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="relative z-10 py-16 sm:py-24 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-orange-600 uppercase tracking-[0.25em] mb-3">Perfiles de usuario</p>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Adaptado a cada rol del equipo
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'Administrador', icon: 'admin_panel_settings', color: 'from-gray-700 to-gray-900', desc: 'Control total del sistema, gestión de usuarios y configuración avanzada.' },
              { role: 'Coordinador/a', icon: 'supervisor_account', color: 'from-orange-500 to-amber-600', desc: 'Gestión de cuadrantes, permutas, importación IA y comunicaciones.' },
              { role: 'Médico/a', icon: 'stethoscope', color: 'from-blue-500 to-blue-600', desc: 'Consulta y gestión de guardias médicas, libranzas y vacaciones.' },
              { role: 'Enfermero/a', icon: 'vaccines', color: 'from-rose-500 to-rose-600', desc: 'Consulta y gestión de guardias de enfermería, libranzas y vacaciones.' }
            ].map((item) => (
              <div key={item.role} className="bg-white rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-2xl">{item.icon}</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{item.role}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 border border-white/20 rounded-full translate-x-1/4 translate-y-1/4"></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white/80 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                Comienza ahora
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-4">
                Digitaliza la gestión de tu equipo sanitario
              </h3>
              
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Únete a los profesionales de la ZBS Forcall que ya usan la plataforma para coordinar sus turnos y comunicaciones.
              </p>

              <button
                onClick={onEnterApp}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl text-base font-bold hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/30 active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">login</span>
                Acceder a ZBS Forcall
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-white/80 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">local_hospital</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">ZBS Forcall</p>
                <p className="text-[10px] text-gray-500">Zona Básica de Salud Els Ports</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span>Forcall, Castellón</span>
              <span>•</span>
              <span>Comunitat Valenciana</span>
            </div>

            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} ZBS Forcall
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
