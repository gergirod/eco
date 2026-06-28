# SPEC UX/UI — ECO Agencia (`/agencia`)

| Campo | Valor |
|-------|-------|
| **Versión** | v1 — post `PRODUCTO-AGENCIA.md` + research usuario |
| **Research base** | [`RESEARCH-USER-AGENCIA.md`](./RESEARCH-USER-AGENCIA.md) |
| **Persona** | Lucía + Martín (agencia boutique) |
| **Principio rector** | **La data se cuenta sola.** Si hay que explicar el bloque, el bloque está mal. |

---

## 0. North star de diseño

### Una frase

> **Cada pantalla responde una pregunta que la agencia ya se hace en voz alta — con un número, una prueba y un botón para mandárselo al cliente.**

### Las 5 C (criterio de done)

| C | Significado | Test |
|---|-------------|------|
| **Clara** | Entiende en 10s sin guía | Mom test en call |
| **Copiable** | Un click → WhatsApp | Martín copia solo |
| **Creíble** | Link YouTube al segundo | Cliente no discute |
| **Concisa** | 1 scroll principal por pantalla | Demo < 5 min |
| **Honesta** | Límites visibles | No promete chat en Luzu |

---

## 1. Sistema visual

### 1.1 Tipografía y números

| Elemento | Spec | Ejemplo |
|----------|------|---------|
| **Número hero** | 32px bold, tabular-nums, ink | `229 mil` + `mirando` 14px gray |
| **Pregunta (H1)** | 22–24px semibold | ¿Rindió la placa? |
| **Contexto temporal** | 14px gray-500 | Cuando salió Geniol en stream… |
| **Cita conductor** | 14–15px italic, line-clamp 3 | "…" |
| **Meta / canal** | 15px semibold | Geniol · Olga |
| **Labels acción** | 10px uppercase tracking-wide gray-500 | REPETIR · YA RINDIÓ |
| **Body** | 13–14px gray-600/700 | — |

**Regla:** un solo número hero por card. Si hay dos métricas, la segunda va en 13px debajo.

### 1.2 Color semántico (no decorativo)

| Rol | Uso | Tokens |
|-----|-----|--------|
| **Cliente** | Card principal, borde accent | `accent`, `accent-soft` |
| **Competidor** | Secundario, amber | `amber-50`, `amber-200` |
| **WhatsApp / entregable** | Header card alerta | `#075e54`, `#dcf8c6`, `#f0fff4` |
| **Salió bien** | Action repeat | `green-50`, `green-200` |
| **Salió flojo** | Badge + avoid | `amber-100`, `amber-900` |
| **Neutral / probar** | Oportunidad | white + border gray |
| **Escala canal** | Badge Olga/Luzu | accent-soft |
| **Nicho canal** | Blender, Neura | emerald-50 |

### 1.3 Espaciado y layout

```
┌─ Sidebar 248px ─┬─ Main max-w-2xl (672px) centrado ─────────────┐
│ Eco             │ [BrandBar]                                       │
│ Nav preguntas   │ [StoryRail: placa → mercado → rival?]            │
│ Evidencia ↓     │ [H1 pregunta]                                    │
│ Cambiar marca   │ [contenido — 1 columna mobile, 2 cols en cards]  │
└─────────────────┴──────────────────────────────────────────────────┘
```

- **Main content:** `max-w-2xl` — no más ancho (evita dashboard feel).
- **Cards:** `rounded-xl` o `rounded-2xl`, padding 16–20px.
- **Secciones:** `space-y-8` a `space-y-10` entre bloques-pregunta.
- **Mobile:** stack vertical; botón copiar full width.

### 1.4 Iconografía

- Mínima. Flechas `→` `↗` para links externos.
- Sin iconos de "analytics". WhatsApp implícito por color verde.
- `▸` para colapsables (rival, evidencia).

---

## 2. Vocabulario UI — banco de copy

### 2.1 Nav y rail (siempre preguntas)

