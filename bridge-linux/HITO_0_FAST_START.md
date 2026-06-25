# Hito 0 — Fast start (lo que se puede adelantar SIN el PC)

Estado: runbook · Fecha: 2026-06-25
Referencia de diseño: `bridge-linux/ARQUITECTURA.md`

## La clave que desbloquea todo

**Laboon (el VPS) no depende del PC.** En la arquitectura, Odysseus vive en el
Linux PC (en reparación) pero **Laboon vive en el VPS Hetzner**, que es
independiente. Por tanto la mitad "siempre encendido" del Hito 0 —VPS + Open WebUI
+ DeepSeek— se puede levantar **ahora, desde el móvil**, antes de recoger el
ordenador. Cuando llegue el PC, Odysseus se conecta a un cerebro que ya respira.

## Checklist (orden de ejecución)

### 0. Cuentas (móvil, navegador)
- [ ] Crear cuenta **Hetzner Cloud** (console.hetzner.cloud).
- [ ] Crear **API key de DeepSeek** (platform.deepseek.com) → guárdala como secreto.

### 1. Provisionar el VPS (Hetzner)
- [ ] Nuevo servidor: **CAX11** (ARM, ~€4/mes) o **CX22** (x86) — sobra para Open WebUI.
- [ ] Imagen: **Ubuntu 24.04**. Región: la más cercana (Núremberg/Helsinki).
- [ ] Añadir tu **clave SSH** (o usa la consola web de Hetzner si vas desde el móvil).
- [ ] Anota la IP pública.

### 2. Instalar Open WebUI (Docker)
Desde la consola/SSH del servidor:
```bash
# Docker
curl -fsSL https://get.docker.com | sh
# Open WebUI (datos persistentes en un volumen)
docker run -d --name open-webui --restart always \
  -p 127.0.0.1:3000:8080 \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```
> Nota: se publica en `127.0.0.1`, **no** en `0.0.0.0` — no lo expongas crudo a
> internet. Acceso seguro en el paso 4.

### 3. Conectar DeepSeek como motor
DeepSeek es **compatible con la API de OpenAI**. En Open WebUI →
**Settings → Connections → OpenAI API**:
- Base URL: `https://api.deepseek.com/v1`
- API Key: `<tu key DeepSeek>`  (queda server-side, no en el cliente)
- Modelos: `deepseek-chat`, `deepseek-reasoner`.

### 4. Acceso seguro desde Android (elige uno)
- **Recomendado — Tailscale** (red privada, sin abrir puertos): instala Tailscale en
  el VPS y en el móvil; entras por la IP de Tailscale. Cero exposición pública.
- Alternativa — **Caddy + dominio**: reverse proxy con HTTPS automático. Solo si
  necesitas URL pública; entonces bloquea el registro (paso 5) **antes** de exponer.

### 5. Cerrar la puerta
- [ ] Crea tu **cuenta admin** en Open WebUI (la primera cuenta es admin).
- [ ] **Desactiva el registro abierto** (Settings → Auth → disable new sign-ups).
- [ ] Verifica que el puerto 3000 NO es accesible desde la IP pública (solo
      127.0.0.1 / Tailscale).

## Resultado

Al cerrar el paso 5 tienes **Laboon operativo**: Open WebUI en el VPS, hablando con
DeepSeek, accesible desde el móvil. Eso es Hito 0 completo + el arranque de Hito 1/2
(faltará conectar el vault como RAG y cargar los system prompts de los nakamas).

## Lo que SÍ espera al PC (Odysseus)

- Instalar Linux en el PC.
- Odysseus (fork) para email/calendario/docs/research pesado.
- Obsidian vault local + Obsidian Sync (el micelio) ↔ GitHub.
- Agentes pesados / Ollama local.

## Seguridad (no negociable)

- La **API key de DeepSeek** vive solo en el servidor (Open WebUI server-side),
  nunca en el repo ni en el cliente.
- Nada de Open WebUI público sin auth. Tailscale por defecto.
- Esto NO toca datos clínicos (Caso 0 / Chopper): esa zona llega en Hito 4 con
  guardrails Deckard propios.
