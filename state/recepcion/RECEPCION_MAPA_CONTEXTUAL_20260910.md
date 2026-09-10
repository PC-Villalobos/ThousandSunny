# Recepción externa — Mapa contextual de la obra (Codex/Usopp)

**Fecha de la recepción:** 2026-09-10
**Actor de la recepción:** claude-code (sesión cloud, `claude/optimistic-johnson-8a7pa4`)
**Rol:** Nami — navegación y contraste
**Constructor del documento:** Codex, rol Usopp, en la máquina del Capitán
**Ruta de origen:** `C:\Users\usuario\Documents\Codex\2026-09-09\por\outputs\mapa-contextual-de-la-obra.md`
**GO que autoriza este fichero:** Capitán, 2026-09-10, en esta sesión: *«sube el mapa a state/ como
documento de trabajo»*

---

## Qué es este fichero y qué no

El cuerpo que sigue es **copia literal** del documento que el Capitán pegó en la sesión. No se ha
editado, resumido ni corregido: ni una palabra, ni un enlace, ni una etiqueta epistémica. Todo lo que
esta sesión tiene que decir sobre él está **aquí arriba**, separado, para que nadie confunda la voz de
Codex con la de quien lo transporta.

El documento **se declara a sí mismo** versión de trabajo 0.1, síntesis interpretativa, pendiente de
revisión autoral, de uso privado. Esa cabecera es suya y manda: **no es canon**, y aterrizarlo en el
repo no lo asciende. Un fichero commiteado no gana autoridad por estar commiteado.

Por qué se sube: hasta hoy vivía solo en la máquina del Capitán. Es exactamente la fragilidad que
`POSICION.md` §1 documenta con los árboles muertos — trabajo real que ningún otro nakama puede leer
porque está en un disco al que nadie más llega.

## Lo que esta sesión comprobó, y lo que no

**Comprobado contra `origin` el 2026-09-10.** El desfase de git que el documento denuncia es exacto:

| Comparación | Dice el mapa | Verificado |
|---|---|---|
| `1f80c84` → `f08692c` (misma rama, `agent/cubierta-not-recorded-preview`) | 54 detrás | 54 detrás, **0 exclusivos** |
| `1f80c84` → `265d6e7` | 59 detrás | 59 detrás, **0 exclusivos** |
| `1f80c84` → tronco al recibir esto (`40c3e44`) | — | 60 detrás |

El matiz que conviene no perder: **cero commits exclusivos del clon local**. No hay trabajo perdido
ahí. Es puesta al día, no rescate. Nada se sincronizó en esta sesión.

**Una carencia del mapa, no del Capitán.** El documento deja abierta la contradicción sobre el estado
de GAS entre tres fuentes. `POSICION.md` §4 la cierra con una decisión del propio Capitán del
**2026-07-24**, evento `BIT-20260724T134345Z`: la Bitácora de Hipatia en `127.0.0.1:8765` es la
autoridad operativa y GAS queda como antecedente histórico. **`POSICION.md` no figura entre las
fuentes de la expedición.** Es el ancla de posición del barco, y la arqueología se hizo sin ella.
La otra cara: el ancla está fechada el 2026-07-26 y arrastra seis semanas de desfase.

**No comprobado.** Todo lo demás. Esta sesión no leyó las fuentes de Drive, ni los documentos de
`C:` o `D:`, ni los contextos exportados, ni el registro predictivo. Las afirmaciones del cuerpo
sobre esos materiales se atribuyen a Codex y no quedan ratificadas al subirlas aquí.

## Referencias que aquí no resuelven

El cuerpo remite a tres ficheros hermanos que **no acompañan a esta copia** y siguen solo en la
máquina del Capitán:

- `fuentes-y-cobertura.json`
- `fuentes-y-cobertura.md`
- `contexto-portatil-para-modelos.md`

Por tanto **todas las referencias entre corchetes** del cuerpo (`[H01]`, `[R01]`, `[C13]`, `[L01]`,
`[D04]`, `[G02]`, `[U01]`…) quedan colgando en este árbol: nombran entradas de un índice que aquí no
existe. Se deja constancia expresa para que la auditoría N3 de la Función de Sueño las cuente como
huérfanas conocidas y declaradas, no como un hallazgo nuevo cada noche.

## Convergencia que conviene registrar

