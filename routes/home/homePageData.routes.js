const express = require("express");
const mongoose = require("mongoose");
const { protect } = require("../../middlewares/auth");
const HomePageData = require('../../models/home/homeContent');
const cleanupImages = require("../../middlewares/cleanupImages");
const cleanupOldImages = require("../../middlewares/cleanupOldImages");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: HomePageData
 *   description: Manage the homepage data including hero section, reasons to choose, about company, and overseas agencies
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TechnologySection:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - image
 *       properties:
 *         title:
 *           type: string
 *           example: "Web Development"
 *         description:
 *           type: string
 *           example: "Modern web development solutions"
 *         image:
 *           type: string
 *           example: "https://example.com/web-dev.png"
 *
 *     HeroSection:
 *       type: object
 *       required:
 *         - title
 *         - image
 *         - technologySection
 *       properties:
 *         title:
 *           type: string
 *           example: "Welcome to Our Platform"
 *         image:
 *           type: string
 *           example: "https://example.com/hero-banner.jpg"
 *         technologySection:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/TechnologySection"
 *
 *     DetailBox:
 *       type: object
 *       required:
 *         - image
 *         - total
 *         - title
 *       properties:
 *         image:
 *           type: string
 *           example: "https://example.com/icon1.png"
 *         total:
 *           type: string
 *           example: "500+"
 *         title:
 *           type: string
 *           example: "Projects Completed"
 *
 *     ReasonsToChoose:
 *       type: object
 *       required:
 *         - mainTitle
 *         - deatailBox
 *       properties:
 *         mainTitle:
 *           type: string
 *           example: "Why Choose Us"
 *         deatailBox:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/DetailBox"
 *
 *     AboutDetailBox:
 *       type: object
 *       required:
 *         - label
 *         - image
 *       properties:
 *         label:
 *           type: string
 *           example: "Quality Assurance"
 *         image:
 *           type: string
 *           example: "https://example.com/qa-icon.png"
 *
 *     ButtonContent:
 *       type: object
 *       required:
 *         - total
 *         - label
 *         - image
 *       properties:
 *         total:
 *           type: string
 *           example: "1000+"
 *         label:
 *           type: string
 *           example: "Happy Clients"
 *         image:
 *           type: string
 *           example: "https://example.com/client-icon.png"
 *
 *     AboutOurCompany:
 *       type: object
 *       required:
 *         - subtitle
 *         - mainTitle
 *         - description
 *         - deatailBox
 *         - image
 *         - buttonContent
 *       properties:
 *         subtitle:
 *           type: string
 *           example: "About Us"
 *         mainTitle:
 *           type: string
 *           example: "Leading Technology Company"
 *         description:
 *           type: string
 *           example: "We provide innovative solutions for modern businesses"
 *         deatailBox:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AboutDetailBox"
 *         image:
 *           type: string
 *           example: "https://example.com/about-image.jpg"
 *         buttonContent:
 *           $ref: "#/components/schemas/ButtonContent"
 *
 *     OverseasDetail:
 *       type: object
 *       required:
 *         - title
 *         - subtitle
 *       properties:
 *         title:
 *           type: string
 *           example: "Global Presence"
 *         subtitle:
 *           type: string
 *           example: "Serving clients worldwide"
 *
 *     OverseasWebAgencies:
 *       type: object
 *       required:
 *         - mainTitle
 *         - image
 *         - desctiption
 *         - detail
 *       properties:
 *         mainTitle:
 *           type: string
 *           example: "Overseas Web Agencies"
 *         image:
 *           type: string
 *           example: "https://example.com/overseas-image.jpg"
 *         desctiption:
 *           type: string
 *           example: "We collaborate with agencies across the globe"
 *         detail:
 *           $ref: "#/components/schemas/OverseasDetail"
 *
 *     HomePageData:
 *       type: object
 *       properties:
 *         heroSecton:
 *           $ref: "#/components/schemas/HeroSection"
 *         reasonsToChoose:
 *           $ref: "#/components/schemas/ReasonsToChoose"
 *         aboutOurCompany:
 *           $ref: "#/components/schemas/AboutOurCompany"
 *         overseasWebAgencies:
 *           $ref: "#/components/schemas/OverseasWebAgencies"
 */

