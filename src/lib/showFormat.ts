/**
 * Formato de programa (show) vs emisión (VOD diario).
 * Heurística por título — reglas alineadas a la programación oficial de cada canal.
 * Fuentes: sitios oficiales (gelatina.com.ar, urbanaplayfm.com, vorterix.com, prensa 2026).
 */

import type { Program } from "./programs";

export type ShowFormat = {
  id: string;
  name: string;
};

type ShowRule = { id: string; name: string; test: RegExp };

/** Reglas por canal: orden importa (primera coincidencia gana). */
const SHOW_RULES: Record<string, ShowRule[]> = {
  luzu: [
    { id: "ndn", name: "Nadie Dice Nada", test: /#?\s*nadie\s+dice\s+nada|#nadiedicenada/i },
    { id: "aqn", name: "Antes Que Nadie", test: /#?\s*antes\s*que\s*nadie|antes\s+que\s+nadie/i },
    { id: "sfl", name: "Se Fue Larga", test: /#?\s*se\s*fue\s*larga|se\s+fue\s+larga/i },
    { id: "novela", name: "La Novela", test: /#?\s*la\s*novela|la\s+novela/i },
    { id: "patria", name: "Patria y Familia", test: /#?\s*patria\s*y\s*familia|patria\s+y\s+familia|#?\s*plp\b|#?\s*patrifamilia/i },
    { id: "fondo", name: "Los del Fondo", test: /#?\s*los\s*del\s*fondo|los\s+del\s+fondo|#?\s*losdelfondo/i },
    { id: "fmluzu", name: "FM Luzu", test: /#?\s*fmluzu|\bfm\s+luzu\b|#?\s*fmlusu/i },
    { id: "verano", name: "El Show del Verano", test: /#?\s*elshowdelverano|el\s+show\s+del\s+verano/i },
    { id: "flash", name: "Flasheando Secuencia", test: /#?\s*flashandosecuencia|flasheando\s+secuencia/i },
    {
      id: "te-activa",
      name: "Luzu Te Activa",
      test: /#?\s*luzuteactiva|luzu\s+te\s+activa/i,
    },
    {
      id: "no-talentos",
      name: "Los No Talentos",
      test: /#?\s*losnotalentos|los\s+no\s+talentos/i,
    },
    {
      id: "sabado-mejor",
      name: "Un Sábado Mejor",
      test: /#?\s*unsabadomejor|un\s+s[aá]bado\s+mejor/i,
    },
  ],
  olga: [
    {
      id: "profe-zumba",
      name: "Mataron al Profe de Zumba",
      test: /mataron\s+al\s+profe|amanece\s+que\s+no\s+es\s+poco/i,
    },
    {
      id: "seria-increible",
      name: "Sería Increíble",
      test: /#?\s*ser[ií]a\s*incre[ií]ble|ser[ií]a\s+incre[ií]ble/i,
    },
    {
      id: "sone-volaba",
      name: "Soñé que Volaba",
      test: /#?\s*so[nñ][eé]\s*que\s*volaba|so[nñ][eé]\s+que\s+volaba/i,
    },
    {
      id: "tapados",
      name: "Tapados de Laburo",
      test: /#?\s*tapados\s*de\s*laburo|tapados\s+de\s+laburo/i,
    },
    { id: "tdt", name: "TDT", test: /#?\s*tdt\b|\btdt\s+con/i },
    { id: "gol-gana", name: "Gol Gana", test: /#?\s*gol\s*gana|\bgol\s+gana\b/i },
    { id: "gambeta", name: "La Gambeta", test: /#?\s*la\s*gambeta|\bla\s+gambeta\b/i },
    {
      id: "fin-mundo",
      name: "El Fin del Mundo",
      test: /#?\s*el\s*fin\s*del\s*mundo|\bel\s+fin\s+del\s+mundo\b/i,
    },
    {
      id: "nona",
      name: "Se Extraña la Nona",
      test: /#?\s*se\s*extra[nñ]a\s*la\s*nona|se\s+extra[nñ]a\s+la\s+nona/i,
    },
    {
      id: "rebobinar",
      name: "Por Favor Rebobinar",
      test: /#?\s*por\s*favor\s*rebobinar|por\s+favor\s+rebobinar/i,
    },
    {
      id: "primo",
      name: "Mi Primo es Así",
      test: /#?\s*mi\s*primo\s*es\s*as[ií]|mi\s+primo\s+es\s+as[ií]/i,
    },
  ],
  bondi: [
    {
      id: "tremenda-manana",
      name: "Tremenda Mañana",
      test: /#?\s*tremenda\s*ma[nñ]ana|tremenda\s+ma[nñ]ana/i,
    },
    {
      id: "bondi-express",
      name: "Bondi Express",
      test: /#?\s*bondi\s*express|bondi\s+express/i,
    },
    {
      id: "ejercito",
      name: "El Ejército de la Mañana",
      test: /#?\s*elej[eé]rcito\s*de\s*la\s*ma[nñ]ana|el\s+ej[eé]rcito\s+de\s+la\s+ma[nñ]ana/i,
    },
    {
      id: "angel-responde",
      name: "Ángel Responde",
      test: /#?\s*[áa]ngel\s*responde|[áa]ngel\s+responde/i,
    },
    {
      id: "storytime",
      name: "Story Time",
      test: /#?\s*story\s*time|story\s*time/i,
    },
    {
      id: "linterna",
      name: "La Linterna",
      test: /#?\s*lalinterna|la\s+linterna/i,
    },
  ],
  blend: [
    {
      id: "que-dia",
      name: "Qué Día",
      test: /#?\s*qu[eé]\s*d[ií]a|\bqu[eé]\s+d[ií]a\b/i,
    },
    {
      id: "ultimo-aviso",
      name: "Último Aviso",
      test: /#?\s*[úu]ltimo\s*aviso|[úu]ltimo\s+aviso/i,
    },
    {
      id: "hay-algo",
      name: "Hay Algo Ahí",
      test: /#?\s*hay\s*algo\s*ah[ií]|hay\s+algo\s+ah[ií]/i,
    },
    {
      id: "at-night",
      name: "Blender at Night",
      test: /blender\s+(at|al)\s+night/i,
    },
  ],
  gelatina: [
    {
      id: "demasiada-presion",
      name: "Demasiada Presión",
      test: /#?\s*demasiada\s*presi[oó]n|demasiada\s+presi[oó]n/i,
    },
    { id: "tugo", name: "TUGO", test: /#?\s*tugo\b|\btugo\b/i },
    {
      id: "puente",
      name: "El Puente",
      test: /#?\s*el\s*puente|\bel\s+puente\b/i,
    },
    {
      id: "industria",
      name: "Industria Nacional",
      test: /#?\s*industria\s*nacional|industria\s+nacional/i,
    },
    {
      id: "que-olor",
      name: "Qué Olor",
      test: /#?\s*qu[eé]\s*olor|\bqu[eé]\s+olor\b/i,
    },
    {
      id: "circo-freak",
      name: "Circo Freak",
      test: /#?\s*circo\s*freak|circo\s+freak/i,
    },
    {
      id: "mano-a-mano",
      name: "Mano a Mano",
      test: /mano\s+a\s+mano/i,
    },
  ],
  urbana: [
    {
      id: "de-aca",
      name: "De Acá en Más",
      test: /#?\s*de\s*ac[aá]\s*en\s*m[aá]s|de\s+ac[aá]\s+en\s+m[aá]s/i,
    },
    {
      id: "perros",
      name: "Perros de la Calle",
      test: /#?\s*perros\s*de\s*la\s*calle|perros\s+de\s+la\s+calle/i,
    },
    {
      id: "todo-pasa",
      name: "Todo Pasa",
      test: /#?\s*todo\s*pasa|\btodo\s+pasa\b/i,
    },
    {
      id: "vuelta-media",
      name: "Vuelta y Media",
      test: /#?\s*vuelta\s*y\s*media|vuelta\s+y\s+media/i,
    },
    {
      id: "olvidate",
      name: "Olvidate de Todo",
      test: /#?\s*olvidate\s*de\s*todo|olvid[aá]te\s+de\s+todo/i,
    },
    {
      id: "punto-caramelo",
      name: "Punto Caramelo",
      test: /#?\s*punto\s*caramelo|punto\s+caramelo/i,
    },
    {
      id: "urbana-live",
      name: "Urbana Play Live",
      test: /urbana\s+play\s+live/i,
    },
    {
      id: "acusticos",
      name: "Urbana Play Acústicos",
      test: /urbana\s+play\s+ac[uú]sticos/i,
    },
    { id: "resident", name: "Resident", test: /\bresident\b/i },
  ],
  neura: [
    {
      id: "multiverso",
      name: "Multiverso Fantino",
      test: /#?\s*multiverso\s*fantino|multiverso\s+fantino/i,
    },
    {
      id: "mediodia",
      name: "Mediodía Neura",
      test: /#?\s*mediod[ií]a\s*neura|mediod[ií]a\s+neura/i,
    },
    {
      id: "posnormalidad",
      name: "Posnormalidad",
      test: /#?\s*posnormalidad|\bposnormalidad\b/i,
    },
    {
      id: "derribando",
      name: "Derribando Mitos",
      test: /#?\s*derribando|derribando\s*(mitos)?/i,
    },
    {
      id: "hijos-edad",
      name: "Cuando Mis Hijos Tengan Mi Edad",
      test: /cuando\s+mis\s+hijos\s+tengan\s+mi\s+edad/i,
    },
    { id: "argendata", name: "ArgenDATA", test: /#?\s*argendata|\bargendata\b/i },
  ],
  vorterix: [
    {
      id: "no-rusia",
      name: "No Preguntes por Rusia",
      test: /no\s+preguntes?\s+por\s+rusia/i,
    },
    { id: "y-que", name: "Y Qué?", test: /\by\s+qu[eé]\?/i },
    {
      id: "no-se-pudo",
      name: "No Se Pudo",
      test: /#?\s*no\s*se\s*pudo|\bno\s+se\s+pudo\b/i,
    },
    {
      id: "se-nota",
      name: "Se Nota Mucho",
      test: /#?\s*se\s*nota\s*mucho|se\s+nota\s+mucho/i,
    },
    {
      id: "desde-respeto",
      name: "Desde el Respeto",
      test: /#?\s*desde\s*el\s*respeto|desde\s+el\s+respeto/i,
    },
    {
      id: "esto-no",
      name: "Esto No Sucedió",
      test: /#?\s*esto\s*no\s*sucedi[oó]|esto\s+no\s+sucedi[oó]/i,
    },
    {
      id: "paren-mano",
      name: "Paren la Mano",
      test: /#?\s*paren\s*la\s*mano|paren\s+la\s+mano/i,
    },
  ],
  border: [
    { id: "que-miedo", name: "Que Miedo", test: /que\s+miedo/i },
    { id: "vivan-todo", name: "Vivan Todo", test: /vivan\s+todo/i },
    {
      id: "mesa-periodistas",
      name: "Mesa de Periodistas",
      test: /mesa\s+de\s+periodistas/i,
    },
    {
      id: "border-sessions",
      name: "BorderSessions",
      test: /border\s*sessions/i,
    },
  ],
  cronista: [
    { id: "pulso-financiero", name: "Pulso Financiero", test: /pulso\s+financiero/i },
    { id: "cuentas-claras", name: "Cuentas Claras", test: /cuentas\s+claras/i },
    { id: "sello-argento", name: "Sello Argento", test: /sello\s+argento/i },
    { id: "nada-personal", name: "Nada Personal", test: /nada\s+personal/i },
    { id: "lo-que-de", name: "Lo Que Dé", test: /lo\s+que\s+d[eé]/i },
  ],
  ahoraplay: [
    {
      id: "serrucho",
      name: "Serrucho Económico",
      test: /serrucho\s+econ[oó]mico|#serrucho/i,
    },
    {
      id: "maxi-mediodia",
      name: "Maxi Mediodía",
      test: /maxi\s*mediod[ií]a|#maximediod[ií]a/i,
    },
    {
      id: "cierre-mercados",
      name: "Cierre de Mercados",
      test: /cierre\s+de\s+mercados/i,
    },
    {
      id: "ndts",
      name: "Nuevo Dinero Talk Show",
      test: /nuevo\s+dinero\s+talk|#ndts/i,
    },
    {
      id: "ahora-en-jaque",
      name: "Ahora en Jaque",
      test: /ahora\s+en\s+jaque/i,
    },
  ],
  aura: [
    { id: "hoy-como-siempre", name: "Hoy como siempre", test: /hoy\s+como\s+siempre/i },
    { id: "de-aca", name: "De Acá", test: /\bde\s+ac[aá]\b/i },
  ],
  cenital: [
    {
      id: "esdlos",
      name: "El Señor de los Pasillos",
      test: /el\s+se[nñ]or\s+de\s+los\s+pasillos|esdlos/i,
    },
    { id: "540", name: "540°", test: /540\s*[°º]?|540°/i },
    {
      id: "efdlm",
      name: "El Fin de la Metáfora",
      test: /el\s+fin\s+de\s+la\s+met[aá]fora|efdlm/i,
    },
    { id: "mundo-propio", name: "Mundo Propio", test: /mundo\s+propio/i },
  ],
};

const OTROS: ShowFormat = { id: "otros", name: "Otros" };

export function detectShowFormat(channelId: string, title: string): ShowFormat {
  const rules = SHOW_RULES[channelId.toLowerCase()] || [];
  const t = title || "";
  for (const rule of rules) {
    if (rule.test.test(t)) return { id: rule.id, name: rule.name };
  }
  return OTROS;
}

export type ShowRollup = {
  show: ShowFormat;
  emissions: Program[];
  emissionCount: number;
  mentionCount: number;
  brandSlugs: Set<string>;
  peakAttention: number;
};

export function rollupsByShow(programs: Program[]): ShowRollup[] {
  const map = new Map<string, ShowRollup>();

  for (const p of programs) {
    const show = detectShowFormat(p.channel, p.title);
    let rollup = map.get(show.id);
    if (!rollup) {
      rollup = {
        show,
        emissions: [],
        emissionCount: 0,
        mentionCount: 0,
        brandSlugs: new Set(),
        peakAttention: 0,
      };
      map.set(show.id, rollup);
    }
    rollup.emissions.push(p);
    rollup.emissionCount += 1;
    rollup.mentionCount += p.pnt_count;
    p.brands.forEach((b) => rollup!.brandSlugs.add(b));
    const peak =
      p.peak ||
      p.pnt.reduce((best, row) => Math.max(best, row.conc_at || 0), 0);
    rollup.peakAttention = Math.max(rollup.peakAttention, peak || 0);
  }

  return [...map.values()].sort(
    (a, b) =>
      b.mentionCount - a.mentionCount ||
      b.emissionCount - a.emissionCount ||
      b.peakAttention - a.peakAttention
  );
}
