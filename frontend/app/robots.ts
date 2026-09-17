import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://codeved.vasudevai.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // disallow: "/private/", // Example of how to prevent crawling of specific paths
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
