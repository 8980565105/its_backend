const express = require('express');
const Service = require('../../models/ourServices/ourServies');
const { protect } = require('../../middlewares/auth'); 
const { syncSeoData, deleteSeoData, forceDeleteSeoData } = require("../../utils/seoSync");
const cleanupImages = require('../../middlewares/cleanupImages');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: API for managing Services
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FAQ:
 *       type: object
 *       required:
 *         - question
 *         - answer
 *       properties:
 *         question:
 *           type: string
 *           example: How long will my project take?
 *         answer:
 *           type: string
 *           example: Typically between 4-6 weeks depending on complexity.
 *
 *     ContentBlock:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *
 *     WhyWorkWithThis:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - image
 *       properties:
 *         title:
 *           type: string
 *           example: Why choose us?
 *         description:
 *           type: string
 *           example: We deliver quality and reliability.
 *         image:
 *           type: string
 *           example: https://example.com/image.jpg
 *         content:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *
 *     ToolDetail:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         section:
 *           type: number
 *         keyPoints:
 *           type: array
 *           items:
 *             type: string
 *
 *     ToolsAndTechnology:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           example: Web Development Tools
 *         description:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ToolDetail'
 *
 *     WhyCompanyPrefersThis:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           example: Why Companies Choose This
 *         description:
 *           type: string
 *           example: Because it’s scalable and efficient
 *         content:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *
 *     Service:
 *       type: object
 *       required:
 *         - category
 *         - subCategory
 *         - slug
 *         - mainTitle
 *         - description
 *         - subMainTitle
 *         - subMainTitleDescription
 *       properties:
 *         id:
 *           type: string
 *         category:
 *           type: string
 *         subCategory:
 *           type: string
 *         slug:
 *           type: string
 *         mainTitle:
 *           type: string
 *         description:
 *           type: string
 *         subMainTitle:
 *           type: string
 *         subMainTitleDescription:
 *           type: string
 *         contentBlocks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContentBlock'
 *         WhyWorkWithThis:
 *           $ref: '#/components/schemas/WhyWorkWithThis'
 *         workProgress:
 *           type: string
 *         toolsAndTechnology:
 *           $ref: '#/components/schemas/ToolsAndTechnology'
 *         whyCompanyPerfersThis:
 *           $ref: '#/components/schemas/WhyCompanyPrefersThis'
 *         faqs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FAQ'
 */


/**
 * @swagger
 * /api/service:
 *   post:
 *     summary: Create a new Service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Slug already exists or validation error
 *       500:
 *         description: Server error
 */

router.post('/', protect, async (req, res) => {
    try {
        const { category, subCategory, slug, mainTitle } = req.body;

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Slug is required"
            });
        }

        const slugExists = await Service.findOne({ slug });
        if (slugExists) {
            return res.status(400).json({
                success: false,
                message: "Slug already exists, please choose another one"
            });
        }
        const checkService = await Service.findOne({ category, subCategory });
        if (checkService) {
            return res.status(400).json({
                success: false,
                message: "Service already exists in this category",
            });
        }

        const newService = new Service(req.body);
        const result = await newService.save();

        try {
            await syncSeoData(subCategory, slug, mainTitle, 'service', result._id);
        } catch (seoError) {
            console.warn('SEO sync warning:', seoError.message);
            // Don't fail the request if SEO sync fails
        }

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: result
        });
    } catch (error) {
        console.error("Error saving service:", error);
        res.status(500).json({
            success: false,
            message: "Error saving service",
        });
    }
});

/**
 * @swagger
 * /api/service:
 *   get:
 *     summary: Get all services (paginated & filterable)
 *     tags: [Services]
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services
 *       500:
 *         description: Error fetching services
 */

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, subCategory } = req.query;
        let filter = {};
        if (category) filter.category = category;
        if (subCategory) filter.subCategory = subCategory;

        const skip = (page - 1) * limit;
        const [services, total] = await Promise.all([
            Service.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Service.countDocuments(filter)
        ]);
        res.status(200).json({
            success: true,
            data: services,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching services",
        });
    }
});

/**
 * @swagger
 * /api/service/categories:
 *   get:
 *     summary: Get all service categories & subCategories
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Error fetching categories
 */

