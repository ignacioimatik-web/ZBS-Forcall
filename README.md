<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Zona Básica de Salud - Forcall

Plataforma web de gestión sanitaria para el equipo de atención primaria de la zona rural de Forcall (Castellón). 

Sistema integral que gestiona guardias, libranzas, doblas, reuniones, alertas y avisos del personal médico y de enfermería, con autenticación segura mediante **Supabase Auth** y persistencia de datos en **Supabase Database** con Row Level Security (RLS).

## Características principales

✅ **Autenticación segura** con Supabase (email/password + soporte MFA TOTP)  
✅ **Sistema de roles**: Admin, Coordinador Médico, Coordinadora Enfermería, Médico, Enfermera  
✅ **Row Level Security (RLS)** para control de acceso granular por rol  
✅ **Gestión de guardias, libranzas y doblas** con calendarios unificados  
✅ **Reuniones y sesiones clínicas** organizadas por colectivo  
✅ **Alertas sanitarias y meteorológicas** en tiempo real  
✅ **Avisos urgentes** con notificaciones push nativas  
✅ **Auditoría automática** de cambios críticos  
✅ **Interfaz responsive** optimizada para escritorio y móvil  

---

## Tecnologías utilizadas

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Estilos**: Tailwind CSS (inline)
- **Mapas**: Leaflet
- **IA**: Google Gemini AI (opcional, para transcripciones)

---

## Setup inicial

### 1. Prerrequisitos

- **Node.js** (v18 o superior)
- Cuenta en [Supabase](https://supabase.com)
- (Opcional) API Key de Google Gemini para funciones de IA

### 2. Instalación

Clona el repositorio y instala dependencias:

```bash
git clone <tu-repo>
cd ZBS-Forcall
npm install
```

### 3. Configurar Supabase

#### 3.1 Crear proyecto en Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto
3. Anota tu **Project URL** y **anon/public key**

#### 3.2 Aplicar migración SQL

1. Abre el **SQL Editor** en tu proyecto Supabase
2. Copia el contenido completo de `supabase/migrations/20260505000000_initial_supabase_integration.sql`
3. Ejecuta la migración
4. Verifica que las tablas se hayan creado correctamente en la pestaña **Table Editor**

#### 3.3 Configurar Auth

1. Ve a **Authentication > Providers**
2. Activa **Email** provider
3. Configura:
   - ✅ Enable Email provider
   - ✅ Confirm email (opcional, desactívalo para desarrollo)
   - ⚙️ **Site URL**: `http://localhost:5173` (desarrollo) o tu dominio en producción
   - ⚙️ **Redirect URLs**: añade `http://localhost:5173/**` y tu dominio de producción

#### 3.4 (Opcional) Activar MFA TOTP

1. Ve a **Authentication > Settings**
2. Activa **Multi-Factor Authentication (MFA)**
3. Selecciona **TOTP** como método

### 4. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto copiando `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` y completa tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica_aqui
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 6. Build para producción

```bash
npm run build
npm run preview
```

---

## Estructura de roles y permisos

### Roles disponibles

| Rol | Descripción | Asignación |
|-----|-------------|------------|
| `admin` | Acceso total al sistema | Manual (BD) |
| `coordinador_medico` | Gestión del colectivo médico | Manual (BD) |
| `coordinadora_enfermeria` | Gestión del colectivo de enfermería | Manual (BD) |
| `medico` | Acceso a datos propios (médico) | Autorregistro ✅ |
| `enfermera` | Acceso a datos propios (enfermería) | Autorregistro ✅ |

### Autorregistro

Los usuarios pueden registrarse como **médico** o **enfermera** desde la pantalla de login. Los roles de coordinación y administración se asignan posteriormente modificando el campo `role` en la tabla `profiles` desde el panel de Supabase.

### Asignar roles altos manualmente

1. Ve a **Table Editor > profiles** en tu panel de Supabase
2. Busca el usuario por email
3. Edita el campo `role` y selecciona:
   - `admin`
   - `coordinador_medico`
   - `coordinadora_enfermeria`
4. Guarda cambios

Los permisos se aplicarán automáticamente mediante RLS.

---

## Row Level Security (RLS)

Las políticas RLS están definidas en `supabase/migrations/...sql` y garantizan:

- **Administradores**: acceso total
- **Coordinadores médicos**: gestión solo de registros del colectivo médico
- **Coordinadoras de enfermería**: gestión solo de registros del colectivo enfermería
- **Médicos/Enfermeras**: acceso de lectura general y edición de sus propios datos

### Probar permisos

1. Regístrate con diferentes roles
2. Intenta acceder/modificar datos de otros colectivos
3. Verifica que las operaciones no autorizadas sean bloqueadas por RLS

---

## Despliegue

### Vercel / Netlify

1. Conecta tu repositorio
2. Configura las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Despliega

### Otras plataformas

Sube el contenido de `dist/` (generado con `npm run build`) a tu hosting estático preferido.

---

## Auditoría y logs

Todos los cambios críticos (guardias, libranzas, doblas, meetings, alertas) se registran automáticamente en la tabla `audit_logs` mediante triggers SQL. Los coordinadores y administradores pueden consultar el historial desde el código o expandiendo la UI con una vista de auditoría.

---

## Soporte y contacto

Para dudas o issues, contacta con el equipo de desarrollo o abre un issue en el repositorio.

---

## Licencia

Este proyecto es de uso interno para la **Zona Básica de Salud de Forcall**. Todos los derechos reservados.
