import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/resume/", "/templates/", "/api/"],
    },
    sitemap: "https://resforge.tapan.pro/sitemap.xml",
  };
}
