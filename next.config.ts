import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Réduire l'impact des source maps côté serveur/clienteur pour éviter les erreurs de parsing dans certaines dépendances
  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
  },
};

export default nextConfig;
