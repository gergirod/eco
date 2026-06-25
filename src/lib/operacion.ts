/** Runbook interno — fuente para /operacion */

export type CmdBlock = {
  title: string;
  desc?: string;
  cmds: string[];
};

export type Section = {
  id: string;
  title: string;
  intro?: string;
  blocks: CmdBlock[];
  bullets?: string[];
  table?: { cols: string[]; rows: string[][] };
};

export const CHANNELS: { id: string; url: string }[] = [
  { id: "olga", url: "https://www.youtube.com/@olgaenvivo_/live" },
  { id: "luzu", url: "https://www.youtube.com/@luzutv/live" },
  { id: "bondi", url: "https://www.youtube.com/@Bondi_liveok/live" },
  { id: "blend", url: "https://www.youtube.com/@estoesblender/live" },
  { id: "gelatina", url: "https://www.youtube.com/@SomosGelatina/live" },
  { id: "urbana", url: "https://www.youtube.com/@UrbanaPlayFM/live" },
  { id: "neura", url: "https://www.youtube.com/@NeuraMedia/live" },
  { id: "vorterix", url: "https://www.youtube.com/@VorterixOficial/live" },
];

export const CHECKLIST = [
  "Mac enchufada y tapa abierta (sleep corta la captura)",
  "IP residencial — sin VPN datacenter",
  "source .venv/bin/activate",
  "ANTHROPIC_API_KEY + Supabase en pipeline/.env",
  "Espacio en disco (~13 GB+)",
  "Modal con crédito (modal setup)",
];

