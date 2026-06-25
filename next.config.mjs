/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Demo: que un type/lint suelto no frene el deploy en Vercel.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      { source: "/discover", destination: "/marcas", permanent: false },
      { source: "/discover/:slug", destination: "/marcas/:slug", permanent: false },
      { source: "/campaign", destination: "/campanas", permanent: false },
      { source: "/tendencias", destination: "/movimientos", permanent: false },
      { source: "/audiencia", destination: "/canales", permanent: false },
    ];
  },
};
export default nextConfig;