La «unidad mínima de trabajo» que el cuerpo propone —*intención → fuentes pertinentes → tarea →
artefacto → revisión de Antonio → aprendizaje conservado*— coincide con el **Encargo** implementado
en `cubierta/server/encargos.mjs` el mismo día, por camino independiente. De las ocho preguntas de
evaluación que el mapa propone, el Encargo registra seis; quedan dos huecos nombrados: **qué hizo
efectivamente** (la autonomía es una autorización, no un registro de acciones ejecutadas) y **qué
aprenderá la siguiente sesión** (el diario conserva el encargo, no destila aprendizaje ni escribe en
la Bitácora).

De los tres niveles de contexto que el mapa propone, el Encargo implementa el tercero —el paquete de
tarea— completo. El contexto común y el de dominio no existen todavía.

---

# Mapa contextual de la obra de Antonio

Corte de lectura: 9–10 de septiembre de 2026. Versión de trabajo 0.1, elaborada por Codex/Usopp. Uso privado. Síntesis interpretativa pendiente de revisión autoral; no sustituye las fuentes, no cambia su autoridad y no constituye una autorización para operar sobre ellas.

**La unidad que encuentro es una búsqueda de continuidad entre experiencia, sentido, cuidado, conocimiento y creación.** Ágape, la práctica profesional, la investigación, la escritura y el sistema de agentes participan de esa búsqueda con funciones diferentes. Esta formulación es **INFERIDA** por mí a partir de las fuentes; no la presento como una definición tuya ya aprobada.

La compañía agéntica puede aportar capacidad de trabajo a esa obra: conservar contexto, distribuir funciones y producir resultados que puedas reconocer, revisar y utilizar. La interfaz de arneses es una pieza de esa capacidad. Para diseñarla con criterio hay que comprender tanto lo que quieres construir como lo que ya existe y la historia de sus decisiones.

Las referencias entre corchetes remiten a **fuentes-y-cobertura.json** y a su índice legible **fuentes-y-cobertura.md**, en esta misma carpeta. El contexto breve reutilizable está en **contexto-portatil-para-modelos.md**.

**OBSERVADO** significa que se leyó una fuente o se hizo una comprobación concreta; no convierte todas las afirmaciones de ese documento en hechos demostrados. **INFERIDO** identifica mi interpretación. **PROPUESTO** identifica un siguiente paso. **NO_DEMOSTRADO** señala un límite de la evidencia.

## Tu intención y tu derecho de autoría

Hay dos intervenciones tuyas que deben gobernar la interpretación del conjunto. El 2 de septiembre escribiste: «mis proyectos en realidad son todos uno todo esta interconectado», y pediste que esa conexión se reflejara en el diseño del software. El 21 de agosto expresaste preocupación por notas y material generado que no reconocías como propio ni sabías de dónde procedía. Ambas cosas son compatibles: buscar una obra conectada exige poder reconocer qué pertenece a ella y qué sigue siendo una aportación ajena o provisional. [H01, H02]

Por eso, **estar en tu disco, Drive o repositorio no basta para atribuirte un texto**. Hay palabras directas tuyas, documentos que te atribuyen autoría, reconstrucciones de voz, síntesis de agentes, borradores no revisados, código y registros automáticos. El briefing de Claude del 5 de septiembre declara expresamente `ai_role: draft`, `review_status: unreviewed`, `canonical: false` y `no_publish: true`. Su voz en primera persona no lo convierte en una transcripción literal tuya. [L01]

Tampoco corresponde convertir este mapa en un perfil psicológico. El Espejo Cognitivo Soberano ya formulaba facetas revisables, contrapuntos y autoautoría. Su valor está en ayudarte a ver y corregir interpretaciones, conservando el derecho de rechazarlas. [D08]

## Qué conecta el conjunto

La Constitución de Ágape presenta la experiencia cultivada como algo que puede convertirse en alimento compartido mediante cooperación y sostenibilidad. Diferencia elaboración simbólica, práctica clínica e investigación capaz de cuestionar los propios supuestos. El manifiesto transdisciplinar amplía esa conversación entre ciencia, arte y ética. Son textos de visión y propuesta; su lenguaje científico o institucional requiere contrastación propia cuando se convierte en una afirmación empírica. [R01, R05, R06]