| Ruta | Label nav | Story rail |
|------|-----------|------------|
| `/agencia` | ¿Rindió la placa? | ¿Rindió la placa? |
| `/agencia/donde` | ¿Dónde pautar? | ¿Dónde pautar? |
| `/agencia/pulso` | ¿Quién ganó miradas? | ¿Quién ganó? |

**Ocultar** pulso en nav si no hay rival configurado.

### 2.2 Microcopy por contexto

| Contexto | Copy |
|----------|------|
| Strip Seenka | "Seenka confirma que salió. Acá ves cuánta gente miraba en ese segundo — listo para reenviar al cliente." |
| Header WhatsApp card | "Para reenviar al cliente" |
| Botón copiar | "Copiar para WhatsApp" |
| Badge flojo | "Salió flojo" |
| Sin placas | "Todavía no detectamos placas de {marca} esta semana." |
| Sin rival | "sin rival · solo tu cliente" |
| Puente placa→mercado | "Placa confirmada → mirá dónde conviene la próxima." |
| Footer corpus | "Esta semana en 8 canales · {fecha}" |
| Sin chat | "En {canal} no capturamos chat esta semana — la demanda acá es solo por placas." |
| Valor USD (pulso) | Solo en detalle secundario, nunca hero. Label: "Referencia de exposición" |

### 2.3 Prohibido en UI

`Guard`, `Pulso`, `Donde`, `dashboard`, `insights`, `corpus`, `export`, `fit score`, `planner`, `inteligencia`.

---

## 3. Componentes — spec por pieza

### 3.1 `AgenciaBrandBar`

**Job:** anclar de quién hablamos.

```
┌─────────────────────────────────────────────────────────┐
│ MIRANDO AHORA                          Cambiar marca →  │
│ Geniol · sin rival · solo tu cliente                    │
│ [Wanderlust] [IOL]  ← pills si portfolio multi-marca    │
└─────────────────────────────────────────────────────────┘
```

| Regla | Detalle |
|-------|---------|
| Siempre visible | En las 3 pantallas producto |
| Rival | "Marca vs Rival" o "sin rival · solo tu cliente" |
| Multi-marca | Pills debajo del borde |
| No editable inline | Link a `/agencia/elegir` |

---

### 3.2 `AgenciaStoryRail`

**Job:** hilo narrativo sin numerar pasos.

```
[ ¿Rindió la placa? ] → [ ¿Dónde pautar? ] → [ ¿Quién ganó? ]
      ● activo              ○                    ○ (si rival)
```

| Regla | Detalle |
|-------|---------|
| Pill activa | `bg-accent-soft border-accent/40 font-semibold` |
| Sin rival | Tercer pill no renderiza |
| No "Paso 1/2/3" | Las preguntas son la navegación |

---

### 3.3 `AgenciaAlertCard` — el producto

**Job:** J1 + J2 — entregable WhatsApp.

```
┌─ #075e54 ─ Para reenviar al cliente · Cliente ─── 26 jun ─┐
│  229 mil mirando                                            │
│  IOL Inversiones · Luzu · Nadie Dice Nada                   │
│  "Hoy invertí en IOL porque..."                             │
│  [Salió flojo] [Tier 2]                                     │
│  [████████░░] 34% del pico del programa                     │
│  [Copiar para WhatsApp]  [Ver en YouTube ↗]                 │
└─────────────────────────────────────────────────────────────┘
```

| Elemento | Prioridad | Regla |
|----------|-----------|-------|
| Número concurrentes | 1 | Siempre primero, 32px |
| Marca · canal | 2 | Sin slug técnico |
| Cita | 3 | Italic, max 3 líneas |
| Badge flojo | 4 | Si < 40% pico programa |
| Gauge pico | 5 | Barra simple, no gráfico |
| Copiar | CTA primario | Verde WhatsApp style |
| YouTube | CTA secundario | Siempre visible |

**Formato WhatsApp (copiar):**

