# SPEC — `/agencia` UX/UI + Storytelling

| Campo | Valor |
|-------|-------|
| **Versión** | **v2** — post autocrítica |
| **Rol** | Spec de implementación — barra de excelencia demo |
| **Persona** | Lucía — planner/AE, agencia boutique, reunión del viernes |
| **JTBD** | *"Llegar al viernes con prueba que el cliente no discuta — sin 5h de deck."* |
| **Demo default** | `/agencia/demo/iol-mercado-pago` |
| **Producto real** | **El WhatsApp copiable** — la web es archivo de prueba |

---

## 0. Autocrítica — qué estaba mal en v1

### 0.1 Fallas de producto (conceptuales)

| Problema | Por qué importa | Fix v2 |
|----------|-----------------|--------|
| Tratamos la web como producto | Lucía no abre dashboards — **reenvía WhatsApp** | WhatsApp card = hero; web = backup con link |
| Dónde con 7 pasos | Demo call se pierde al paso 4 | **5 pasos max** — fusionar chat en timing |
| Rivales duplicaba Dónde | Misma data, distinta pantalla = confusión | Rivales = **solo head-to-head** (2 cards + 1 barra) |
| Sin momento Seenka | En call siempre preguntan | Strip fijo: *"Seenka confirma que salió…"* |
| "¿Dónde mejorar?" mezclado con planner | Suena a Custoo / Power BI | Renombrar bloque: **"Qué hacer con tu cliente"** |
| Competidor en Alertas mismo peso que cliente | Lucía abre por **su** marca | Cliente primero · rival colapsado |

### 0.2 Fallas del spec v1 (documentación)

- Decía "máx 6 pasos" y Dónde tenía 7 — **inconsistente**
- Listaba `AgenciaProductHero` y también decía sacarlo — **contradictorio**
- No definía formato exacto del push WhatsApp — **implementación a ciegas**
- No definía **el número hero** por pantalla — demo sin ancla
- Ignoraba mobile, loading, data thin — **no demo-ready**
- `/pulso` vs "Rivales" — **deuda de naming sin decisión**

### 0.3 Fallas del build actual (gap spec ↔ código)

| Archivo | Gap |
|---------|-----|
| `page.tsx` (Alertas) | Sigue `AgenciaProductHero` + Wanderlust featured — spec dice sacar |
| `AgenciaShell` | Nav tiene Demo + Configurar · footer link a `/marcas` global — rompe ilusión partner |
| `AgenciaGuardStatus` | Dice "competidor" y usa `pntThisWeek` internamente — copy no auditado |
| `guardPushPreview` | Solo `headline · body` — **push débil**, no vende |
| `donde/page.tsx` | Pasos 2–5 dentro RubroIntel + 6–7 fuera — **numeración rota** en call |
| `main` shell | `max-w-[1000px]` vs contenido `max-w-2xl` — layout flotante |

### 0.4 Barra de excelencia (criterio de done)

Una demo excelente cumple **las 5 C**:

1. **Clara** — Lucía entiende en 10s qué es cada pantalla (mom test)
2. **Copiable** — un click → WhatsApp listo para el cliente
3. **Creíble** — link YouTube al segundo + "Seenka no tiene esto"
4. **Concisa** — una pantalla = un job = un scroll principal
5. **Honesta** — límites visibles (1 semana, post-programa, sin chat Luzu)

---

## 1. North star

### Una frase

> **Te avisamos cuando sale la placa, te decimos cuánta gente miraba, y te damos el link — antes del viernes.**

### Superficie real vs secundaria

```
PRIMARY (vende)          SECONDARY (respalda)
─────────────────        ─────────────────────
WhatsApp copy              Link YouTube
Alerta post-placa          Ficha marca
"229k mirando"             Historial activaciones

NO es primary:             ranking 135 marcas, 37 preguntas,
                           matriz 8 canales, PDF, planner
```

### Tres pantallas = tres tiempos verbales

| Pantalla | Tiempo | Pregunta | Verbo en UI |
|----------|--------|----------|-------------|
| **Alertas** | Pasado inmediato | ¿Qué pasó? | *Salió · miraban · copiá* |
| **Dónde** | Presente continuo | ¿Qué hace el mercado? | *Mirá · aprendé · no repitas* |
| **Rivales** | Pasado comparativo | ¿Quién ganó? | *vs · lado a lado* |

---

## 2. IA — rutas y naming

### Decisión: URL `/pulso` se queda · label **Rivales**

