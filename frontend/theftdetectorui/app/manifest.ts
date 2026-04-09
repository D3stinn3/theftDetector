import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Theft Guard AI",
    short_name: "TheftGuard",
    description: "Live surveillance and alerts for Theft Guard AI",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#0b1220",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-wide.svg",
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "Theft Guard AI dashboard on desktop",
      },
      {
        src: "/screenshot-narrow.svg",
        sizes: "720x1280",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "Theft Guard AI dashboard on mobile",
      },
    ],
  };
}
