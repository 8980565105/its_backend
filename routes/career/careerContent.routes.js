const express = require("express");
const router = express.Router();
const CareerContent = require("../../models/career/careerContent");
const { protect } = require("../../middlewares/auth");
const cleanupImages = require("../../middlewares/cleanupImages");
const cleanupOldImages = require("../../middlewares/cleanupOldImages");

/**
 * @swagger
 * tags:
 *   name: CareerContent
 *   description: API for managing career page content
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HeroSection:
 *       type: object
 *       required: [image, title, description]
 *       properties:
 *         image:
 *           type: string
 *           example: https://example.com/hero.png
 *         title:
 *           type: string
 *           example: Start Your Career With Us
 *         description:
 *           type: string
 *           example: Join our team and grow your career.
 *
 *     CareerAtIts:
 *       type: object
 *       required: [title, image, points]
 *       properties:
 *         title:
 *           type: string
 *           example: Why work with ITS?
 *         image:
 *           type: string
 *           example: https://example.com/career.png
 *         points:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Growth opportunities", "Friendly culture"]
 *
 *     WhyJoinIts:
 *       type: object
 *       required: [title, points]
 *       properties:
 *         title:
 *           type: string
 *           example: Why Join ITS
 *         points:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Flexible Work
 *               description:
 *                 type: string
 *                 example: Work from anywhere with flexible hours.
 *               image:
 *                 type: string
 *                 example: https://example.com/flex.png
 *
 *     CareerContent:
 *       type: object
 *       required: [heroSection, careerAtIts, whyJoinIts]
 *       properties:
 *         id:
 *           type: string
 *         heroSection:
 *           $ref: '#/components/schemas/HeroSection'
 *         careerAtIts:
 *           $ref: '#/components/schemas/CareerAtIts'
 *         whyJoinIts:
 *           $ref: '#/components/schemas/WhyJoinIts'
 */

/**
 * @swagger
 * /api/career-content:
 *   post:
 *     summary: Create new career content
 *     tags: [CareerContent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CareerContent'
 *     responses:
 *       201:
 *         description: Career content created
 *       400:
 *         description: Already exists or missing fields
 *       500:
 *         description: Server error
 */
router.post("/", protect, async (req, res) => {
    try {
        const { heroSection, careerAtIts, whyJoinIts } = req.body;

        if (!heroSection || !careerAtIts || !whyJoinIts) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // allow only one career content
        const existing = await CareerContent.findOne();
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Career content already exists. Use PUT to update.",
            });
        }

        const newCareerContent = new CareerContent({
            heroSection,
            careerAtIts,
            whyJoinIts,
        });
        await newCareerContent.save();

        res.status(201).json({
            success: true,
            message: "Career content saved successfully",
            data: newCareerContent,
        });
    } catch (error) {
        console.error("Error saving career content:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @swagger
 * /api/career-content:
 *   get:
 *     summary: Get career content
 *     tags: [CareerContent]
 *     responses:
 *       200:
 *         description: Career content fetched successfully
 *       404:
 *         description: No content found
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
    try {
        const careerContent = await CareerContent.findOne();
        if (!careerContent) {
            return res.status(404).json({
                success: false,
                message: "Career content not found",
            });
        }
        res.status(200).json({
            success: true,
            data: careerContent,
        });
    } catch (error) {
        console.error("Error fetching career content:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @swagger
 * /api/career-content/{id}:
 *   put:
 *     summary: Update career content by ID
 *     tags: [CareerContent]
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
 *             $ref: '#/components/schemas/CareerContent'
 *     responses:
 *       200:
 *         description: Career content updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put("/:id", protect, cleanupOldImages(CareerContent,"CareerContent"), async (req, res) => {
    try {
        const id = req.params.id;
        const { heroSection, careerAtIts, whyJoinIts } = req.body;

        const careerContent = await CareerContent.findById(id);
        if (!careerContent) {
            return res.status(404).json({
                success: false,
                message: "Career content not found",
            });  
        }

        if (heroSection) careerContent.heroSection = heroSection;
        if (careerAtIts) careerContent.careerAtIts = careerAtIts;
        if (whyJoinIts) careerContent.whyJoinIts = whyJoinIts;

        await careerContent.save();
        res.status(200).json({
            success: true,
            message: "Career content updated successfully",
            data: careerContent,
        });
    } catch (error) {
        console.error("Error updating career content:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @swagger
 * /api/career-content/{id}:
 *   delete:
 *     summary: Delete career content by ID
 *     tags: [CareerContent]
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
 *         description: Career content deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", protect, cleanupImages(CareerContent),async (req, res) => {
    try {
        const id = req.params.id;
        const careerContent = await CareerContent.findByIdAndDelete(id);
        if (!careerContent) {
            return res.status(404).json({
                success: false,
                message: "Career content not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Career content deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting career content:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