// --------------------------------------------------------------------
// Create HomePageData
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/homepage:
 *   post:
 *     summary: Create new homepage data
 *     tags: [HomePageData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HomePageData'
 *     responses:
 *       201:
 *         description: Homepage data created successfully
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
 *                   example: Homepage data created successfully
 *                 data:
 *                   $ref: '#/components/schemas/HomePageData'
 *       400:
 *         description: Validation error or missing required fields
 *       500:
 *         description: Server Error
 */
router.post("/", protect, async (req, res) => {
    try {
        const { heroSecton, reasonsToChoose, aboutOurCompany, overseasWebAgencies } = req.body;

        // Check if homepage data already exists
        const existingData = await HomePageData.findOne();
        if (existingData) {
            return res.status(400).json({
                success: false,
                message: "Homepage data already exists. Use update instead.",
            });
        }

        const newHomePageData = new HomePageData({
            heroSecton,
            reasonsToChoose,
            aboutOurCompany,
            overseasWebAgencies,
        });

        await newHomePageData.save();

        res.status(201).json({
            success: true,
            message: "Homepage data created successfully",
            data: newHomePageData,
        });
    } catch (error) {
        console.error("❌ Error creating homepage data:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
});

// --------------------------------------------------------------------
// Get HomePageData (Public)
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/homepage:
 *   get:
 *     summary: Get homepage data (Public)
 *     tags: [HomePageData]
 *     responses:
 *       200:
 *         description: Homepage data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HomePageData'
 *       404:
 *         description: Homepage data not found
 *       500:
 *         description: Server Error
 */
router.get("/", async (req, res) => {
    try {
        const homepageData = await HomePageData.findOne();

        if (!homepageData) {
            return res.status(404).json({
                success: false,
                message: "Homepage data not found",
            });
        }

        res.status(200).json({
            success: true,
            data: homepageData
        });
    } catch (error) {
        console.error("❌ Error fetching homepage data:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

// --------------------------------------------------------------------
// Get HomePageData (Admin)
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/homepage/admin:
 *   get:
 *     summary: Get homepage data for admin
 *     tags: [HomePageData]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Homepage data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HomePageData'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Homepage data not found
 *       500:
 *         description: Server Error
 */
router.get("/admin", protect, async (req, res) => {
    try {
        const homepageData = await HomePageData.findOne();

        if (!homepageData) {
            return res.status(404).json({
                success: false,
                message: "Homepage data not found",
            });
        }

        res.status(200).json({
            success: true,
            data: homepageData
        });
    } catch (error) {
        console.error("❌ Error fetching admin homepage data:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

// --------------------------------------------------------------------
// Update HomePageData
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/homepage/{id}:
 *   put:
 *     summary: Update homepage data by ID
 *     tags: [HomePageData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HomePageData ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HomePageData'
 *     responses:
 *       200:
 *         description: Homepage data updated successfully
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
 *                   example: Homepage data updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/HomePageData'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Homepage data not found
 *       500:
 *         description: Server Error
 */
router.put("/:id", protect,cleanupOldImages(HomePageData, "HomePageData"), async (req, res) => {
    try {
        const { heroSecton, reasonsToChoose, aboutOurCompany, overseasWebAgencies } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        const updatedHomePageData = await HomePageData.findByIdAndUpdate(
            req.params.id,
            {
                heroSecton,
                reasonsToChoose,
                aboutOurCompany,
                overseasWebAgencies,
            },
            { new: true, runValidators: true }
        );

        if (!updatedHomePageData) {
            return res.status(404).json({
                success: false,
                message: "Homepage data not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Homepage data updated successfully",
            data: updatedHomePageData,
        });
    } catch (error) {
        console.error("❌ Error updating homepage data:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
});

// --------------------------------------------------------------------
// Update or Create HomePageData (Upsert)
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/homepage:
 *   patch:
 *     summary: Update or create homepage data (Upsert)
 *     tags: [HomePageData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HomePageData'
 *     responses:
 *       200:
 *         description: Homepage data updated successfully
 *       201:
 *         description: Homepage data created successfully
 *       500:
 *         description: Server Error
 */
router.patch("/", protect, cleanupOldImages(HomePageData,"HomePageData"), async (req, res) => {
    try {
        const { heroSecton, reasonsToChoose, aboutOurCompany, overseasWebAgencies } = req.body;

        const existingData = await HomePageData.findOne();

        if (existingData) {
            // Update existing
            const updatedData = await HomePageData.findOneAndUpdate(
                {},
                {
                    heroSecton,
                    reasonsToChoose,
                    aboutOurCompany,
                    overseasWebAgencies,
                },
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                message: "Homepage data updated successfully",
                data: updatedData,
            });
        } else {
            // Create new
            const newHomePageData = new HomePageData({
                heroSecton,
                reasonsToChoose,
                aboutOurCompany,
                overseasWebAgencies,
            });

            await newHomePageData.save();

            return res.status(201).json({
                success: true,
                message: "Homepage data created successfully",
                data: newHomePageData,
            });
        }
    } catch (error) {
        console.error("❌ Error upserting homepage data:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
});

// --------------------------------------------------------------------
// Delete HomePageData
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/homepage/{id}:
 *   delete:
 *     summary: Delete homepage data by ID
 *     tags: [HomePageData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HomePageData ID
 *     responses:
 *       200:
 *         description: Homepage data deleted successfully
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
 *                   example: Homepage data deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Homepage data not found
 *       500:
 *         description: Server Error
 */
router.delete("/:id", protect, cleanupImages(HomePageData),async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        const deleted = await HomePageData.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Homepage data not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Homepage data deleted successfully"
        });
    } catch (error) {
        console.error("❌ Error deleting homepage data:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

module.exports = router;