Renombrar ruta rompe links — documentar en código `// Rivales (pulso)`. Opcional redirect `/agencia/rivales` → `/pulso`.

### Mapa final

```
IN (demo)                          OUT (sin nav, redirect ok)
──────────────────────────────     ────────────────────────────
/agencia              Alertas      /agencia/briefing → oculto
/agencia/donde        Dónde        /agencia/pregunta → oculto
/agencia/pulso        Rivales      /agencia/novedades → oculto
/agencia/marcas/[s]   Evidencia    /agencia/competencia → /pulso
/agencia/demo         Hub          /agencia/ejemplo → /demo
/agencia/demo/[id]    Load showcase
/agencia/configurar   Solo partner real (no preview)
```

### Nav v2 — spec estricto

```
┌─ Sidebar 240px ─────────────────┐
│ Eco                             │
│ {Agencia}                       │
│ [chip: Demo · marcas reales]    │
│                                 │
│ PRODUCTO                        │
│  ◉ Alertas                      │
│  ◈ Dónde                        │
│  ⚖ Rivales                      │
│                                 │
│ ▾ Portfolio (colapsado default) │  ← demo: collapsed
│   IOL · MP…                     │
│                                 │
│ footer: Esta semana · {fecha}   │  ← NO link /marcas global
└─────────────────────────────────┘
```

**Sacar del nav en preview:** Demo (mover a footer), Configurar/Marcas (confunde con portfolio).

---

## 3. Sistema UI — componentes nuevos unificados

### 3.1 `AgenciaPageHeader` (reemplaza ProductHero + quotes sueltos)

```tsx
<AgenciaPageHeader
  quote="¿Cuánta gente miraba cuando dijeron la marca?"
  subtitle="Copiá el mensaje y reenviáselo al cliente. Si discute, mandale el link."
  seenkaLine                              // opcional, recomendado Alertas + Rivales
/>
```

**`seenkaLine` default (Alertas):**  
*"Seenka confirma que salió la placa. Nosotros te decimos cuánta gente miraba en ese segundo."*

### 3.2 `AgenciaStoryStep`

- Máx **5 pasos** por pantalla (regla dura)
- Número + título **verbo** + subtítulo **beneficio para Lucía**
- Entre pasos: `space-y-12` — respiración visual

### 3.3 `AgenciaWhatsAppCard` (evolución de AlertCard)

**Jerarquía visual (F-pattern):**

1. **Número hero** — `229k` mirando (32px bold tabular)
2. Marca + canal + fecha
3. Cita 2 líneas max
4. Gauge (solo si hay program_peak)
5. **CTA primary:** Copiar para WhatsApp (verde, full width mobile)
6. CTA secondary: Ver en YouTube ↗

**Orden de cards:** clientes primero · competidores en `<details>` colapsado *"También monitoreamos…"*

### 3.4 Push WhatsApp — spec de copy (P0)

Formato obligatorio — rioplatense, reenviable al cliente:

```
{Marca} · {Canal} · {fecha corta}
{compact(conc_at)} mirando cuando salió la placa.
"{quote max 120 chars}"
→ {vodLink}
```

Ejemplo IOL:
```
IOL · Luzu · Nadie Dice Nada · 26 jun
229 mil mirando cuando salió la placa.
"Broker online IOL, invertí desde tu celular con una cuenta comitente gratis."
→ youtube.com/...
```

Implementar en `guardPushPreview()` — no concatenar headline/body genéricos.

### 3.5 `AgenciaPeriodFooter`

Todas las pantallas cierran igual:

```
Esta semana en 8 canales · 22–27 jun 2026
Sirve para la próxima placa — no para planificar el año.
```

Data: `meta.exported_at` + ventana live capture.

---

## 4. Spec por pantalla (v2)

---

### 4.1 Alertas — `/agencia`

**Número hero de la demo:** `229.421` (IOL NDN) — debe ser lo primero que se ve en la card IOL.

**Story (60s):**  
*"Sale la placa → te llega esto → copiás → fin del deck del viernes."*

```
┌──────────────────────────────────────────┐
│ [PageHeader + seenkaLine]                │
├──────────────────────────────────────────┤
│ ● Monitoreo · 2 marcas · 11 placas       │
├──────────────────────────────────────────┤
│ PASO 1 · Tu última placa                 │
│ ┌ WhatsAppCard IOL — 229k ────────────┐  │
│ │ [Copiar para WhatsApp — full width] │  │
│ └─────────────────────────────────────┘  │
│ ▶ También monitoreamos (MP, …)           │
├──────────────────────────────────────────┤
│ PASO 2 · No repitas (si valle)           │
│ max 3 · ámbar                            │
├──────────────────────────────────────────┤
│ [Siguiente: Dónde →]                     │
└──────────────────────────────────────────┘
```

