const express = require('express');
const SeoManager = require('../../models/seo/seo-manager');
const { protect } = require('../../middlewares/auth'); 
const { updateLinkedEntity, safeDeleteSeoData, deleteSeoData } = require('../../utils/seoSync');
const router = express.Router();
const NavbarGroupTabImageManage = require('../../models/navbarGroupTabImage');
const cleanupImages = require('../../middlewares/cleanupImages');
const cleanupOldImages = require('../../middlewares/cleanupOldImages');
/**
 * @swagger
 * tags:
 *   name: SeoManager
 *   description: API for managing SEO metadata
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SeoManager:
 *       type: object
 *       required:
 *         - title
 *         - slug
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         title:
 *           type: string
 *           example: Homepage SEO
 *         slug:
 *           type: string
 *           example: homepage-seo
 *         seo_keyphrase:
 *           type: string
 *           example: best web development company
 *         seo_title:
 *           type: string
 *           example: Best Web Development Company | Example
 *         meta_description:
 *           type: string
 *           example: We are the best web development company with expertise in React, Node.js, and more.
 *         cover_image:
 *           type: string
 *           example: https://example.com/seo-cover.png
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/seo-manager:
 *   post:
 *     summary: Create SEO metadata
 *     tags: [SeoManager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeoManager'
 *     responses:
 *       201:
 *         description: SEO metadata created successfully
 *       400:
 *         description: Slug already exists
 *       500:
 *         description: Server error
 */