```
{marca} · {canal} · {fecha}
{compact(concurrentes)} mirando
"{cita}"
{link YouTube t=}
```

---

### 3.4 `AgenciaQuestionBlock`

**Job:** contenedor = pregunta de la agencia.

```
¿Cuánta gente miraba cuando salió?
──────────────────────────────────
[contenido]
```

| Regla | Detalle |
|-------|---------|
| H2 = pregunta literal | No "Alertas" ni "Sección 2" |
| Sin numeración | El rail ya orienta |
| Un bloque = una pregunta | No mezclar placa + mercado |

---

### 3.5 `AgenciaCorpusChannels` — 8 canales

**Job:** "¿Dónde está la gente mirando?" sin abrumar.

```
¿Dónde está la gente mirando?
8 canales que medimos esta semana
Olga y Luzu tienen casi todas las placas — Blender y Neura
a veces convienen más por el tipo de público.

┌ Olga ─ Escala ─────┐  ┌ Luzu ─ Escala ─────┐
│ 44 marcas · 17 em  │  │ 42 marcas · 20 em  │
│ ~26k avg           │  │ ~35k avg           │
└────────────────────┘  └────────────────────┘
Resaltados: canales donde ya apareció Geniol.
```

| Regla | Detalle |
|-------|---------|
| Grid 2 cols desktop | 1 col mobile |
| Highlight | Borde accent si canal de la marca activa |
| Badge positioning | Escala / Nicho / Emergente — 1 línea note |
| No heatmap | Cards legibles en 5 seg |

---

### 3.6 `AgenciaRubroPautarView` — mercado del rubro

**Job:** J4 — qué hace el mercado.

**Bloques (orden fijo):**

1. **¿Quién está pautando en {rubro}?** — lista ranked, max 6
   - Marca · N placas · canales · pico concurrentes a la derecha
   - Badge cliente/competidor en filas relevantes

2. **¿Qué copy le pegó a más gente?** — max 3 citas
   - Primera card con borde accent (top)
   - Footer: marca · canal · concurrentes · "salió flojo" si aplica

3. **¿A qué hora hay más gente mirando?** — pills horario + días
   - Línea narrativa arriba: "Los jueves a la noche…"
   - Lista programas con avg peak

**Sin rival copy:**

> "En {rubro} no hay un rival parejo esta semana — mirá todo el rubro."

---

### 3.7 `AgenciaProgramasTop`

**Job:** "¿En qué programas conviene entrar?"

| Fila | Contenido |
|------|-----------|
| Nombre programa | Bold |
| Canal | Gray |
| Pico / IUP | Número a la derecha |
| Max | 5 programas |

---

### 3.8 `AgenciaDondeCliente` — action cards

**Job:** J3 + decisión operativa para la marca activa.

```
¿Qué hacemos con Geniol?
┌ REPETIR · YA RINDIÓ ────┐  ┌ NO REPETIR · SALIÓ FLOJO ─┐
│ Olga · Sería Increíble  │  │ Olga · YOL · 23:00         │
│ 49k mirando · 78% pico  │  │ Solo 7k · 12% pico         │
│ Ver en YouTube ↗        │  │ Ver en YouTube ↗           │
└─────────────────────────┘  └────────────────────────────┘
┌ PROBAR ACÁ ─────────────┐  ┌ DÓNDE PAUTA {rival} ───────┐
│ ...                     │  │ (solo si hay rival)         │
└─────────────────────────┘  └────────────────────────────┘
```

| Label | Tono visual | Cuándo |
|-------|-------------|--------|
| Repetir · ya rindió | green | peakPct ≥ 60 o top slot |
| No repetir · salió flojo | amber | peakPct < 40 |
| Probar acá | neutral | oportunidad rubro |
| Dónde pauta {rival} | neutral | slot competidor |

Max 2 + 2 + 1 + 1 cards. No grid infinito.

---

### 3.9 `AgenciaDemandaView` — tab demanda

**Job:** señales de chat / demanda comercial.

