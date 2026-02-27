const express = require('express');
const AboutUs = require('../../models/about-us/about-us');
const { protect } = require('../../middlewares/auth');
const cleanupOldImages = require('../../middlewares/cleanupOldImages');
const cleanupImages = require('../../middlewares/cleanupImages');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AboutUs
 *   description: API for managing About Us content
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HeroSection:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "About Our Company"
 *         description:
 *           type: string
 *           example: "We are a leading technology company..."
 *         image:
 *           type: string
 *           example: https://example.com/hero-image.jpg
 *         points:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "Innovation"
 *               image:
 *                 type: string
 *                 example: https://example.com/innovation-icon.jpg
 *
 *     WhoWeAre:
 *       type: object
 *       properties:
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           example: ["We are a leading IT solutions company", "We value innovation and quality"]
 *         image:
 *           type: string
 *           example: https://example.com/who-we-are.jpg
 *
 *     Goals:
 *       type: object
 *       properties:
 *         missionTitle:
 *           type: string
 *           example: Our Mission
 *         missionDescription:
 *           type: string
 *           example: To deliver innovative solutions
 *         missionImage:
 *           type: string
 *           example: https://example.com/mission.jpg
 *         visionTitle:
 *           type: string
 *           example: Our Vision
 *         visionDescription:
 *           type: string
 *           example: To be a global leader in IT services
 *         visionImage:
 *           type: string
 *           example: https://example.com/vision.jpg
 *         valuesTitle:
 *           type: string
 *           example: Our Values
 *         valuesDescription:
 *           type: string
 *           example: Integrity, Commitment, Excellence
 *         valuesImage:
 *           type: string
 *           example: https://example.com/values.jpg
 *
 *     AboutUs:
 *       type: object
 *       required:
 *         - heroSection
 *         - whoWeAre
 *         - goals
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         heroSection:
 *           $ref: '#/components/schemas/HeroSection'
 *         whoWeAre:
 *           $ref: '#/components/schemas/WhoWeAre'
 *         goals:
 *           $ref: '#/components/schemas/Goals'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/about-us:
 *   post:
 *     summary: Create About Us content
 *     tags: [AboutUs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AboutUs'
 *     responses:
 *       201:
 *         description: About Us created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get the About Us content
 *     tags: [AboutUs]
 *     responses:
 *       200:
 *         description: About Us content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AboutUs'
 *       404:
 *         description: About Us not found
 *       500:
 *         description: Server error
 */
router.post('/', protect, async (req, res) => {
    try {
        const { heroSection, whoWeAre, goals } = req.body;

        // Validate required fields based on your schema requirements
        if (!heroSection || !whoWeAre || !goals) {
            return res.status(400).json({
                success: false,
                message: "heroSection, whoWeAre, and goals are required"
            });
        }

        // Validate heroSection required fields
        if (!heroSection.title || !heroSection.description || !heroSection.image || !heroSection.points) {
            return res.status(400).json({
                success: false,
                message: "heroSection title, description, image, and points are required"
            });
        }

        // Validate points array
        if (!Array.isArray(heroSection.points) || heroSection.points.length === 0) {
            return res.status(400).json({
                success: false,
                message: "heroSection points must be a non-empty array"
            });
        }

        // Validate each point
        for (let point of heroSection.points) {
            if (!point.label || !point.image) {
                return res.status(400).json({
                    success: false,
                    message: "Each point must have label and image"
                });
            }
        }

        const aboutUs = new AboutUs({ heroSection, whoWeAre, goals });
        await aboutUs.save();

        res.status(201).json({
            success: true,
            message: "About Us created successfully",
            data: aboutUs
        });

    } catch (error) {
        console.error("❌ Error creating AboutUs:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * Get About Us (public)
 */
router.get('/', async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne().sort({ createdAt: -1 }).lean();
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us not found" });
        }
        res.status(200).json({ success: true, data: aboutUs });
    } catch (error) {
        console.error("❌ Error fetching AboutUs:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * @swagger
 * /api/about-us/{id}:
 *   put:
 *     summary: Update About Us content by ID
 *     tags: [AboutUs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: AboutUs ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AboutUs'
 *     responses:
 *       200:
 *         description: About Us updated successfully
 *       404:
 *         description: About Us not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete About Us content by ID
 *     tags: [AboutUs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: AboutUs ID
 *     responses:
 *       200:
 *         description: About Us deleted successfully
 *       404:
 *         description: About Us not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, cleanupOldImages(AboutUs, "AboutUs"), async (req, res) => {
    try {
        const { heroSection, whoWeAre, goals } = req.body;

        const updatedAboutUs = await AboutUs.findByIdAndUpdate(
            req.params.id,
            { heroSection, whoWeAre, goals },
            { new: true, runValidators: true }
        );

        if (!updatedAboutUs) {
            return res.status(404).json({ success: false, message: "About Us not found" });
        }

        res.status(200).json({
            success: true,
            message: "About Us updated successfully",
            data: updatedAboutUs
        });

    } catch (error) {
        console.error("❌ Error updating AboutUs:", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * Delete About Us (admin only)
 */
router.delete('/:id', protect, cleanupImages(AboutUs),async (req, res) => {
    try {
        const aboutUs = await AboutUs.findById(req.params.id);
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us not found" });
        }

        await AboutUs.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "About Us deleted successfully" });

    } catch (error) {
        console.error("❌ Error deleting AboutUs:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;