# ECO Agencia — qué estamos construyendo

**Versión:** jun 2026 · **Audiencia:** agencia boutique (3–8 personas) · **Estado:** demo vendible, primer cliente pago pendiente

---

## La historia en una frase

Tu cliente salió en stream. **¿Cuánta gente miraba?** Eso es lo que la agencia necesita saber antes de mandar el mail. Después viene el mercado — dónde pautar, qué copian los rivales, qué pide la gente — y, si querés, la pelea de share contra un rival.

No es un dashboard. Es la respuesta a tres preguntas que ya se hacen en WhatsApp.

---

## El recorrido (storytelling)

```
Elegís marca  →  ¿Rindió la placa?  →  ¿Dónde pautar?  →  ¿Quién ganó? (opcional)
     ↑                    │                    │                    │
  /agencia/elegir    copy WhatsApp         8 canales +          solo si hay
  rival opcional     + link al VOD          rubro + acciones      rival cargado
```

### 1. Elegí la marca (`/agencia/elegir`)

**Pregunta implícita:** *¿De quién hablamos esta semana?*

- Cualquier marca del corpus con placas detectadas.
- Rival **opcional** — checkbox explícito. Sin rival: igual funciona placas, mercado y demanda.
- Ejemplos armados (IOL/MP, Geniol, YPF…) son atajos, no el producto default.
- Varios clientes en contrato → `/agencia/configurar` (portfolio + cambio de foco con pills).

**Barra fija arriba:** “Mirando ahora: Geniol · sin rival” o “Wanderlust vs Aerolíneas”. Siempre visible. Link “Cambiar marca”.

### 2. ¿Rindió la placa? (`/agencia`)

**Pregunta de la agencia:** *¿Valió la pauta? ¿Cuánta gente la vio?*

- Seenka confirma aparición; ECO muestra **concurrentes en el minuto** + cita + link al VOD.
- Card copiable para WhatsApp — el entregable del lunes post-campaña.
- Valle de audiencia: slots donde no conviene volver.
- Rival colapsado en `<details>` — secundario, no compite con el cliente.

**Puente al siguiente paso:** footer “Placa confirmada → mirá dónde conviene la próxima.”

### 3. ¿Dónde pautar? (`/agencia/donde`)

**Pregunta de la agencia:** *¿Dónde meto la plata la semana que viene?*

Dos tabs, misma pantalla:

| Tab | Pregunta |
|-----|----------|
| **¿Dónde pautar?** | Quién pauta el rubro, copies, horarios, programas top, **8 canales** resaltando donde ya apareció tu marca, action cards (repetir / evitar / probar / rival). |
| **¿Dónde está la demanda?** | Señales de chat/commercial_demand del rubro. Empty state honesto si el canal no tiene chat (ej. Luzu fintech). |

Todo filtrado por **la marca en foco**, no por un par fijo IOL/MP.

**Puente:** links a pulso (si hay rival) o vuelta a placas.

### 4. ¿Quién ganó miradas? (`/agencia/pulso`) — solo con rival

**Pregunta de la agencia:** *¿Mi cliente le ganó al competidor en atención?*

- Share del rubro, placas, valor USD benchmark.
- Sin rival configurado: mensaje claro + link a elegir rival (opcional). No rompe el flujo.

Nav lateral **oculta** este ítem si no hay rival — no prometemos lo que no está.

---

## Qué NO es (scope congelado)

| Fuera ahora | Por qué |
|-------------|---------|
| Ask / briefing / planner | Viene después del primer cliente pago |
| Push automático WhatsApp | Gap conocido; hoy copy manual |
| Orgánico del rival en alerta | Backlog |
| Historial completo de placas | Backlog |
| Dashboard multi-marca simultáneo | Una marca en foco; portfolio en config |

---

## Principios de UX

1. **Pregunta = H1** — no nombres internos (“Guard”, “Donde”, “Pulso”).
2. **Una marca a la vez** — la barra “Mirando ahora” ancla la historia.
3. **Rival opcional** — nunca obligatorio para ver valor.
4. **Autoexplicativo** — cada bloque responde una pregunta sin tooltip.
5. **Rioplatense** — “placa”, “pautar”, “mirando”, “rubro”, sin anglicismos de producto.
6. **Evidencia colapsada** — fichas por marca en sidebar, no compiten con el flujo principal.

---

## Demo de venta (5 minutos)

1. `/agencia/elegir` → Geniol sin rival (OTC profundo) **o** Wanderlust vs Aerolíneas (wow escala).
2. ¿Rindió? → copiar WhatsApp, mostrar número grande.
3. ¿Dónde pautar? → 8 canales, programas Olga, action cards.
4. Si hay rival → pulso share.

**Frase de cierre:** “Seenka te dice que salió. Nosotros te decimos cuánta gente miraba y dónde conviene la próxima.”

---

## Archivos clave (implementación)

| Pieza | Archivo |
|-------|---------|
| Elegir marca | `app/agencia/elegir/page.tsx` |
| Marca en foco | `lib/use-active-brand.ts`, `lib/save-brand-choice.ts` |
| Hilo visual | `AgenciaStoryRail.tsx`, `AgenciaBrandBar.tsx` |
| Placas | `app/agencia/page.tsx` |
| Mercado | `app/agencia/donde/page.tsx` + `AgenciaCorpusChannels` |
| Rivales | `app/agencia/pulso/page.tsx` |
| Shell | `AgenciaShell.tsx`, `AgenciaSetupGuard.tsx` |

---

## Gaps honestos (post-demo)

- Demanda en canales sin chat sigue floja — decirlo en UI.
- Push automático / “Al Aire” — diferencial vs Seenka, no implementado.
- Calibración valor USD — benchmark, no facturación (ver `MODELO-VALORIZACION.md`).

---

## Criterio de “listo para mostrar”

- [x] Cualquier marca del corpus, rival opcional
- [x] Tres pantallas = tres preguntas + tabs demanda
- [x] 8 canales en flujo principal
- [x] Story rail + barra de marca
- [x] Copy WhatsApp en placa
- [ ] Primer cliente pago que valide el wedge

*Este doc es la fuente de verdad de producto agencia. Si cambia el rumbo, actualizar acá primero.*

---

## Documentación relacionada

| Doc | Contenido |
|-----|-----------|
| [`RESEARCH-USER-AGENCIA.md`](./RESEARCH-USER-AGENCIA.md) | Research usuario — personas, jobs, vocabulario, mental models |
| [`SPEC-AGENCIA-UX-UI.md`](./SPEC-AGENCIA-UX-UI.md) | Spec UX/UI — componentes, pantallas, copy, visual system |
| [`MOM-TEST-DESIGN-PARTNER.md`](./MOM-TEST-DESIGN-PARTNER.md) | Guión de validación en call |
