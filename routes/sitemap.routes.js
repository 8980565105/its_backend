const express = require("express");
const router = express.Router();
const SeoManager = require("../models/seo/seo-manager");
const Blog = require("../models/blog/blog.model");

// Helper function to format dates to YYYY-MM-DD
const formatDate = (date) => {
    if (!date) {
        return new Date().toISOString().split("T")[0];
    }
    return new Date(date).toISOString().split("T")[0];
};

router.get("/sitemap.xml", async (req, res) => {
    // ⚠️ IMPORTANT: Change this URL to your final, live website domain
    const baseUrl =
        // "https://inspiretechnosolution.com" ||
        "http://192.168.1.29:3000" ||"http://localhost:3000"
        ;

    try {
        // --- 1. Fetch all SEO-managed pages (including hire pages) ---
        const seoDbPages = await SeoManager.find({}, "slug updatedAt").lean();
        const seoUrls = seoDbPages
            .map((page) => {
                let path;
                // Check if the slug is for a hire page
                if (page.slug.startsWith("hire-")) {
                    path = `/hire/${page.slug}`;
                } else if (page.slug === "home") {
                    path = "/"; // Special case for the homepage
                } else {
                    path = `/${page.slug}`;
                }

                return {
                    loc: path,
                    priority: path === "/" ? 1.0 : 0.9, // Homepage gets highest priority
                    changefreq: "weekly",
                    lastmod: formatDate(page.updatedAt),
                };
            });

        // --- 2. Fetch all Blog Pages ---
        const blogDbPages = await Blog.find({}, "slug updatedAt").lean();
        const blogUrls = blogDbPages.map((post) => ({
            loc: `/blog/${post.slug}`,
            priority: 0.8,
            changefreq: "weekly",
            lastmod: formatDate(post.updatedAt),
        }));

        // --- 3. Combine all URL arrays ---
        const allUrls = [...seoUrls, ...blogUrls];

        // --- 4. Build the final XML string ---
        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
                .map(
                    (url) => `
  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`
                )
                .join("")}
</urlset>`;

        // --- 5. Set the correct header and send the response ---
        res.header("Content-Type", "application/xml");
        res.send(sitemapXml);

    } catch (error) {
        console.error("❌ Error generating sitemap:", error);
        res.status(500).send("Internal Server Error: Could not generate sitemap.");
    }
});

module.exports = router;