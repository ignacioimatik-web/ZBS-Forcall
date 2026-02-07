
import React, { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';

interface TwoFactorScreenProps {
  onVerified: () => void;
  isSetupMode?: boolean; // True if registering, False if just logging in
}

export const TwoFactorScreen: React.FC<TwoFactorScreenProps> = ({ onVerified, isSetupMode = true }) => {
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'setup' | 'verify'>(isSetupMode ? 'setup' : 'verify');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Focus simulation
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  // This is a static secret for demonstration purposes. 
  // In a production app, this should be generated per user on the server.
  // We use Base32 format: 'JBSWY3DPEHPK3PXP'
  const SECRET_KEY = 'JBSWY3DPEHPK3PXP';
  const ACCOUNT_NAME = 'JefaZona';
  const ISSUER = 'ForcallSalud';

  useEffect(() => {
    if (inputRef.current && step === 'verify') {
      inputRef.current.focus();
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    // Instantiate TOTP generator
    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      label: ACCOUNT_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(SECRET_KEY)
    });

    // Validate the token
    // 'window: 1' allows for a +/- 30 second clock drift between client and server (or browser and phone)
    const delta = totp.validate({ token: code, window: 1 });

    // Simulate a brief network delay for realism
    setTimeout(() => {
      if (delta !== null) {
        // Delta is the number of periods the token was off by (0 means current period)
        onVerified();
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 800);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(false);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `otpauth://totp/${ISSUER}:${ACCOUNT_NAME}?secret=${SECRET_KEY}&issuer=${ISSUER}`
  )}`;

  return (
    <div className="min-h-screen bg-earth-50 flex flex-col justify-center items-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-in-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-forcall-900 to-earth-900 p-6 text-white text-center">
          <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-full mb-3 border border-white/20">
            <span className="material-symbols-outlined text-3xl text-earth-100">lock_person</span>
          </div>
          <h2 className="text-xl font-bold">Verificación en Dos Pasos</h2>
          <p className="text-earth-100 text-sm mt-1 opacity-80">Protege tu cuenta y los datos de pacientes</p>
        </div>

        <div className="p-8">
          {step === 'setup' ? (
            <div className="text-center space-y-6">
              <div className="bg-forcall-50 p-4 rounded-lg border border-forcall-100 text-sm text-forcall-800">
                <p className="mb-3">Para configurar tu acceso, necesitas la aplicación <strong>Google Authenticator</strong>.</p>
                
                <div className="flex justify-center gap-3 mt-4 flex-wrap">
                  {/* Apple Store Button */}
                  <a 
                    href="https://apps.apple.com/es/app/google-authenticator/id388497605" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity border border-black"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[8px] opacity-80">Consíguelo en el</span>
                      <span className="font-bold text-[10px]">App Store</span>
                    </div>
                  </a>

                  {/* Google Play Button */}
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity border border-black"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                       <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                    </svg>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[8px] opacity-80">DISPONIBLE EN</span>
                      <span className="font-bold text-[10px]">Google Play</span>
                    </div>
                  </a>
                </div>
              </div>
              
              <div className="flex justify-center my-4">
                <div className="p-2 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                  {/* Real QR Code that matches the validation logic */}
                  <img 
                    src={qrCodeUrl}
                    alt="QR Code" 
                    className="w-40 h-40"
                  />
                </div>
              </div>

              <div className="text-left bg-earth-50 p-3 rounded border border-earth-200">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-bold">Clave de configuración</p>
                <code className="text-lg font-mono text-gray-800 tracking-wider">JBSW Y3DP EHPK 3PXP</code>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
              >
                He escaneado el código
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Introduce el código de 6 dígitos generado por tu aplicación
                </label>
                
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={handleCodeChange}
                    className={`w-48 text-center text-3xl tracking-[0.5em] font-mono py-3 border-b-2 outline-none transition-colors bg-transparent ${
                      error ? 'border-red-500 text-red-600' : 'border-earth-300 focus:border-earth-600 text-gray-800'
                    }`}
                    placeholder="000000"
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-2 absolute w-full text-center">Código incorrecto. Inténtalo de nuevo.</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={code.length !== 6 || isLoading}
                className={`w-full py-3 rounded-lg font-semibold shadow-md transition-all flex justify-center items-center ${
                  code.length === 6 
                    ? 'bg-gradient-to-r from-forcall-600 to-earth-600 text-white hover:from-forcall-700 hover:to-earth-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  'Verificar Acceso'
                )}
              </button>
              
              <div className="text-center">
                 <button type="button" onClick={() => setStep('setup')} className="text-sm text-gray-400 underline">
                   ¿Problemas? Volver a configurar
                 </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
