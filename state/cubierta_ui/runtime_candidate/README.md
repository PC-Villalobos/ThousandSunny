# Candidato de runtime de la Cubierta

Esta carpeta parte de los artefactos observados en D y la VM fijados bajo `../baseline/`. Es el
candidato versionado para un despliegue posterior; **no está desplegado**.

Cambios respecto al baseline:

- `initialOrder()` conserva `event.schema` como `contract_version`.
- La reconstrucción de eventos antiguos conserva ejes ausentes como `not_recorded`.
- `translateOrder()` no colapsa ausencia en `unknown` y proyecta `contract_version`.
- La Cubierta muestra `proposed_at`, separa aviso estructural de aviso histórico y refuerza
  visualmente que la ejecución pertenece a la orden.
- El modo de vista previa consulta exclusivamente `/preview/control` y desactiva el formulario.

Copiar estos ficheros a D o a la VM requiere otro GO. Esta rama no contiene automatismo de
despliegue.
