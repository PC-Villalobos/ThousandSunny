---
id: NEM-chopper-protocolo
estado: activo
dominio: NEM
confidencial: true
certeza: N3
tags: [chopper, clinica, zona-protegida, keystone]
---

# Chopper — la memoria protegida (el vaso vacío)

Estado: **ZONA PROTEGIDA** · canon de diseño · Fuente: Capitán, 2026-06-27

> **AVISO.** Este directorio contiene **SOLO plantillas vacías**. **Ningún dato de
> paciente entra en el repo (la nube).** El contenido real vive **local, cifrado, bajo
> tu keystone** (`LLAVES_DEL_CAPITAN.md`), leído solo por **Chopper en un motor local**
> — nunca por una IA de nube (ni Claude, ni Gemini, ni ChatGPT).

## Para qué

Chopper necesita **memoria episódica perfecta** (fechas, sesiones, qué pasó cuándo) y
**semántica** (patrones, sentido) de tus pacientes — sin eso no puede acompañar. Este es
el **vaso vacío** de esa memoria: la estructura. Tú la llenas en local.

## Las cuatro reglas (innegociables)

1. **Local y cifrada.** La memoria clínica vive en el vault **local**, cifrada en
   reposo. Nunca en el repo público, nunca en la nube.
2. **Bajo keystone.** Se descifra solo con tu llave (offline). El mapa
   **nombre ↔ pseudónimo** vive en la keystone, **no** en las notas.
3. **Motor local.** La lee **Chopper sobre un motor local** (DeepSeek local / Ollama).
   El dato del paciente **jamás** sale a una API de nube. (Por esto vale la soberanía.)
4. **Pseudonimización.** En las notas el paciente es un **ID** (`PAC-0001`), nunca un
   nombre. (Buena práctica clínica + GDPR.)

## El pipeline (local, futuro — Hito 4)

```
Sesión (Doctoralia / Noa Notes, compliant)
  -> transcripción
  -> [LOCAL] Chopper destila: nota de sesión (episódica) + actualiza patrones (semántica)
  -> [LOCAL] vault cifrado, bajo keystone
```

Ninguna etapa toca la nube. Se materializa cuando el cuerpo soberano (Linux + motor
local + keystone) esté listo.

## Plantillas (vacías)

- `templates/SESION.md` — nota de sesión (memoria **episódica**).
- `templates/PACIENTE.md` — el paciente como nodo (hilo de sesiones + patrones).
- `templates/PATRON.md` — patrón clínico (memoria **semántica**).

## Conexión con el canon

`AGAPE.md` (la ética: feedback simbólico, "imagen digna de tu amor", no caricatura) ·
`LLAVES_DEL_CAPITAN.md` (la keystone) · `TESIS.md` (motor local = soberanía) ·
bridge-linux Hito 4 (Chopper reemplaza Noa Note).