La tesis de Thousand Sunny desplaza la atención del modelo aislado al sistema que sostiene memoria, herramientas, corpus e iteración. TEATRO distingue función, intérprete, guion, dirección, escena y destinatario. Esa distinción permite que un Nakama conserve una función mientras cambia el modelo que la desempeña. El criterio de utilidad que aparece es concreto: libertad, tiempo y artefactos utilizables. [G01–G05]

Los documentos de agosto añaden una propuesta de continuidad longitudinal: Groot acumula historia y transformaciones; Thousand Sunny permite trabajar con ella; Bitácora conserva episodios; Hipatia aporta procedencia y memoria organizada. Los propios textos advierten que son hipótesis conceptuales y que no deben congelarse como una ontología definitiva. [R02, R08]

**INFERIDO:** el hilo conductor puede expresarse así: vivir y practicar; recoger lo significativo; elaborarlo y contrastarlo; convertirlo en cuidado, conocimiento u obra; conservar el aprendizaje para la siguiente vuelta. La infraestructura sirve a esa continuidad. El modelo concreto es reemplazable; tu intención y la procedencia del trabajo deben poder sobrevivir a ese reemplazo.

## Las líneas de obra y sus relaciones

| Línea | Qué aparece en las fuentes | Conexión con el conjunto | Estado y límite de esta lectura |
| --- | --- | --- | --- |
| Ágape: pensamiento, símbolo y cultura | Constitución, cosmogonía, ética del acompañamiento, programa de investigación y propuesta editorial | Da lenguaje y preguntas sobre experiencia, sentido y cooperación; puede producir textos y proyectos culturales | Hay corpus conceptual concreto. Su ratificación actual y el alcance de la obra editorial terminada no se han reconstruido por completo. [R01, R03, R05, G03] |
| Práctica profesional y Némesis | Acompañamiento, método propio, notas y devoluciones simbólicas; tu decisión actual sobre precios | Sostiene cuidado y economía; plantea preguntas que pueden nutrir investigación y escritura mediante transformaciones apropiadas | Los documentos clínicos individuales quedan fuera de este mapa. No se demuestra eficacia del método ni está verificado el circuito completo Plaud → revisión → devolución. [U01, R01, G03] |
| Investigación y doctorado | Preproyecto de julio de 2025 sobre IA y psicoterapia; programa Ágape; funciones de crítica y validación | Contrasta hipótesis y permite que las ideas se corrijan; no necesita confirmar la cosmología que las inspira | Se leyó una parte del preproyecto, no la tesis completa. El registro de agosto y el briefing de septiembre describen el itinerario doctoral congelado; se atribuye a esas fuentes, sin verificación institucional. [C13, R03, R07, L01] |
| Literatura y creación narrativa | Sinopsis de thriller trabajada contigo en agosto; Astrología Terrestre como propuesta narrativa y pedagógica | Abre una producción cultural con valor propio; puede dialogar con agencia, poder, territorio y sentido | La sinopsis es evidencia directa de creación. Su vinculación a Ágape es una posible lectura, no una decisión tuya demostrada. No se ha leído una novela completa. [H03, C15] |
| Aprendizaje, cuerpo y vida material | Referencias a surf, territorio, ciclos, práctica y organización personal | Recuerda que la utilidad del sistema se mide también en vida practicada, aprendizaje y tiempo disponible | El surf aparece en el briefing y en el contexto de trabajo; esta expedición no ha leído un corpus específico suyo. No se le asigna una doctrina propia sin fuentes. [L01, C15] |
| Contraste de predicciones | Registro con método explícito para comparar predicciones y resultados, condiciones y secuencia temporal | Aporta un ejemplo concreto de disciplina de evidencia transferible a otras investigaciones | Existe un documento actualizado el 9 de septiembre. No se verificaron señales, cotizaciones ni todos sus veredictos; no prueba capacidad predictiva ni rentabilidad. [R12] |
| Groot, Hipatia y la infraestructura de agentes | Mapas, arquitectura, contratos, roles, memoria, interfaces, kernels y repositorios | Conserva contexto y convierte intenciones en trabajo trazable dentro de cada dominio | Hay diseño y código sustantivos. La operación unificada de extremo a extremo sigue sin demostrarse en esta revisión. [C08, C11, D04–D09, G01–G06] |

Conectar estas líneas no exige que todos sus materiales circulen del mismo modo. Una pregunta de investigación puede proceder de la práctica sin trasladar expedientes a una memoria general; una novela puede dialogar con Ágape sin quedar obligada a ilustrar su doctrina; una metáfora puede orientar un diseño sin actuar como prueba científica. La relación debe conservar el origen, el tipo de transformación y su destino.