export const SECTIONS: Section[] = [
  {
    id: "setup",
    title: "Setup (una vez)",
    blocks: [
      {
        title: "Entorno pipeline",
        cmds: [
          "cd pipeline",
          "python3 -m venv .venv && source .venv/bin/activate",
          "pip install -r requirements.txt",
          "modal setup",
        ],
      },
      {
        title: "pipeline/.env",
        desc: "No commitear. Service role de Supabase, no la anon key.",
        cmds: [
          "ANTHROPIC_API_KEY=sk-ant-...",
          "SUPABASE_URL=https://xxxx.supabase.co",
          "SUPABASE_SERVICE_KEY=eyJ...",
        ],
      },
    ],
  },
  {
    id: "manana",
    title: "Mañana — captura en vivo",
    intro: "El supervisor pollea /live cada 30s, captura concurrentes (+ chat donde hay), y al terminar cada programa corre ingest → Modal → extract → reportes en background.",
    blocks: [
      {
        title: "Pre-flight",
        cmds: [
          "cd pipeline && source .venv/bin/activate",
          "python run_day.py --status",
          'yt-dlp --no-warnings --print "%(live_status)s|%(id)s" "https://www.youtube.com/@olgaenvivo_/live"',
        ],
      },
      {
        title: "Arrancar los 8 canales",
        cmds: ["python run_day.py"],
      },
      {
        title: "Canales explícitos",
        cmds: [
          "python run_day.py --channels olga,luzu,bondi,blend,gelatina,urbana,neura,vorterix",
        ],
      },
      {
        title: "Cierre más tarde (default 00:30 ART)",
        cmds: ["python run_day.py --until 01:00"],
      },
      {
        title: "Monitoreo (otra terminal)",
        cmds: [
          "tail -f data/logs/supervisor.log",
          "tail -f data/logs/pipeline_VIDEO_ID.log",
          "python run_day.py --status",
        ],
      },
    ],
    bullets: [
      "run_day.py activa caffeinate en Mac — no duerme por idle, pero cerrar la tapa sí la duerme.",
      "Luzu: sin chat en vivo (solo concurrentes).",
      "El supervisor NO sube a Supabase solo — ver sección Publicar.",
      "Ctrl+C detiene el supervisor.",
    ],
  },
  {
    id: "manual",
    title: "Reprocesar un programa",
    blocks: [
      {
        title: "Pipeline completo + publicar web",
        cmds: ["python post_stream.py --video-id VIDEO_ID --skip-wait"],
      },
      {
        title: "Sin Supabase",
        cmds: ["python post_stream.py --video-id VIDEO_ID --skip-wait --skip-publish"],
      },
      {
        title: "Paso a paso",
        cmds: [
          "python ingest.py --video VIDEO_ID",
          "modal run transcribe_modal.py --video-id VIDEO_ID",
          "python extract.py --video-id VIDEO_ID",
          "python event_report.py --video-id VIDEO_ID",
          "python report.py --video-id VIDEO_ID",
        ],
      },
      {
        title: "VODs del día (sin supervisor)",
        cmds: [
          'python ingest.py --channel "https://www.youtube.com/@olgaenvivo_" --days 1',
          "modal run transcribe_modal.py",
          "python extract.py",
        ],
      },
      {
        title: "Test live corto (3 min)",
        cmds: ["./test_live.sh VIDEO_ID 3"],
      },
    ],
  },
  {
    id: "publicar",
    title: "Publicar data en la web",
    intro: "Correr al cierre del día o cuando quieras refrescar la UI.",
    blocks: [
      {
        title: "Flujo con Supabase (recomendado)",
        cmds: [
          "cd pipeline && source .venv/bin/activate",
          "python export_ui.py",
          "python push_supabase.py",
          "cd ../webapp && npm run dev",
        ],
      },
      {
        title: "Sin Supabase — commit del bundle",
        cmds: [
          "python export_ui.py",
          "cd ../webapp",
          "git add src/data/*.json",
          'git commit -m "Actualizar export pipeline"',
          "git push origin main",
        ],
      },
      {
        title: "Push sin truncate",
        cmds: ["python push_supabase.py --no-truncate"],
      },
    ],
    bullets: [
      "Datasets: channels, brands, products, benchmark, reports, meta, moments, radar, audience.",
      "Si push falla, Vercel usa el snapshot del último deploy.",
    ],
  },
  {
    id: "consulta",
    title: "Consultas rápidas",
    blocks: [
      {
        title: "Conteos y archivos",
        cmds: [
          "ls data/transcripts/*.json | wc -l",
          "ls data/viewers/*.json | wc -l",
          "cat data/meta/VIDEO_ID.json | python -m json.tool",
          "cat data/reports/event_VIDEO_ID.md",
        ],
      },
      {
        title: "Extras",
        cmds: [
          "python reaccion.py --video-id VIDEO_ID",
          "python brand_monitor.py",
        ],
      },
    ],
  },
];

export const TROUBLESHOOT: { symptom: string; fix: string }[] = [
  { symptom: "No detecta live", fix: "Probar yt-dlp en /live; revisar channels.yaml" },
  { symptom: "Sin concurrentes", fix: "No se capturó en vivo — irreversible. Ver data/viewers/{id}.json" },
  { symptom: "extract saltado", fix: "ANTHROPIC_API_KEY en .env" },
  { symptom: "Modal falla", fix: "modal setup; probar un --video-id aislado" },
  { symptom: "Ingest bloqueado", fix: "IP residencial, sin VPN datacenter" },
  { symptom: "Web stale", fix: "export_ui.py + push_supabase.py" },
  { symptom: "Programa < 20 min", fix: "min_duration_s: 1200 — supervisor lo saltea" },
];

export const IRREVERSIBLE = [
  { dato: "Audio + transcript", recover: "Sí — ingest + Modal" },
  { dato: "Chat replay VOD", recover: "A veces" },
  { dato: "Concurrentes minuto a minuto", recover: "No — capturar en vivo" },
  { dato: "Chat en tiempo real", recover: "No si no se capturó" },
];

export const DAY_FLOW = `06:00–00:30  python run_day.py
             tail -f data/logs/supervisor.log

Al cerrar:   python export_ui.py
             python push_supabase.py`;