**Sacar definitivamente:** Wanderlust featured · ProductHero duplicado · grid 2-col en mobile · alertas competidor mismo nivel.

**Empty state:**  
*"Esta semana todavía no salió tu cliente — te avisamos por acá cuando pase."*

---

### 4.2 Dónde — `/agencia/donde`

**Número hero:** líder del rubro (ej. *IOL · 9 placas · 229k mejor momento*)

**Reframe nombre paso 5:** ~~"Tu cliente · qué hacer"~~ → **"Qué hacer con {Marca}"**

**5 pasos (no 7):**

| # | Título | Contenido | Fusiona v1 |
|---|--------|-----------|------------|
| 1 | Elegí tu rubro | Pills | — |
| 2 | Quién está pautando | Ranking max 6 | — |
| 3 | Copies que pegaron | Top 3, #1 hero | — |
| 4 | Cuándo y dónde entrar | Horarios + top 3 programas + chat demanda si hay | timing + programas + chat |
| 5 | Qué hacer con {Marca} | 4 action cards max | repetir/evitar/oportunidad/rival |

**Regla demo:** rubro pre-seleccionado al cargar — **cero clicks** para ver data en call.

**CTA footer:** Rivales → (solo si hay rival configurado)

---

### 4.3 Rivales — `/agencia/pulso`

**Número hero:** ratio visual — *IOL 82% · MP 18% miradas del rubro* (o placas 9 vs 2)

**Máximo contenido:** 1 par + 1 compare bar + 2 CTAs. Nada más.

```
[PageHeader — sin seenkaLine duplicado si ya vio Alertas]

IOL  vs  Mercado Pago
[card]     [card]
9 placas   2 placas
cita+link  cita+link

[AgenciaRivalCompare — max 4 marcas]

← Dónde · Alertas
```

**Sin rival:** una card + link Dónde. **No** RubroIntel completo.

---

### 4.4 Evidencia — `/agencia/marcas/[slug]`

**Job:** objeto de disputa — cuando el cliente dice *"mostrame"*.

**Layout:** una columna · última placa above fold · YouTube CTA sticky en mobile.

**Ocultar v1:** valor USD grande · tabs · PDF export primario.

---

### 4.5 Demo hub — `/agencia/demo`

**Job:** elegir historia — **primera pantalla en call de discovery**, no en demo cerrada.

Card IOL/MP:
- Badge **Recomendado**
- Hook numérico: `9 vs 2 placas · pico 229k`
- Una línea: *"La historia fintech más clara del corpus"*

Matriz 8 canales: `<details>` colapsado — no above the fold.

---

## 5. Flujo demo excelencia (8 min, no 10)

| Min | Pantalla | Una acción | Una frase |
|-----|----------|------------|-----------|
| 0–1 | demo/iol-mp | Entrar | *"Fintech real, esta semana"* |
| 1–3 | Alertas | **Copiar WhatsApp** | *"Esto reemplaza el deck"* |
| 3–5 | Dónde | Mostrar copy #1 + action card repetir | *"Antes de la próxima"* |
| 5–7 | Rivales | Barras IOL vs MP | *"9 vs 2, con link"* |
| 7–8 | Cierre | Pregunta | *"¿Quién recibe el WhatsApp el viernes?"* |

**No mostrar en demo cerrada:** portfolio sidebar expandido, marcas/[slug], briefing.

---

## 6. Design system — ajustes v2

| Regla | Valor |
|-------|-------|
| Main content | `max-w-2xl mx-auto` — shell no ensancha contenido |
| Número hero | `text-[32px] font-bold tabular-nums tracking-tight` |
| WhatsApp card | Borde `#dcf8c6` · header `#075e54` — ya existe, mantener |
| Salió flojo | Solo ámbar + palabras — nunca "valle" ni "% pico" solo sin contexto |
| Mobile | Cards full width · CTA copiar sticky bottom opcional P1 |

---

## 7. Implementación — P0 revisado (orden estricto)

1. **`guardPushPreview`** — copy spec §3.4
2. **`AgenciaPageHeader`** — unificar quotes + seenkaLine
3. **Alertas** — sacar Wanderlust/ProductHero · clientes first · 5C checklist
4. **`AgenciaShell`** — nav 3 ítems · portfolio collapsed · sacar `/marcas` footer
5. **Dónde** — renumber 5 pasos · fusionar paso 4
6. **Rivales** — strip to minimum
7. **Redirects** — competencia, ejemplo
8. **Walkthrough** — IOL/MP en 8 min sin dead clicks

