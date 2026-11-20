import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://agenticbrowser.live/",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