router.get('/categories', async (req, res) => {
    try {
        const services = await Service.find().select('category subCategory -_id');
        res.status(200).json({
            success: true,
            message: "Category list fetched successfully",
            data: services
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
        });
    }
});

/**
 * @swagger
 * /api/service/admin-id:
 *   get:
 *     summary: Get all services for admin (id, category, subCategory, mainTitle)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services for admin panel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Service get successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 64a7c8e8f9d8a2a3f1234567
 *                       category:
 *                         type: string
 *                         example: Web Development
 *                       subCategory:
 *                         type: string
 *                         example: ReactJS Development
 *                       mainTitle:
 *                         type: string
 *                         example: Build Scalable ReactJS Apps
 *       401:
 *         description: Unauthorized (if no token or invalid token)
 *       500:
 *         description: Error fetching service
 */
router.get('/admin-id', protect, async (req, res) => {
    try {
        const service = await Service.find().select('_id category subCategory mainTitle');
        res.status(200).json({
            success: true,
            message: "Service get successfully",
            data: service
        });
    } catch (error) {
        console.error("Error fetching service by slug:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching service",
        });
    }
});



/**
 * @swagger
 * /api/service/{subCategory}:
 *   get:
 *     summary: Get service by subCategory
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: subCategory
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service fetched successfully
 *       404:
 *         description: Service not found
 *       500:
 *         description: Error fetching service
 */
router.get('/:subCategory', async (req, res) => {
    try {
        const { subCategory } = req.params;
        const service = await Service.findOne({ subCategory });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Service fetched successfully",
            data: service
        });
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching service",
        });
    }
});

/**
 * @swagger
 * /api/service/slug/{slug}:
 *   get:
 *     summary: Get service by slug
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service fetched successfully
 *       404:
 *         description: Service not found
 *       500:
 *         description: Error fetching service
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const service = await Service.findOne({ slug });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Service fetched successfully",
            data: service
        });
    } catch (error) {
        console.error("Error fetching service by slug:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching service",
        });
    }
});






/**
 * @swagger
 * /api/service/{id}:
 *   put:
 *     summary: Update a service by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Slug already exists or missing fields
 *       404:
 *         description: Service not found
 *       500:
 *         description: Error updating service
 */

router.put('/:id', protect, cleanupImages(Service,"Service"), async (req, res) => {
    try {
        const { slug, subCategory, mainTitle } = req.body;

        // ✅ 1. Check if slug is unique (except for current document)
        const currentService = await Service.findById(req.params.id);
        if (!currentService) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        // ✅ Check if slug is unique (except for current document)
        if (slug && slug !== currentService.slug) {
            const existingService = await Service.findOne({ slug, _id: { $ne: req.params.id } });
            if (existingService) {
                return res.status(400).json({
                    success: false,
                    message: "Slug already exists. Please use a different one.",
                });
            }
        }


        // ✅ 2. Check required fields
        const requiredFields = [
            "category",
            "subCategory",
            "slug",
            "mainTitle",
            "description",
            "subMainTitle",
            "subMainTitleDescription"
        ];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: `${field} is required`,
                });
            }
        }

        // ✅ 3. Update service
        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedService) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        if (currentService.slug !== updatedService.slug ||
            currentService.subCategory !== updatedService.subCategory) {
            try {
                await syncSeoData(updatedService.subCategory, updatedService.slug, updatedService.mainTitle, 'service', updatedService._id);
            } catch (seoError) {
                console.warn('SEO sync warning during update:', seoError.message);
            }
        }


        res.status(200).json({
            success: true,
            message: "Service updated successfully",
            data: updatedService,
        });
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({
            success: false,
            message: "Error updating service",
        });
    }
});


/**
 * @swagger
 * /api/service/{id}:
 *   delete:
 *     summary: Delete a service by ID
 *     tags: [Services]
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
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *       500:
 *         description: Error deleting service
 */

router.delete('/:id', protect, cleanupImages(Service), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        try {
            await forceDeleteSeoData(service.slug);
        } catch (seoError) {
            console.warn('SEO delete warning:', seoError.message);
        }

        await Service.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Service deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting service",
        });
    }
});

module.exports = router;