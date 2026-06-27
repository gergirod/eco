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
    intro:
      "El supervisor pollea /live cada 30s, respeta la grilla (config/schedules/*.yaml) y al terminar cada programa corre ingest → Modal → extract → reportes. Al cerrar un pipeline OK publica export + Supabase.",
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
        cmds: ["./ops/run_supervisor.sh"],
      },
      {
        title: "Reiniciar (matar instancia vieja)",
        cmds: [
          "pgrep -fl run_day.py",
          "pkill -9 -f 'python run_day.py'",
          "./ops/run_supervisor.sh",
        ],
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
      "Grillas en config/schedules/ — solo captura talk en franja (no música filler). Ver /backoffice → Captura.",
      "Lun–vie: grilla completa por canal. Sáb: Luzu 11–13 + Urbana 10–13. Dom: Blender 21–23.",
      "Luzu: sin chat en YouTube (solo concurrentes).",
      "Al terminar pipeline OK: export_ui + push_supabase automático (post_stream.publish). Nightly 03:50 AR también.",
      "Ctrl+C o pkill detiene el supervisor.",
    ],
  },
  {
    id: "grillas",
    title: "Grillas de captura",
    intro: "Una entrada por canal en config/schedules/*.yaml. El supervisor ignora live fuera de franja o con título filler (ej. LO MEJOR DE en Urbana).",
    blocks: [
      {
        title: "Editar grilla",
        cmds: [
          "vim config/schedules/urbana.yaml",
          "vim config/channels.yaml  # program_schedule: schedules/urbana.yaml",
        ],
      },
      {
        title: "Ver en backoffice",
        cmds: ["open http://localhost:3000/backoffice?tab=captura"],
      },
      {
        title: "Exportar grillas a la UI",
        cmds: [
          "python export_ui.py   # genera capture_schedules.json",
          "python push_supabase.py",
        ],
      },
    ],
    table: {
      cols: ["Canal", "Lun–vie", "Finde"],
      rows: [
        ["Olga", "06:30–21:30", "—"],
        ["Luzu", "06:50–20:00", "sáb 11–13"],
        ["Bondi", "10:00–16:30", "—"],
        ["Blender", "17:00–00:30", "dom 21–23"],
        ["Gelatina", "08:00–18:00", "vie 10–12"],
        ["Urbana", "06:00–22:00 talk", "sáb 10–13"],
        ["Neura", "12:00–22:00", "—"],
        ["Vorterix", "08:00–21:00", "—"],
      ],
    },
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
      "Datasets: channels, brands, products, benchmark, reports, meta, moments, radar, audience, chat_demand, chat_insights, schedule_insights, capture_schedules, placement.",
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
  { symptom: "Captura filler / música", fix: "Revisar config/schedules/ y skip_title_patterns; tab Captura en backoffice" },
  { symptom: "Cortó vivo a los pocos min", fix: "Glitch yt-dlp — supervisor ahora exige 3 polls off-air; reiniciar si cortó mal" },
  { symptom: "Supervisor ya corre", fix: "pkill -9 -f 'python run_day.py' luego ./ops/run_supervisor.sh" },
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

export const DAY_FLOW = `04:00–00:30  ./ops/run_supervisor.sh
             tail -f data/logs/supervisor.log
             /backoffice → Captura (grilla + vivo)

Al cerrar:   export automático tras cada pipeline OK
             nightly 03:50 AR: export_ui + push`;
