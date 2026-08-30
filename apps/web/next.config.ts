import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "autera.ma" },
      { protocol: "https", hostname: "www.autera.ma" },
      { protocol: "https", hostname: "moteur.ma" },
      { protocol: "https", hostname: "www.moteur.ma" },
      { protocol: "https", hostname: "images.moteur.ma" },
      { protocol: "https", hostname: "electrodrive.ma" },
      { protocol: "https", hostname: "autohall.ma" },
      { protocol: "https", hostname: "auto24.ma" },
      { protocol: "https", hostname: "www.auto24.ma" },
      { protocol: "https", hostname: "avito.ma" },
      { protocol: "https", hostname: "img.avito.ma" },
      { protocol: "https", hostname: "**.moteur.ma" },
    ],
  },
};

export default nextConfig;
