# Vista previa local, efímera y sanitizada

La vista consulta por GET el endpoint vivo indicado en `SUNNY_PREVIEW_SOURCE_URL`, mantiene el
resultado en memoria, elimina instrucciones reales, actores libres, respuestas, evidencias,
credenciales e identificadores personales, y sirve la Cubierta candidata en `127.0.0.1:4328`.

No escribe snapshots ni permite POST. `SUNNY_PREVIEW_INIT_DATA` solo se lee del entorno y nunca se
devuelve al navegador ni se registra.

```powershell
$env:SUNNY_PREVIEW_SOURCE_URL='http://127.0.0.1:4317/v1/cubierta/control'
$env:SUNNY_PREVIEW_INIT_DATA='<initData efímero>'
node state/cubierta_ui/preview/server.mjs
```

El proceso se detiene con `Ctrl+C`. Al terminar no queda snapshot en disco. Este comando no es un
despliegue y no debe exponerse fuera de loopback.
