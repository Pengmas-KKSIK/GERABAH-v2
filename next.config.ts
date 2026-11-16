import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bawaan Next.js hanya 1MB per kiriman form — foto dari HP hampir selalu lebih besar.
      // 20MB file (lib/upload.ts) + sisa isi form. Di VPS, Nginx juga perlu client_max_body_size 25m.
      bodySizeLimit: "21mb",
    },
  },
};

export default nextConfig;
