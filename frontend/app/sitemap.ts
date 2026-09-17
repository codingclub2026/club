import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Use the provided production URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://codeved.vasudevai.in";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Note: To include dynamic routes like individual events (/events/[id]),
    // you would typically fetch those IDs from your database/backend here
    // and map them into this array.
  ];
}
