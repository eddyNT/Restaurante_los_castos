import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir fotos de productos, QR y comprobantes (hasta 3 MB) por Server Actions
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