| Estado | UI |
|--------|-----|
| Con data | Top términos / señales con canal fuente |
| Sin chat en canal | Empty honesto: "En Luzu no capturamos chat…" |
| Rubro sin señales | "Esta semana no hubo picos de demanda en chat para {rubro}." |

**No inventar demanda.** Mejor vacío que falso positivo.

---

### 3.10 `AgenciaPairShowcase` — pulso

**Job:** J5 — cliente vs rival.

```
¿Quién ganó más miradas?
Geniol vs Green Life   ← solo si rival real

┌── CLIENTE ──────────┐    vs    ┌── COMPETIDOR ────────┐
│ 6 placas              │          │ 2 placas               │
│ Mejor: Olga · 26 jun  │          │ ...                    │
│ 45k mirando           │          │                        │
└───────────────────────┘          └────────────────────────┘

Quién se llevó más miradas
[████████░░░░] Geniol 67% · Green Life 33%
```

| Regla | Detalle |
|-------|---------|
| 2 columnas simétricas | Cliente accent, rival amber |
| Barra share | Una sola, top 2 marcas |
| USD | Secundario, pequeño, "referencia" |
| Sin rival | Pantalla invita a elegir, no error |

---

## 4. Pantallas — spec completa

### 4.1 `/agencia/elegir` — entrada

**Pregunta H1:** ¿Qué marca miramos esta semana?

**Layout:**

1. Select cliente (marcas con placas, orden por menciones)
2. Checkbox "Quiero comparar con un rival" — **opcional explícito**
3. CTA "Ver la semana →"
4. Sección "O arrancá con un ejemplo armado" — 4 cards
5. Link configuración completa (portfolio)

**No mostrar:** sidebar nav producto (minimal chrome).

**Success:** redirect `/agencia` con setup guardado.

---

### 4.2 `/agencia` — ¿Rindió la placa?

**Orden vertical (scroll único):**

| # | Bloque | Componente |
|---|--------|------------|
| 0 | BrandBar + StoryRail | fijos |
| 1 | H1 + when | AgenciaPageHeader |
| 2 | Strip Seenka | párrafo gray-50 |
| 3 | Status semana | AgenciaGuardStatus |
| 4 | ¿Cuánta gente miraba? | AgenciaAlertCard × N (cliente) |
| 5 | Rival (colapsado) | `<details>` + cards competidor |
| 6 | ¿Dónde no conviene volver? | valle warnings, max 3 |
| 7 | Puente | footer CTA → Dónde |

**Empty state:** "Todavía no detectamos placas de {marca} esta semana." + link Dónde igual.

**Número hero de pantalla:** concurrentes de la mejor placa del cliente.

---

### 4.3 `/agencia/donde` — ¿Dónde pautar?

**Tabs:**

| Tab | Label |
|-----|-------|
| pautar | ¿Dónde pautar? |
| demanda | ¿Dónde está la demanda? |

**Tab pautar — orden:**

1. ¿Dónde está la gente mirando? → `AgenciaCorpusChannels`
2. ¿Quién está pautando en {rubro}? → RubroPautarView
3. ¿Qué copy le pegó? → (dentro RubroPautarView)
4. ¿A qué hora hay más gente? → (dentro RubroPautarView)
5. ¿En qué programas conviene entrar? → ProgramasTop
6. ¿Qué hacemos con {marca}? → DondeCliente

**Tab demanda:** DemandaView solo.

**Footer:** fecha corpus + links ← placa / → pulso si rival.

**Rubro:** auto del par activo (no picker si una sola marca). Multi-marca portfolio: picker pills rubro.

---

### 4.4 `/agencia/pulso` — ¿Quién ganó?

**Con rival:**

1. H1 + when
2. PairShowcase (2 cards + barra)
3. Footer links

**Sin rival:**

1. H1
2. Card explicativa: "Podés seguir sin comparar share" + link elegir rival
3. Footer → Dónde

---

### 4.5 Sidebar — chrome mínimo

