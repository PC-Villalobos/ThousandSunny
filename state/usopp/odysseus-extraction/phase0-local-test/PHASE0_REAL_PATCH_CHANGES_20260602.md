# Phase 0 Real Patch — Cambios para hub-server.js

Date: 2026-06-02
Estado: LISTO PARA APLICAR — post-W12, con hardening de trust boundary
Autorización: requiere GO C0 explícito del Capitán antes de deploy

---

## Qué contiene este directorio

`hub-server.phase0-local-test.js` es la versión de referencia del hub real.
Incluye todos los patches Phase 0 más los tres fixes de hardening de post-W12.

`sunny_security_kernel.js` debe copiarse junto a `hub-server.js` en el mismo directorio.

---

## Cómo aplicar (en la máquina del Capitán)

1. Copiar el kernel al directorio del hub:
   ```
   Origen:  state/usopp/odysseus-extraction/phase0-local-test/sunny_security_kernel.js
   Destino: C:\Users\usuario\...\thousand-sunny-hub\sunny_security_kernel.js
   ```

2. Reemplazar hub-server.js con la versión parchada:
   ```
   Origen:  state/usopp/odysseus-extraction/phase0-local-test/hub-server.phase0-local-test.js
   Destino: C:\Users\usuario\...\thousand-sunny-hub\hub-server.js
   ```

3. Reiniciar el hub:
   ```
   node hub-server.js
   ```

---

## Cambios Phase 0 vs hub-server original (hub-server.local-context.js)

### P0-1: Integración del Security Kernel
- `require('./sunny_security_kernel')` importa `isToolAllowed`, `untrustedContextMessage`, `resolveAndCheckPath`, `checkOutboundUrl`
- Nuevas constantes: `LOCALHOST_IPS`, `TRUSTED_ROLES`, `SUNNY_ALLOWED_ROOTS`, `DESKTOP_PATH_FIELDS`

### P0-2: Sistema de roles por actor
- `isLocalRequest(req)` — detecta conexión local por socket address (ver hardening abajo)
- `getRequestToken(req)` — extrae Bearer o query param
- `resolveActorRole(req, opts)` — asigna `captain` para locales/autenticados, `public_webhook` para el resto
- `attachSecurityContext(req, role)` — añade `req.actorRole`, `req.securityContext`, `req.canUseTool()`

### P0-3: authMiddleware enriquecido
- Antes: middleware inline sin roles, token comparado con `===`
- Después: flujo con roles, `attachSecurityContext` en cada rama, token comparado con `timingSafeTokenCompare`

### P0-4: fetchJSON con checkOutboundUrl
- Antes: `fetchJSON` llamaba directamente a `fetch` sin validación
- Después: `checkOutboundUrl(url, { blockPrivate: false })` bloquea 169.254.x.x y esquemas no-HTTP antes de cada fetch saliente

### P0-5: providerSafeMessages — aislamiento de contenido no confiable
- `asUntrustedContent(label, content)` envuelve input del usuario con marcadores UNTRUSTED_SOURCE_DATA
- `providerSafeMessages(messages, label)` aplica el wrapper a todos los mensajes de rol "user" antes de enviarlos a Claude, Codex, Antigravity/Gemini
- Antes: los mensajes se pasaban directamente; input del Capitán podía contener prompt injection dirigido al proveedor

### P0-6: guardDesktopPayload — confinamiento de paths
- `guardDesktopPayload(rawBody)` pasa los campos path-like (`path`, `filePath`, `workingDir`, etc.) por `resolveAndCheckPath`
- Bloquea traversal fuera de `SUNNY_ALLOWED_ROOTS` y paths sensibles (.ssh, .env, etc.)

### P0-7: tool gating en /api/desktop y /api/telegram/outgoing
- `/api/desktop`: verifica `req.canUseTool(requestedTool)` antes de llamar al bridge; 403 si el rol no permite
- `/api/telegram/outgoing`: verifica `req.canUseTool("telegram_send")`; sólo `captain` puede enviar

### P0-8: redactUrlForLog
- URLs de Telegram con `/bot<token>` se redactan en logs

---

## Hardening post-W12 (estos 3 cambios son nuevos vs la local-test original)

### H-1: isLocalRequest — FIX CRÍTICO (trust proxy boundary)
**Problema**: `req.ip` en Express es procesado por la capa trust proxy. Si en el futuro se añade un proxy inverso (nginx, Cloudflare Tunnel), sin `app.set('trust proxy', ...)` explícito, `req.ip` podría reflejar `X-Forwarded-For` controlado por el cliente → spoofing de IP local → escalada de rol a `captain`.

**Fix aplicado**:
```javascript
// ANTES (vulnerable a trust proxy):
function isLocalRequest(req) {
  const ip = req.ip || req.connection?.remoteAddress || "";
  return LOCALHOST_IPS.has(ip);
}

// DESPUÉS (socket-level, no afectable por headers HTTP):
function isLocalRequest(req) {
  const socketAddr = req.socket?.remoteAddress || req.connection?.remoteAddress || "";
  return LOCALHOST_IPS.has(socketAddr);
}
```

`req.socket.remoteAddress` es la dirección TCP del peer real. No puede ser modificada por cabeceras HTTP.

### H-2: timingSafeTokenCompare — timing attack mitigation
**Problema**: `===` en comparación de tokens tiene tiempo de ejecución variable según posición del primer carácter diferente → timing oracle para enumerar tokens.

**Fix aplicado**: nueva función con `crypto.timingSafeEqual` (tiempo constante). Token compare en authMiddleware usa `timingSafeTokenCompare(getRequestToken(req), HUB_TOKEN)`.

### H-3: crypto require añadido
`const crypto = require("crypto");` añadido a los imports del módulo (Node.js built-in, sin dependencias).

---

## Pendiente / deferred

### blockPrivate: false — decisión pendiente del Capitán
`fetchJSON` usa `blockPrivate: false` para permitir:
- `http://localhost:3334` (bridge local)
- Potencialmente IPs privadas en dev

Para endpoints externos (Claude API, OpenAI, GAS) no es necesario. Solución ideal: pasar `blockPrivate` por llamada según tipo de destino. **Deferred** hasta que el Capitán decida si hay entornos con hub detrás de NAT que necesiten rutas privadas.

### DNS rebinding / TOCTOU
`checkOutboundUrl` resuelve DNS antes del fetch; Node puede resolver de nuevo en el fetch real. Riesgo bajo para proveedores estáticos conocidos. Monitorear si se añaden endpoints dinámicos.

### Regression harness Phase 1
Tests pendientes: Puente no double-render, Telegram echo, Bitácora dedup, URL/path blocks.
Autorización requerida antes de ejecutar contra el hub real.

---

## Verificación post-apply

```bash
# El hub arranca sin errores
node hub-server.js

# El kernel se carga correctamente
curl http://localhost:3333/api/status

# Con AUTH desactivado (sin HUB_TOKEN): todas las rutas accesibles
# Con AUTH activado (HUB_TOKEN configurado):
#   - localhost: acceso directo como captain
#   - externo sin token: 401
#   - externo con token correcto: acceso según rol solicitado
```

---

*Referencia: hub-server.phase0-local-test.js + sunny_security_kernel.js en este mismo directorio*
*Parche preparado por Nami post-W12, 2026-06-02*