## Cómo ha evolucionado la intención

| Momento documental | Desarrollo que se puede sostener | Qué no se deduce de esa fecha |
| --- | --- | --- |
| Julio de 2025 | El preproyecto ya conecta IA, práctica psicoterapéutica e investigación. [C13] | No prueba matrícula, resultados ni continuidad institucional actual. |
| Marzo–abril de 2026 | La Constitución articula Ágape, clínica, investigación y conocimiento; Hipatia y GAS ofrecen primeros soportes de memoria y coordinación. [R01, R05, R10, R11] | Los nombres de versión y de institución no prueban vigencia técnica ni reconocimiento oficial. |
| Mayo de 2026 | Segundo cerebro transdisciplinar, Deckard, Metatrón y Micelio desarrollan organización del conocimiento y trabajo asistido. La idea de ampliar capacidad empresarial ya aparece aquí. [C05–C07, R04, R06] | Las analogías genómicas, geométricas o neuronales no constituyen validación experimental. |
| Junio de 2026 | La Maceta toma forma como atlas; semilla, árbol, bosque y Ent ofrecen una gramática de crecimiento y cuidado. TESIS, AGAPE y TEATRO explicitan continuidad, ética y portabilidad. [C01, C02, C08, C10, C11, C14, G02–G04] | No toda rama del atlas tiene una implementación o una obra terminada. |
| Julio de 2026 | Se documentan un hub propio, separación entre mapa y archivo privado, grafo de funciones y motores y un kernel que prepara sobres de trabajo. [D04–D07] | El kernel leído declara que no ejecuta modelos ni herramientas; no es un arnés autónomo ya operativo. |
| Agosto de 2026 | El Espejo plantea autoautoría; el paquete Nakama acota contexto por misión; los documentos del 24 proponen continuidad longitudinal y memoria entre modelos. [D08, D09, R02, R08] | Una propuesta de alineación no resuelve por sí sola qué copia o autoridad debe prevalecer. |
| Septiembre de 2026 | Reafirmas la unidad de tus proyectos; el briefing integra praxis, economía, investigación y soporte técnico; GitHub incorpora trabajo sobre Cubierta; aparece un nuevo registro predictivo. [H01, H04, L01, R12] | Un briefing reciente puede citar estados antiguos. Un commit publicado no demuestra funcionamiento integral. |

Esta secuencia es una genealogía documental seleccionada. La fecha de modificación de un archivo no equivale a la fecha en que tuviste una idea, la aceptaste o la pusiste en práctica.

## Los nombres tienen historia

| Nombre | Función observada en una o varias etapas | Distinción necesaria para continuar |
| --- | --- | --- |
| Groot / Maceta | Atlas, cultivo de conocimiento, memoria metabolizada y propuesta de continuidad longitudinal | No equivale a Antonio, a un modelo de IA concreto ni a cualquier carpeta que lleve ese nombre. [C01, R02, R08] |
| Thousand Sunny | Ecosistema técnico y lenguaje de coordinación; tesis, ética, roles, herramientas e interfaces | A veces designa todo el sistema y otras veces un repositorio. Registrar el alcance cuando se use. [G01, R02] |
| Hipatia | Índice y memoria distribuida en documentos tempranos; archivo privado; semántica validada en propuestas posteriores | Su autoridad cambia entre estratos. No aplanar esas definiciones ni sustituir comprobaciones operativas por la lectura de un documento. [R01, R11, D05, R02] |
| Bitácora | Registro episódico, procedencia, decisiones y seguimiento | Hay implementaciones y documentos históricos diferentes. Un texto llamado Bitácora no demuestra una entrada aceptada en la autoridad operacional actual. [R08, L02] |
| Nakama | Funciones y skills que pueden interpretar distintos modelos | La identidad narrativa no debe ampliar permisos. Función, modelo, contexto y autorización son dimensiones distintas. [G04, G05, D06, D09] |
| Franky, Brook, Laboon y soportes | Construcción y ejecución; continuidad abierta; modelos como intérpretes, según el estrato | Algunas formulaciones proceden del briefing no revisado. Son vocabulario útil para contrastar, no una arquitectura única ya aceptada. [C11, L01] |
| Metatrón, Sofia, Deckard | Auditoría normativa, validación epistemológica, organización, segundo cerebro y campo de relaciones según la fuente | Hay cambios de significado y funciones que se solapan. Hace falta un glosario temporal, no reasignar retroactivamente todos los textos. [R01, R05, C03, C06, C07, C12] |
| Cubierta / Puente de Mando | Presencia, navegación, interacción y proyección del trabajo | La superficie visible debe remitir al proceso que existe y a su estado efectivo. Su presencia no crea memoria ni ejecución por sí sola. [G06, D04, D06] |

