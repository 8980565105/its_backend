const express = require("express");
const PortfolioContent = require("../../models/portfolio/portfolioContent");
const { protect } = require("../../middlewares/auth");
const cleanupImages = require("../../middlewares/cleanupImages");
const cleanupOldImages = require("../../middlewares/cleanupOldImages");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PortfolioContent
 *   description: API for managing portfolio page content
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Point:
 *       type: object
 *       required:
 *         - label
 *         - image
 *       properties:
 *         label:
 *           type: string
 *           example: Innovative Solutions
 *         image:
 *           type: string
 *           example: https://example.com/point-icon.png
 *     HeroSection:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - image
 *       properties:
 *         title:
 *           type: string
 *           example: Our Portfolio
 *         description:
 *           type: string
 *           example: Explore our work and successful case studies
 *         image:
 *           type: string
 *           example: https://example.com/hero-image.png
 *         points:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Point'
 *     PortfolioContent:
 *       type: object
 *       required:
 *         - heroSection
 *       properties:
 *         id:
 *           type: string
 *         heroSection:
 *           $ref: '#/components/schemas/HeroSection'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/portfolio-content:
 *   post:
 *     summary: Create portfolio content
 *     tags: [PortfolioContent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortfolioContent'
 *     responses:
 *       201:
 *         description: Portfolio content created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Server error
 */
router.post("/", protect, async (req, res) => {
    try {
        const { heroSection } = req.body;
        if (
            !heroSection ||
            !heroSection.title ||
            !heroSection.description ||
            !heroSection.image
        ) {
            return res
                .status(400)
                .json({ success: false, message: "Hero section fields are required" });
        }

        const portfolioContent = new PortfolioContent({ heroSection });
        await portfolioContent.save();

        res
            .status(201)
            .json({
                success: true,
                message: "Portfolio content created successfully",
                data: portfolioContent,
            });
    } catch (error) {
        console.error("❌ Error creating portfolio content:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @swagger
 * /api/portfolio-content:
 *   get:
 *     summary: Get portfolio content
 *     tags: [PortfolioContent]
 *     responses:
 *       200:
 *         description: Portfolio content retrieved successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
    try {
        const content = await PortfolioContent.findOne().sort({ createdAt: -1 }); // latest content
        if (!content) {
            return res
                .status(404)
                .json({ success: false, message: "Portfolio content not found" });
        }
        res.status(200).json({ success: true, data: content });
    } catch (error) {
        console.error("❌ Error fetching portfolio content:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @swagger
 * /api/portfolio-content/{id}:
 *   put:
 *     summary: Update portfolio content
 *     tags: [PortfolioContent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PortfolioContent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortfolioContent'
 *     responses:
 *       200:
 *         description: Portfolio content updated successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put("/:id", protect,cleanupOldImages(PortfolioContent,"PortfolioContent"), async (req, res) => {
    try {
        const content = await PortfolioContent.findById(req.params.id);
        if (!content) {
            return res
                .status(404)
                .json({ success: false, message: "Portfolio content not found" });
        }

        const updatedContent = await PortfolioContent.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res
            .status(200)
            .json({
                success: true,
                message: "Portfolio content updated successfully",
                data: updatedContent,
            });
    } catch (error) {
        console.error("❌ Error updating portfolio content:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @swagger
 * /api/portfolio-content/{id}:
 *   delete:
 *     summary: Delete portfolio content
 *     tags: [PortfolioContent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PortfolioContent ID
 *     responses:
 *       200:
 *         description: Portfolio content deleted successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", protect, cleanupImages(PortfolioContent), async (req, res) => {
    try {
        const content = await PortfolioContent.findById(req.params.id);
        if (!content) {
            return res
                .status(404)
                .json({ success: false, message: "Portfolio content not found" });
        }

        await PortfolioContent.findByIdAndDelete(req.params.id);
        res
            .status(200)
            .json({
                success: true,
                message: "Portfolio content deleted successfully",
            });
    } catch (error) {
        console.error("❌ Error deleting portfolio content:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
