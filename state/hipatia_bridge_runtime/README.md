# Hipatia Bridge Runtime

Fuente versionada del código y los contratos que ejecuta Hipatia Local en
`127.0.0.1:8765`.

## Frontera de autoridad

- Este directorio contiene código, pruebas, esquema y herramientas de despliegue.
- La instancia operativa vive fuera de Git, normalmente en
  `D:\Biblioteca de Hipatia\_bitacora`.
- La autoridad de cierre sigue siendo el JSONL operativo. Esta proyección no
  sustituye, reconstruye ni importa los datos soberanos.
- PuenteDeMando y Sites son superficies de interfaz. No son fuentes del escritor
  ni del ledger local.

Quedan excluidos deliberadamente:

- `events/`, `index/`, `daily/`, `closure/`, `evidence/` y `operations/`;
- copias de seguridad, logs, SQLite y vistas reconstruibles;
- configuración local de repositorios o raíces;
- credenciales, tokens y material clínico o protegido.

## Contenido

- `server/`: módulos Python copiados byte a byte del runtime observado.
- `tests/`: pruebas y verificador existentes en el runtime, más la prueba del
  manifiesto de esta proyección.
- `schema/`: contrato JSON público del evento.
- `deploy/runtime-manifest.json`: rutas y SHA-256 capturados.
- `deploy/sync_to_local.ps1`: comparación y despliegue explícito de los archivos
  gestionados.

## Verificación

Desde este directorio:

```powershell
.\tests\run_portable.ps1
.\deploy\sync_to_local.ps1
```

La segunda orden solo compara. No escribe. Para desplegar hace falta invocar
deliberadamente `-Apply`; el script crea una copia de los archivos gestionados,
rechaza hashes de origen inesperados y se niega a copiar mientras el puerto 8765
esté escuchando. No detiene ni inicia procesos y nunca toca los datos.

## Bindings operativos heredados

La proyección byte a byte conserva tres rutas absolutas del runtime actual. No
son configuración portable ni autoridad nueva:

| Módulo y símbolo | Acceso observado | Frontera |
|---|---|---|
| `bitacora_server.py · OBSIDIAN_ROOT` | lectura y escritura | vault sincronizado |
| `closure_core.py · OBSIDIAN_REPORT` | escritura | vault sincronizado |
| `closure_core.py · OBSIDIAN_DAILY` | lectura | vault sincronizado |

El manifiesto las enumera con `decision_status:
inherited_pending_review`. Las escrituras producen vistas diarias, MOC y
`CIERRE_OPERATIVO.md`; su presencia aquí registra el comportamiento heredado,
pero no decide que la membrana hacia el vault sincronizado sea correcta ni
autoriza nuevas escrituras. Esa decisión queda pendiente de revisión humana.

La prueba del manifiesto falla si aparece una cuarta ruta absoluta, cambia un
binding sin actualizar el contrato o una escritura deja de estar marcada como
decisión pendiente.

## Regla de cambio

Todo cambio futuro parte de esta fuente, actualiza pruebas y manifiesto, se
revisa en Git y solo después se sincroniza hacia la instancia operativa mediante
un GO de despliegue independiente.