### P1
- Marca/[slug] spec 4.4
- Demo hub badge Recomendado
- Skeleton loading
- `/agencia/rivales` alias

### P2
- Push automático
- Briefing power layer
- Partner token

---

## 8. Mom test — cómo saber si fallamos

| Pregunta | Respuesta buena | Señal de falla |
|----------|-----------------|----------------|
| ¿Qué es esto? | *"Me avisa de la pauta en stream"* | *"Un dashboard de marcas"* |
| ¿Qué hago acá? | *"Copio y mando al cliente"* | *"Exploro"* |
| ¿Por qué no Seenka? | *"Cuántos miraban al segundo"* | Silencio / confusión |
| ¿Pago por esto? | *"Sí, por campaña"* | *"Capaz el mes que viene"* |

---

## 9. Data thin — no romper la demo

| Showcase | Riesgo | Mitigación UI |
|----------|--------|---------------|
| geniol solo | Sin rival | Banner Dónde + skip Rivales en nav hint |
| bondi/gelatina | Poco corpus | No usar en hub principal |
| Luzu | Sin chat | No mostrar paso chat en Dónde para canales Luzu-only |

---

## 10. Checklist excelencia pre-call

- [ ] Copiar WhatsApp IOL incluye número + cita + link
- [ ] Primera card visible = cliente (no competidor)
- [ ] 229k visible without scroll (desktop)
- [ ] Dónde abre con fintech ya seleccionado
- [ ] Rivales = 1 pantalla, no scroll infinito
- [ ] Cero strings: PNT, corpus, share, valle, Guard, tier (UI visible)
- [ ] Footer fecha corpus en todas las pantallas
- [ ] Sin link a explorador global en preview
- [ ] Seenka line visible en Alertas
- [ ] Ensayo 8 min cronometrado

---

## 11. Relacionados

- [STORYTELLING-DESIGN-PARTNER.md](./STORYTELLING-DESIGN-PARTNER.md)
- [DEMO-DESIGN-PARTNER.md](./DEMO-DESIGN-PARTNER.md)
- [PREGUNTAS-AGENCIA-Y-PRODUCTO.md](../../docs/product/PREGUNTAS-AGENCIA-Y-PRODUCTO.md)

---

## 12. v3 — Preguntas de la agencia, no nombres de producto

### El error de v1/v2

Usábamos **nombres nuestros** (Alertas, Dónde, Rivales, Paso 1…) y subtítulos que **explicaban para qué sirve**. Eso obliga a vos a vender en la call.

### Regla v3

> **Si Lucía tiene que preguntar "¿y esto qué es?", fallamos.**

Cada pantalla, tab y sección = **la pregunta que ya se hace en la reunión del martes o del viernes**.

### Nav = sus preguntas

| Antes | Ahora |
|-------|-------|
| Alertas | **¿Rindió la placa?** |
| Dónde | **¿Dónde pautar?** |
| Rivales | **¿Quién ganó miradas?** (solo si hay rival) |

### Dónde = dos tabs = dos jobs distintos

Lucía los dice separados:

| Tab | Pregunta exacta |
|-----|-----------------|
| **¿Dónde pautar?** | Quién pauta · copies · horarios · programas · qué hacemos con {marca} |
| **¿Dónde está la demanda?** | Qué pidió la gente en el chat |

No mezclar demanda dentro de "panorama del rubro" — **es otro click con otro nombre**.

### Secciones = preguntas, no pasos

Sacar numeración "Paso 1, 2, 3". Usar `AgenciaQuestionBlock`:

- ¿Quién está pautando en fintech?
- ¿Qué copy le pegó a más gente?
- ¿A qué hora hay más gente mirando?
- ¿En qué programas conviene entrar?
- ¿Qué hacemos con IOL?
- ¿Dónde está pidiendo la gente en fintech?

### Mom test v3 (deben decir solos)

| Deben decir | No deben decir |
|-------------|----------------|
| *"Esto es para ver si rindió la pauta"* | *"¿Qué es ECO?"* |
| *"Acá veo dónde pautar la semana que viene"* | *"¿Qué significa rubro intel?"* |
| *"Acá está lo que la gente pide en el chat"* | *"¿Y esta sección?"* |

---

_Spec v3 · Lenguaje de agencia · Jun 2026_
