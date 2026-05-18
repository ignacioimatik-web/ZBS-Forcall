import React, { useState, useEffect, useRef } from 'react';

interface LandingPagePremiumProps {
  onEnterApp: () => void;
}

export const LandingPagePremium: React.FC<LandingPagePremiumProps> = ({ onEnterApp }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: 'calendar_month',
      title: 'Cuadrante Unificado',
      description: 'Visualiza todas las guardias, libranzas, refuerzos y vacaciones en un solo calendario integrado.',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      icon: 'schedule',
      title: 'Gestión de Turnos',
      description: 'Administra guardias médicas y de enfermería, libranzas, refuerzos y vacaciones con permisos por rol.',
      gradient: 'from-rose-500 to-pink-400'
    },
    {
      icon: 'auto_awesome',
      title: 'IAassist',
      description: 'Importa cuadrantes automáticamente desde PDF, imágenes con OCR o dictado por voz con IA.',
      gradient: 'from-amber-500 to-orange-400'
    },
    {
      icon: 'forum',
      title: 'Chat de Equipo',
      description: 'Comunicación en tiempo real con tu equipo sanitario e integración con Telegram.',
      gradient: 'from-emerald-500 to-teal-400'
    },
    {
      icon: 'cloud',
      title: 'Alertas Meteo',
      description: 'Información meteorológica de AEMET y avisos de Protección Civil para Els Ports en tiempo real.',
      gradient: 'from-sky-500 to-blue-400'
    },
    {
      icon: 'swap_horiz',
      title: 'Sistema de Permutas',
      description: 'Intercambia turnos entre profesionales con registro automático y trazabilidad completa.',
      gradient: 'from-violet-500 to-purple-400'
    }
  ];

  const stats = [
    { value: '8', label: 'Municipios', icon: 'location_city' },
    { value: '24/7', label: 'Cobertura', icon: 'schedule' },
    { value: '100%', label: 'Digital', icon: 'cloud_done' },
    { value: '0', label: 'Papel', icon: 'eco' }
  ];

  const parallaxOffset = scrollY * 0.4;

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans overflow-x-hidden">
      {/* Video Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: `translateY(${parallaxOffset}px) scale(1.1)` }}
          >
            <source 
              src="https://videos.pexels.com/video-files/6519550/6519550-uhd_2560_1440_30fps.mp4" 
              type="video/mp4" 
            />
          </video>
          {/* Video Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/50 to-stone-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/60 via-transparent to-stone-950/60" />
          {/* Animated grain overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }} />
        </div>

        {/* Floating Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 100 ? 'bg-stone-950/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-white/10">
                  <span className="material-symbols-outlined text-white text-xl">local_hospital</span>
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight">ZBS Forcall</h1>
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-[0.2em]">Gestión Sanitaria</p>
                </div>
              </div>
              <button
                onClick={onEnterApp}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold hover:bg-white/20 transition-all border border-white/10"
              >
                Acceder
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className={`relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm text-white/80 rounded-full text-xs font-semibold uppercase tracking-widest mb-8 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Zona Básica de Salud Els Ports
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8">
            <span className="block">Asistencia</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500">
              sanitaria rural
            </span>
            <span className="block text-white/60 text-4xl sm:text-5xl lg:text-6xl mt-2">coordinada</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto mb-12">
            La plataforma integral para coordinar turnos, guardias médicas y comunicación del equipo sanitario en la comarca de Els Ports
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnterApp}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-base font-bold hover:from-amber-400 hover:to-orange-400 transition-all shadow-2xl shadow-amber-500/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">login</span>
              Entrar a la aplicación
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-full text-base font-semibold border border-white/10 hover:bg-white/10 transition-all"
            >
              Descubre más
              <span className="material-symbols-outlined text-lg animate-bounce">expand_more</span>
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs font-semibold uppercase tracking-widest">Scroll</span>
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-white/40 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Glass Cards */}
      <section className="relative z-10 -mt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className={`group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100 + 500}ms` }}
              >
                <span className="material-symbols-outlined text-amber-400/80 text-2xl mb-3 block group-hover:scale-110 transition-transform">{stat.icon}</span>
                <p className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Cinematic */}
      <section id="features" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Feature List */}
            <div>
              <p className="text-xs font-black text-amber-400 uppercase tracking-[0.3em] mb-4">Funcionalidades</p>
              <h3 className="text-4xl sm:text-5xl font-black tracking-tight mb-12 leading-tight">
                Todo lo que tu equipo
                <span className="block text-white/50">necesita</span>
              </h3>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <button
                    key={feature.title}
                    onClick={() => setActiveFeature(index)}
                    className={`w-full text-left p-5 rounded-2xl transition-all duration-300 ${
                      activeFeature === index 
                        ? 'bg-white/10 border border-white/20' 
                        : 'bg-transparent border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-lg transition-transform ${activeFeature === index ? 'scale-110' : ''}`}>
                        <span className="material-symbols-outlined text-white text-xl">{feature.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-1">{feature.title}</h4>
                        <p className={`text-sm text-white/50 leading-relaxed transition-all ${activeFeature === index ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    {activeFeature === index && (
                      <div className="mt-4 h-0.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${feature.gradient} rounded-full animate-progress`}
                          style={{ animation: 'progress 4s linear' }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Feature Preview */}
            <div className="relative">
              {/* Glowing orb background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].gradient} opacity-20 blur-3xl rounded-full transition-all duration-700`} />
              
              {/* Glass card */}
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                {/* Window controls */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                  <div className="flex-1 ml-4">
                    <div className="bg-white/10 rounded-lg px-4 py-1.5 text-xs text-white/40 max-w-[200px]">
                      zbs-forcall.vercel.app
                    </div>
                  </div>
                </div>

                {/* Dynamic content based on active feature */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${features[activeFeature].gradient} bg-opacity-20 border border-white/10`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-white text-2xl">{features[activeFeature].icon}</span>
                      <h4 className="text-lg font-bold">{features[activeFeature].title}</h4>
                    </div>
                    <p className="text-sm text-white/60">{features[activeFeature].description}</p>
                  </div>

                  {/* Placeholder UI elements */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 mb-2"></div>
                        <div className="h-2 bg-white/10 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${features[activeFeature].gradient} rounded-full`} style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-xs text-white/40">65%</span>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 animate-float">
                <span className="material-symbols-outlined text-sm">verified</span>
                En tiempo real
              </div>
              <div className="absolute -bottom-4 -left-4 bg-stone-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg border border-white/10 flex items-center gap-2 animate-float-delayed">
                <span className="material-symbols-outlined text-amber-400 text-sm">cloud_sync</span>
                Sincronizado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Roles Section */}
      <section className="relative z-10 py-24 sm:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-black text-amber-400 uppercase tracking-[0.3em] mb-4">Perfiles</p>
            <h3 className="text-4xl sm:text-5xl font-black tracking-tight">
              Adaptado a cada rol
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'Administrador', icon: 'admin_panel_settings', gradient: 'from-stone-600 to-stone-800', desc: 'Control total del sistema y gestión de usuarios.' },
              { role: 'Coordinador/a', icon: 'supervisor_account', gradient: 'from-amber-500 to-orange-600', desc: 'Gestión de cuadrantes, permutas e importación IA.' },
              { role: 'Médico/a', icon: 'stethoscope', gradient: 'from-blue-500 to-cyan-500', desc: 'Consulta y gestión de guardias médicas.' },
              { role: 'Enfermero/a', icon: 'vaccines', gradient: 'from-rose-500 to-pink-500', desc: 'Consulta y gestión de guardias de enfermería.' }
            ].map((item, index) => (
              <div 
                key={item.role} 
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-white text-3xl">{item.icon}</span>
                </div>
                <h4 className="text-xl font-bold mb-2">{item.role}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Large decorative icon */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/30 rotate-3 hover:rotate-0 transition-transform">
            <span className="material-symbols-outlined text-white text-5xl">local_hospital</span>
          </div>

          <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Empieza a coordinar
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">hoy mismo</span>
          </h3>
          
          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
            Únete a los profesionales sanitarios de Els Ports que ya gestionan sus turnos de forma eficiente
          </p>

          <button
            onClick={onEnterApp}
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-lg font-bold hover:from-amber-400 hover:to-orange-400 transition-all shadow-2xl shadow-amber-500/40 active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">rocket_launch</span>
            Acceder a la aplicación
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">local_hospital</span>
              </div>
              <div>
                <p className="font-bold">ZBS Forcall</p>
                <p className="text-xs text-white/40">Gestión Sanitaria Els Ports</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white/40">
              <span className="material-symbols-outlined text-base">location_on</span>
              Forcall, Castellón, España
            </div>
            
            <p className="text-xs text-white/30">
              © 2026 ZBS Forcall. Desarrollado con cuidado para la sanidad rural.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite 1.5s;
        }
        
        .animate-progress {
          animation: progress 4s linear;
        }
      `}</style>
    </div>
  );
};
