# Ideas para futuras funcionalidades

## Ubicación en tiempo real para domicilios (guardada 13/05/2026)

**Stack:** Leaflet (ya instalado) + Geolocation API + Supabase Realtime + OSRM/GraphHopper

**Cómos:**
- Botón "Iniciar ruta de domicilios" → envía posición cada X segundos vía Realtime
- Coordinador ve mapa con marcadores móviles en tiempo real
- Línea de ruta trazada sobre el mapa

**AI/mejoras opcionales:**
- Optimización de ruta con OSRM/GraphHopper (gratis)
- Detección de llegada (posición quieta >5 min cerca de dirección = "en consulta")
- Turn-by-turn con API de routing