## Lo que sigue sin encajar

**Autoría frente a acumulación.** Tu preocupación por material que no reconoces impide tratar el inventario como obra aceptada. La conexión que falta tiene una dimensión editorial: distinguir incorporación, revisión, rechazo y procedencia. La solución propuesta es añadir esa distinción al mapa, sin reescribir ni mover ahora los originales. [H02, D08]

**GAS tiene estados contradictorios entre documentos.** El estado de Drive del 23 de agosto lo declara obsoleto como sustrato operativo; el briefing de Claude del 5 de septiembre aún lo presenta como vía obligatoria para determinadas operaciones. El README de PuenteDeMando también habla de legado en migración. No he resuelto esa contradicción atribuyendo autoridad automática al documento más reciente. [R07, L01, G06]

**Las versiones y las raíces no coinciden siempre.** El documento de Hipatia leído lleva cabecera v1.2, mientras el briefing cita v1.1; un documento de sistema titulado v4.1 conserva cabecera v4.0. Existen declaraciones históricas que hacen de D: la raíz activa y de otras copias espejos, junto a trabajo posterior en C:. Esto requiere reconciliación fechada antes de elegir destinos de escritura. [R10, R11, L01, C04, D01–D03]

**Un clon concreto está por detrás de su propia rama remota.** En `C:\Users\usuario\OneDrive\Documentos\GitHub\ThousandSunny`, la rama local `agent/cubierta-not-recorded-preview` está en `1f80c84fbc360bf8aafa961247f1275285e2c0dc`. GitHub muestra la misma rama en `f08692cd37b55f96f8b34a86740a056387fc2c59`: 54 commits adicionales y ninguno exclusivo del local. La comparación usa ascendencia, no sólo fechas. La rama predeterminada es otra, `claude/franky-feature-O1BkB`, en `265d6e718ae6c6cc07a9eac1fe64915ac3858ed6`, con 59 commits adicionales respecto de ese HEAD local. Este hallazgo corresponde a ese clon; no describe todos los worktrees. No se sincronizó nada.

