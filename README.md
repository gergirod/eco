# Eco — Demo UI

> Eco · el eco de tu marca en el streaming argentino en vivo.

UI de demostración (Next.js) sobre el pipeline de brand intelligence del streaming argentino.
Diseño limpio, light-mode. Datos **reales** exportados del pipeline.

## Vistas
- **Resumen** (`/`) — KPIs globales + benchmark entre canales.
- **Backoffice · Runs** (`/backoffice`) — selección de canales, disparar run, estado del proceso y **estado en vivo real** (on-demand).
- **Dashboard de marca** (`/marca`) — vista cliente / agencia: elegir marca, menciones por stream, valorización.
- **Competencia** (`/competencia`) — comparar marca propia vs competidores (share of voice, valor, presencia por canal).
- **Catálogo de marcas** (`/productos`) — universo acumulado, filtrable.

## Correr local
```bash
cd webapp
npm install
npm run dev      # http://localhost:3000
```

## Actualizar la data (desde el pipeline)
```bash
cd ../pipeline
python export_ui.py        # regenera webapp/src/data/*.json (snapshot del bundle)
python push_supabase.py    # opcional: sube esos JSON a Supabase (UI fresca sin redeploy)
```

## Modos de data
1. **Snapshot (default).** Sin Supabase configurado, la UI lee los JSON del bundle.
   Para actualizar: `export_ui.py` → commit → push → Vercel rebuildea.
2. **Supabase (vivo).** Con las env de Supabase seteadas, la UI lee de la base en
   runtime y se actualiza sola con cada `push_supabase.py`, sin redeploy.
   Si Supabase no responde (p. ej. proyecto free pausado), cae automáticamente al snapshot.

### Setear Supabase (free tier alcanza: 500MB, nuestra data ~2MB)
1. Crear proyecto en supabase.com (free).
2. SQL Editor → pegar y correr `webapp/supabase_schema.sql`.
3. Settings → API: copiar `Project URL`, la `anon` key y la `service_role` key.
4. En `pipeline/.env`: `SUPABASE_URL=...` y `SUPABASE_SERVICE_KEY=<service_role>`. Correr `python push_supabase.py`.
5. En Vercel → Project → Settings → Environment Variables:
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Redeploy una vez.

## Deploy a Vercel
1. Subir el repo a GitHub (la carpeta `webapp` como root del proyecto, o configurar "Root Directory: webapp" en Vercel).
2. En Vercel: New Project → importar el repo → Framework: Next.js → Deploy.
3. No requiere variables de entorno. La data viaja en el bundle (`src/data/*.json`).

### Notas
- El **estado en vivo** (`/api/live`) chequea YouTube on-demand. Desde IPs de datacenter (Vercel) YouTube puede limitar el request; ante error devuelve `s/d` sin romper la UI.
- El **run real** del pipeline corre **local** (ingest desde IP residencial + transcripción en Modal GPU); no se ejecuta dentro de Vercel. El botón del backoffice refleja el avance.
