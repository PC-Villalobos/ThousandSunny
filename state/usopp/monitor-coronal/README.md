# Monitor Coronal V1

Superficie local de lectura para observar el momentum del Thousand Sunny sin
convertirse en memoria, ledger ni canon.

**Lo que V1 mide es salud y presencia de fuentes.** El propósito del instrumento
—observar la coherencia del diálogo humano-IA— está redefinido por el Capitán el
2026-08-17 en `ESTATUTO_COHERENCIA.md`, y todavía no está implementado. Leer ese
documento antes de proponer un V2.

## Estatuto

- `mode: read_only`
- `authority_effect: none`
- `completeness: unknown`
- Hipatia Local conserva la autoridad operativa.
- Las vistas física y Obsidian son proyecciones reconstruibles.
- Una fuente conectada prueba observabilidad, no cobertura completa.

## Fuentes de V1

| Fuente | Lectura | Autoridad declarada |
| --- | --- | --- |
| Hipatia Local | Viva: salud, adaptadores y resumen de cierres | `operational_authority` |
| Biblioteca física | Snapshot de metadatos | `durable_artifacts` |
| Obsidian / Hipatia | Snapshot de metadatos | `derived_view` |
| Maceta de Groot | Snapshot público-seguro | `workspace_metadata` |
| ThousandSunny | Snapshot Git local | `canonical_checkout_metadata` |
| Rocket / Ubuntu | `unknown` hasta disponer de canal de salud | `runtime_observer` |
| Arqueología cognitiva | Declarada, no inventariada | `archive_reference` |

Quedan fuera Drive, conversaciones de Claude, Codex/ChatGPT e Isaac, contenidos
clínicos, `NEM`, `CLI`, ejecución de rutinas, escritura y mutaciones Git.

## Uso local

```powershell
npm install
npm run connectors:refresh
npm run dev
```

El colector actualiza únicamente `app/data/local-snapshot.json`. Hipatia se
consulta en vivo desde `http://127.0.0.1:8765` y degrada su tarjeta si no está
disponible.

## Evidencia de absorción

- Misión: `MONITOR-CORONAL-V1-CONNECTORS-READONLY`
- Evento: `BIT-20260802T150524Z-51300a9e39ce`
- Estado verificado: `closed`

Rocket Health y la cartografía arqueológica requieren misiones y GO separados.