router.post('/', async (req, res) => {
    try {
        const { title, slug, seo_keyphrase, seo_title, meta_description, cover_image } = req.body;

        //slug is exist or not 
        const existingSeo = await SeoManager.findOne({ slug });
        if (existingSeo) {
            return res.status(400).json({
                success: false,
                message: 'SEO with this slug already exists'
            });
        }

        const seoManager = new SeoManager({
            title,
            slug,
            seo_keyphrase,
            seo_title,
            meta_description,
            cover_image
        });
        await seoManager.save();

        res.status(201).json({
            success: true,
            message: 'SEO metadata created successfully',
        });

    } catch (error) {
        console.error('❌ Error creating SEO metadata:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

/**
 * @swagger
 * /api/seo-manager:
 *   get:
 *     summary: Get all SEO metadata with pagination
 *     tags: [SeoManager]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated SEO metadata retrieved successfully
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const value = req.query.value || '';

        const skip = (page - 1) * limit;
        let query = {};
        if (value) {
            query = {
                $or: [
                    { title: { $regex: value, $options: 'i' } },
                    { slug: { $regex: value, $options: 'i' } },
                    { seo_keyphrase: { $regex: value, $options: 'i' } },
                    { seo_title: { $regex: value, $options: 'i' } },
                    { meta_description: { $regex: value, $options: 'i' } },
                ]
            };
        }
        const [total, seoData] = await Promise.all([
            SeoManager.countDocuments(query),
            SeoManager.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean()
        ]);

        res.status(200).json({
            success: true,
            data: seoData,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('❌ Error fetching SEO metadata:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
})

/**
 * @swagger
 * /api/seo-manager/navigation-structure:
 *   get:
 *     summary: Get all SEO data needed to build the main navigation and dropdowns
 *     tags: [SeoManager]
 *     description: >
 *       Returns the full navigation structure divided into:
 *       - **mainNav** → Independent SEO pages  
 *       - **servicesNav** → Grouped by service category  
 *       - **hireNav** → Grouped by hire category
 *     responses:
 *       200:
 *         description: Full navigation structure retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     mainNav:
 *                       type: array
 *                       description: List of independent SEO pages for the main navigation
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: About Us
 *                           slug:
 *                             type: string
 *                             example: about-us
 *                           linkedType:
 *                             type: string
 *                             example: independent
 *                     servicesNav:
 *                       type: array
 *                       description: Service-related SEO pages grouped by category
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: Web Development
 *                           links:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                   example: React Development
 *                                 slug:
 *                                   type: string
 *                                   example: react-development
 *                     hireNav:
 *                       type: array
 *                       description: Hire-related SEO pages grouped by category
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: Developers
 *                           links:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                   example: Hire Node.js Developer
 *                                 slug:
 *                                   type: string
 *                                   example: hire-nodejs-developer
 *       500:
 *         description: Server error
 */


router.get('/navigation-structure', async (req, res) => {
    try {
        // Add a check inside the route for extra safety
        if (typeof NavbarGroupTabImageManage.find !== 'function') {
            console.error('CRITICAL: NavbarGroupTabImageManage model is not loaded correctly. Check the require() path in seoManager.routes.js');
            throw new Error('Server configuration error.');
        }

        // Step 1: Fetch all SEO links...
        const allLinks = await SeoManager.find({})
            .select('title slug linkedType linkedService linkedHirePage')
            .populate({ path: 'linkedService', select: 'category' })
            .populate({ path: 'linkedHirePage', select: 'category' })
            .lean();

        // Step 2: Fetch all the icon mappings. This will now work.
        const navbarImages = await NavbarGroupTabImageManage.find({}).lean();

        // Step 3: Create efficient lookup maps...
        const serviceIdToIconMap = new Map();
        const hireIdToIconMap = new Map();
        navbarImages.forEach(item => {
            if (item.linkedService) serviceIdToIconMap.set(item.linkedService.toString(), item.image);
            if (item.linkedHirePage) hireIdToIconMap.set(item.linkedHirePage.toString(), item.image);
        });

        // Step 4: Filter independent links...
        const independentLinks = allLinks.filter(link => link.linkedType === 'independent');
        
        // Step 5: Helper function to group and assign icons...
        const groupByCategory = (links, type) => {
            const grouped = links
                .filter(link => link.linkedType === type)
                .reduce((acc, link) => {
                    const pageData = link.linkedService || link.linkedHirePage;
                    if (!pageData || !pageData.category) return acc;
                    const categoryName = pageData.category;
                    if (!acc[categoryName]) {
                        acc[categoryName] = { icon: "", links: [] };
                    }
                    acc[categoryName].links.push({ title: link.title, slug: link.slug });
                    if (!acc[categoryName].icon) {
                        const iconMap = type === 'service' ? serviceIdToIconMap : hireIdToIconMap;
                        if (pageData._id && iconMap.has(pageData._id.toString())) {
                            acc[categoryName].icon = iconMap.get(pageData._id.toString());
                        }
                    }
                    return acc;
                }, {});

            return Object.keys(grouped).map(categoryName => ({
                category: categoryName,
                icon: grouped[categoryName].icon || "",
                links: grouped[categoryName].links
            }));
        };

        // Step 6: Execute the grouping...
        const serviceNav = groupByCategory(allLinks, 'service');
        const hireNav = groupByCategory(allLinks, 'hire');

        // Step 7: Send the response...
        res.status(200).json({
            success: true,
            data: { mainNav: independentLinks, servicesNav: serviceNav, hireNav: hireNav }
        });
    } catch (error) {
        console.error('❌ Error fetching navigation structure:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @swagger
 * /api/seo-manager/slug/{slug}:
 *   get:
 *     summary: Get SEO metadata by slug
 *     tags: [SeoManager]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique slug of the SEO metadata
 *     responses:
 *       200:
 *         description: SEO metadata retrieved successfully
 *       404:
 *         description: SEO metadata not found
 *       500:
 *         description: Server error
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // The slug will now be "home" for the homepage, so no special logic is needed.
        let seoData = await SeoManager.findOne({ slug }).lean();

        // Keep the fallback just in case a different slug is not found
        if (!seoData) {
            console.warn(`SEO data for slug "${slug}" not found. Falling back to homepage.`);
            seoData = await SeoManager.findOne({ slug: "home" }).lean();
        }

        if (!seoData) {
            return res.status(404).json({
                success: false,
                message: "Default SEO metadata not found",
            });
        }

        res.status(200).json({
            success: true,
            data: seoData,
        });
    } catch (error) {
        console.error("❌ Error fetching SEO metadata by slug:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});



/**
 * @swagger
 * /api/seo-manager/{id}:
 *   put:
 *     summary: Update SEO metadata by ID
 *     tags: [SeoManager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeoManager'
 *     responses:
 *       200:
 *         description: SEO metadata updated successfully
 *       400:
 *         description: Slug already exists
 *       404:
 *         description: SEO metadata not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, cleanupOldImages(SeoManager, "SeoManager"), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, seo_keyphrase, seo_title, meta_description, cover_image } = req.body;
        const seoData = await SeoManager.findById(id);
        if (!seoData) {
            return res.status(404).json({
                success: false,
                message: 'SEO metadata not found',
            });
        }

        const oldSlug = seoData.slug;
        const oldTitle = seoData.title;

        // Check if the new slug is different and already exists
        if (slug && slug !== seoData.slug) {
            const existingSeo = await SeoManager.findOne({
                slug,
                _id: { $ne: id } // Exclude the current document
            });
            if (existingSeo) {
                return res.status(400).json({
                    success: false,
                    message: 'Another SEO with this slug already exists'
                });
            }
        }
        seoData.title = title || seoData.title;
        seoData.slug = slug || seoData.slug;
        seoData.seo_keyphrase = seo_keyphrase || seoData.seo_keyphrase;
        seoData.seo_title = seo_title || seoData.seo_title;
        seoData.meta_description = meta_description || seoData.meta_description;
        seoData.cover_image = cover_image || seoData.cover_image;
        await seoData.save();

        if (seoData.isAutoManaged && ((slug && slug !== oldSlug) || (title && title !== oldTitle))) {
            try {
                const updatedEntity = await updateLinkedEntity(oldSlug, seoData.slug, seoData.title);
                if (updatedEntity) {
                    console.log(`✅ Updated linked ${seoData.linkedType}:`, updatedEntity._id);
                }
            } catch (syncError) {
                console.warn('Linked entity update warning:', syncError.message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'SEO metadata updated successfully',
            data: seoData,
        });
    } catch (error) {
        console.error('❌ Error updating SEO metadata:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});


/**
 * @swagger
 * /api/seo-manager/{id}:
 *   delete:
 *     summary: Delete SEO metadata by ID
 *     tags: [SeoManager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SEO metadata deleted successfully
 *       400:
 *         description: Cannot delete auto-managed SEO
 *       404:
 *         description: SEO metadata not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, cleanupImages(SeoManager),async (req, res) => {
    try {
        const { id } = req.params;
        const seoData = await SeoManager.findById(id);
        if (!seoData) {
            return res.status(404).json({
                success: false,
                message: 'SEO metadata not found',
            });
        }

        // 🆕 USE SAFE DELETE - Only deletes INDEPENDENT entries
        const deleted = await deleteSeoData(seoData.slug);

        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete auto-managed SEO entry. This entry is linked to a ${seoData.linkedType} page. Delete the linked page instead.`
            });
        }

        res.status(200).json({
            success: true,
            message: 'SEO metadata deleted successfully',
        });
    }
    catch (error) {
        console.error('❌ Error deleting SEO metadata:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

module.exports = router;