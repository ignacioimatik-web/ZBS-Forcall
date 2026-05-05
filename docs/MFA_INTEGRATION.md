# Notas sobre MFA TOTP con Supabase

El flujo actual de 2FA en `TwoFactorScreen.tsx` usa una implementación local con `otpauth`. Para integrar completamente **MFA TOTP nativo de Supabase**, sigue estos pasos:

## Activar MFA en Supabase

1. Ve a **Authentication > Settings** en tu proyecto Supabase
2. Activa **Multi-Factor Authentication (MFA)**
3. Selecciona **TOTP** como método disponible

## Flujo de implementación propuesto

### Enrolment (primer setup)

```typescript
import { supabase } from '../lib/supabase';

async function enrollMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });
  
  if (error) {
    console.error('Error enrolling MFA:', error);
    return;
  }
  
  // data.totp.qr_code - código QR para escanear con app authenticator
  // data.totp.secret - clave secreta manual
  // data.totp.uri - URI otpauth://
  
  return data;
}
```

### Verificar código al hacer login

```typescript
async function verifyMFACode(code: string) {
  const factors = await supabase.auth.mfa.listFactors();
  if (factors.data?.totp.length === 0) {
    // No hay factor enrolado
    return;
  }
  
  const factorId = factors.data.totp[0].id;
  
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code
  });
  
  if (error) {
    console.error('MFA verification failed:', error);
    return false;
  }
  
  return true;
}
```

## Integración en TwoFactorScreen.tsx

Reemplazar la lógica local por:

1. En **setup mode**: llamar a `enrollMFA()` y mostrar el QR generado por Supabase
2. En **login mode**: llamar a `verifyMFACode(code)` y avanzar si es correcto
3. Sincronizar el estado de `is2FAEnabled` con los factores enrolados

## Referencias

- [Supabase MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa)
- [TOTP MFA Tutorial](https://supabase.com/docs/guides/auth/auth-mfa/auth-mfa-totp)
