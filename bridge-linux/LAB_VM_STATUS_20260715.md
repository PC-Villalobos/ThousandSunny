---
status: active
timestamp: 2026-07-15T16:50:00+02:00
sensitivity: public_safe_no_secret
linux_dependency: lab_vm_only
---

# Estado laboratorio VM - 2026-07-15

## Veredicto

El laboratorio Ubuntu en VirtualBox esta operativo para pruebas sinteticas.

No autoriza usar Hipatia real, capsulas, llaves ni material resoluble.

## Estado probado

- Open WebUI responde en `http://127.0.0.1:3000`.
- Vault sintetico: `~/thousand-sunny-lab/vault-test`.
- RAG sintetico recupera `FARO-SINTETICO-741` y la baliza verde.
- Ollama esta instalado en el laboratorio.
- Modelo local pequeno probado: `smollm2:135m`.
- El modelo local responde, pero no es fiable para razonamiento; sirve para probar cableado.

## Almacenamiento

Se anadio un segundo disco virtual de 25 GB para Docker.

- raiz Ubuntu: 25 GB, con espacio libre tras limpieza;
- disco tecnico Docker: 25 GB montado en `/mnt/tslab-docker`;
- `DockerRootDir`: `/mnt/tslab-docker`;
- `containerd` configurado con raiz en `/mnt/tslab-docker/containerd`.

## Compuertas verificadas

- sin carpetas compartidas VirtualBox (`vboxsf = 0`);
- clipboard y drag-drop no forman parte del flujo de datos;
- Open WebUI monta solo volumen Docker interno;
- Ollama monta solo volumen Docker interno;
- no hay claves de proveedor activas;
- no hay rutas, Drive IDs, `source_ref`, Hipatia real ni Caso 0 en el vault sintetico.

## Limites

El disco Docker queda util pero justo. No usar modelos grandes en esta VM.

Para razonamiento real con modelos comerciales usar solo `sient-etico`.

Para razonamiento local soberano hara falta mas hardware o una VM con mas almacenamiento.

## Regla

```text
El lab prueba cableado. No prueba permiso sobre datos reales.
Hipatia real no entra en la VM sin decision de seguridad aparte.
```