```
Eco
{ nombre agencia }

¿Rindió la placa?
¿Dónde pautar?
¿Quién ganó miradas?     ← solo si rival

▸ Evidencia por marca    ← colapsado default
  [cliente]
  [competidor]

Cambiar marca →
Configuración →          ← solo multi-marca
```

**Sacar:** links a `/marcas` global, "Demo hub" prominente, nombres internos.

---

## 5. Storytelling — hilo de la demo (5 min)

```
MIN 0  /elegir → "¿Qué marca miramos?" → Geniol o Wanderlust
MIN 1  BrandBar + Rail → "Una marca, tres preguntas"
MIN 2  ¿Rindió? → número hero → COPIAR WhatsApp → "Esto le mandás al cliente"
MIN 3  Rail → Dónde → 8 canales → "Acá está la gente" → action card repetir/evitar
MIN 4  Tab demanda (si aplica) o pulso → "Si hay rival, share en una barra"
CIERRE "Seenka confirma que salió. Nosotros cuántos miraban y dónde conviene la próxima."
```

**Ancla numérica por pantalla:**

| Pantalla | Número que vende |
|----------|------------------|
| Placa | Concurrentes en el minuto (229 mil) |
| Dónde | Pico del rubro / top programa |
| Pulso | % share o placas 9 vs 2 |

---

## 6. Estados especiales

### 6.1 Loading

- Texto: "Cargando…" — 13px gray-400. Sin skeleton complejo.

### 6.2 Sin data

| Caso | Copy + acción |
|------|---------------|
| Sin marca | "Elegí una marca" → `/elegir` |
| Sin placas | Empty + link Dónde |
| Sin rival en pulso | Explicación + link elegir |
| Sin chat | Honesto en tab demanda |

### 6.3 Mobile

- Alert card: botones stack vertical
- Copiar: full width primero
- Sidebar: **pendiente** — hamburger futuro; hoy desktop-first demo

---

## 7. Gap spec ↔ implementación (jun 2026)

| Spec | Estado | Prioridad |
|------|--------|-----------|
| BrandBar + StoryRail | ✅ | — |
| Elegir marca genérica | ✅ | — |
| AlertCard WhatsApp (CTA verde, programa, mobile) | ✅ | — |
| 8 canales en Dónde | ✅ | — |
| Rival opcional | ✅ | — |
| Empty Luzu demanda honesto | ✅ | — |
| Hero número mejor placa | ✅ | — |
| Rubro picker multi-marca | ✅ | — |
| Sidebar mobile (menú) | ✅ básico | P2 polish |
| Push automático | ❌ | Producto Al Aire |
| Historial placas | ❌ | P2 |
| Orgánico rival en alerta | ❌ | P2 |

---

## 8. Checklist pre-demo

- [x] Marca elegida ≠ IOL/MP (probar Geniol solo)
- [x] Copiar WhatsApp — botón verde primario, full width mobile
- [x] Link YouTube abre al segundo + programa en card
- [x] "Salió flojo" + gauge % pico del programa
- [x] Pulso oculto si sin rival
- [x] Empty Luzu demanda dice "sin chat"
- [x] Footer "Esta semana en 8 canales · fecha"

---

## 9. Referencias cruzadas

| Doc | Rol |
|-----|-----|
| [`PRODUCTO-AGENCIA.md`](./PRODUCTO-AGENCIA.md) | Qué construimos (producto) |
| [`RESEARCH-USER-AGENCIA.md`](./RESEARCH-USER-AGENCIA.md) | Por qué (usuario) |
| [`SPEC-AGENCIA-UX-STORYTELLING.md`](./SPEC-AGENCIA-UX-STORYTELLING.md) | v2 histórico — superseded por este doc |
| [`MOM-TEST-DESIGN-PARTNER.md`](./MOM-TEST-DESIGN-PARTNER.md) | Guión de call |

---

*Si el copy necesita tooltip para entenderse, reescribir el copy — no agregar tooltip.*