[Comparación con la misma rama](https://github.com/PC-Villalobos/ThousandSunny/compare/1f80c84fbc360bf8aafa961247f1275285e2c0dc...f08692cd37b55f96f8b34a86740a056387fc2c59). [Comparación con la rama predeterminada](https://github.com/PC-Villalobos/ThousandSunny/compare/1f80c84fbc360bf8aafa961247f1275285e2c0dc...265d6e718ae6c6cc07a9eac1fe64915ac3858ed6).

**La integración publicada y el funcionamiento actual son evidencias diferentes.** GitHub registra la integración de Cubierta-ui del 5 de septiembre y actividad del 9. En las comprobaciones locales del 9, los endpoints obligatorios de Hipatia en el puerto 8765 rechazaron la conexión; tampoco se observaron escuchas en 8767 y 8768. Es un corte diagnóstico, no una afirmación sobre toda infraestructura remota ni sobre lo que pueda haber cambiado después. No se usaron archivos alternativos para declarar salud o cierre.

[Integración publicada de Cubierta-ui](https://github.com/PC-Villalobos/ThousandSunny/commit/9c33576bd8f5ea090a36d0069f659a40b5d15b29). [Actividad publicada el 9 de septiembre](https://github.com/PC-Villalobos/ThousandSunny/commit/265d6e718ae6c6cc07a9eac1fe64915ac3858ed6).

**Unidad intelectual y criterios de prueba.** Los documentos intentan unir campos, pero también distinguen biología, geometría, metáfora y estilo. Algunas propuestas hacen afirmaciones científicas fuertes sin que esta lectura aporte su validación. Mantener el diálogo entre campos exige conservar esa diferencia. [C02, C07, D02, R03]

## Qué implica para el sistema de arneses

**PROPUESTO, apoyado en diseños existentes:** el contexto debería componerse en tres niveles. Un contexto común breve explica intención, vocabulario, autoría y límites. Un contexto de dominio aporta las fuentes y criterios de clínica, investigación, creación u operación. Un paquete de tarea concreta delimita propósito, materiales, acciones, presupuesto, evidencia esperada y condición de parada. [D06, D07, D09]

Así se puede reconocer la unidad de la obra conservando el contexto apropiado para cada trabajo. La continuidad entre modelos depende de que las decisiones, las fuentes, los productos y la revisión queden fuera de una conversación aislada y puedan recuperarse con su procedencia. Un nombre de Nakama, una API key o una suscripción no sustituyen esos contratos. Aquí no se ha verificado la compatibilidad comercial o técnica de todos los proveedores.

La unidad mínima de trabajo que propongo es: **intención → fuentes pertinentes → tarea → artefacto → revisión de Antonio → aprendizaje conservado**. No requiere que toda tarea termine en publicación o que todo artefacto se incorpore al corpus. La revisión puede aceptar, corregir, posponer o rechazar.

Para evaluar la interfaz conviene seguir una tarea real y preguntar: qué intención comprendió; de dónde tomó el contexto; qué función y modelo actuaron; qué hizo efectivamente; cuánto costó; qué produjo; qué falta revisar; qué aprenderá la siguiente sesión. Es una guía de evaluación derivada de los documentos, no una declaración de que ese flujo ya esté conectado.

## Por dónde seguir con fundamento

La siguiente unidad de trabajo propuesta es **reconciliar una cadena concreta de la obra, desde intención hasta resultado**, usando este mapa como punto de partida. La documentación ya localizada permite empezar por una pieza no clínica: la tesis y la ética del sistema, su traducción a roles y paquetes de contexto, y una tarea de elaboración de un texto propio. Eso permite comprobar continuidad, portabilidad, autoría y revisión sin necesitar un barrido indiscriminado del corpus.

Antes de añadir más pantallas, esa cadena debe mostrar qué pieza existente resuelve cada paso y dónde falta conexión. El kernel en sombra, el paquete Nakama, el grafo de funciones y las dos superficies ya inspeccionadas ofrecen candidatos concretos. La elección del soporte requiere la reconciliación de versiones indicada arriba; este informe no la da por hecha.

En paralelo, la lectura que más ampliaría la comprensión autoral es la de las obras completas: textos propios de Ágape, manuscritos narrativos, desarrollo del preproyecto y materiales de aprendizaje/práctica corporal. Aquí se han leído muestras y documentos de arquitectura suficientes para orientarse, pero no una edición completa de esa producción. El criterio de selección debe ser lo que tú reconoces como obra y las preguntas que quieres desarrollar.

Se conservan tus precios sin cambios: **60 € por 60 minutos; 85 € por 90 minutos; 500 € por un bono de 10 sesiones**. La duración de cada sesión del bono no aparece especificada en tu mensaje. No se publicaron cambios de tarifas. [U01]

## Alcance real de esta contextualización

Se consultaron fuentes conceptuales seleccionadas en Drive; dos repositorios accesibles en GitHub; mapas, documentos e índices de C:, Descargas, Documentos y D:; documentos exportados de Claude; y conversaciones concretas de Codex/ChatGPT. El índice adjunto especifica el tramo leído y la procedencia de cada referencia. Algunas referencias son copias o pasajes distintos de una misma obra: el número de entradas del índice no representa obras únicas.

Las búsquedas de Drive fueron dirigidas y no constituyen un censo completo. No se ha leído todo C: o D:, todos los proyectos de GitHub, ni todo el historial de las aplicaciones. Claude web mostró una pantalla de inicio de sesión en el navegador disponible; la lectura de Claude se apoya en sus contextos exportados, no en su historial completo.

No se incorporaron transcripciones, notas Plaud, devoluciones identificables de pacientes ni expedientes al mapa o al paquete portátil. Una fuente de título genérico devolvió contenido de sesión y se excluyó de la síntesis y del índice compartible. No se deduce seguridad clínica a partir del título de un archivo.

Las fuentes se consultaron sin modificarlas. No se desplegaron servicios, no se sincronizaron repositorios, no se reorganizó Drive y no se publicó este material. Los nuevos archivos son entregables locales de esta tarea. No se han añadido estos contenidos a la memoria permanente de Codex.
