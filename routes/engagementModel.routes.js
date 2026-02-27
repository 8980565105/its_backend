const express = require('express');
const EngagementModel = require('../models/engagementModel');
const { protect } = require('../middlewares/auth');
const cleanupImages = require('../middlewares/cleanupImages');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EngagementModel
 *   description: API for managing engagement models
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EngagementModel:
 *       type: object
 *       required:
 *         - modelTitle
 *         - modelDescription
 *         - modelImage
 *         - keyPoints
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         modelTitle:
 *           type: string
 *           example: Dedicated Team
 *         modelDescription:
 *           type: string
 *           example: We provide a dedicated team for your projects with full support.
 *         modelImage:
 *           type: string
 *           example: https://example.com/image.jpg
 *         keyPoints:
 *           type: array
 *           items:
 *             type: string
 *           example: ["High commitment", "Expert team"]
 *         supportModel:
 *           type: string
 *           example: 24x7 chat support
 */

/**
 * @swagger
 * /api/engagement-model:
 *   post:
 *     summary: Create a new engagement model
 *     tags: [EngagementModel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EngagementModel'
 *     responses:
 *       201:
 *         description: Engagement model created successfully
 *       400:
 *         description: Missing required fields or duplicate title
 *       500:
 *         description: Server error
 */
router.post('/', protect, async (req, res) => {
    try {
        const { modelTitle, modelDescription, modelImage, keyPoints, supportModel } = req.body;

        const checkTitle = await EngagementModel.findOne({ modelTitle });
        if (checkTitle) {
            return res.status(400).json({
                success: false,
                message: "Model Title already exists",
            });
        }

        const engagementModel = new EngagementModel({
            modelTitle,
            modelDescription,
            modelImage: modelImage || '',
            keyPoints,
            supportModel: supportModel || "24x7 chat support",
        });

        const result = await engagementModel.save();
        res.status(201).json({
            success: true,
            message: "Model Data saved successfully",
            result
        });
    } catch (error) {
        console.error("Error to store the data", error);
        res.status(500).json({
            success: false,
            message: "Error to store the data",
        });
    }
});

/**
 * @swagger
 * /api/engagement-model:
 *   get:
 *     summary: Get all engagement models
 *     tags: [EngagementModel]
 *     responses:
 *       200:
 *         description: List of engagement models
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const engagementModels = await EngagementModel.find();
        res.status(200).json({
            success: true,
            message: "Model Data fetched successfully",
            data: engagementModels
        });
    } catch (error) {
        console.error("Error to fetch the data", error);
        res.status(500).json({
            success: false,
            message: "Error to fetch the data",
        });
    }
});

/**
 * @swagger
 * /api/engagement-model/{id}:
 *   put:
 *     summary: Update an engagement model by ID
 *     tags: [EngagementModel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Engagement model ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EngagementModel'
 *     responses:
 *       200:
 *         description: Engagement model updated successfully
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect,cleanupImages(EngagementModel,"EngagementModel"), async (req, res) => {
    try {
        const { modelTitle, modelDescription, modelImage, keyPoints, supportModel } = req.body;

        const engagementModel = await EngagementModel.findById(req.params.id);
        if (!engagementModel) {
            return res.status(404).json({
                success: false,
                message: "Model Data not found",
            });
        }

        engagementModel.modelTitle = modelTitle;
        engagementModel.modelDescription = modelDescription;
        engagementModel.modelImage = modelImage;
        engagementModel.keyPoints = keyPoints;
        engagementModel.supportModel = supportModel;
        engagementModel.updatedAt = Date.now();

        await engagementModel.save();

        res.status(200).json({
            success: true,
            message: "Model Data updated successfully",
            data: engagementModel
        });
    } catch (error) {
        console.error("Error to update the data", error);
        res.status(500).json({
            success: false,
            message: "Error to update the data",
        });
    }
});

/**
 * @swagger
 * /api/engagement-model/{id}:
 *   delete:
 *     summary: Delete an engagement model by ID
 *     tags: [EngagementModel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Engagement model ID
 *     responses:
 *       200:
 *         description: Model deleted successfully
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, cleanupImages(EngagementModel),async (req, res) => {
    try {
        const engagementModel = await EngagementModel.findById(req.params.id);
        if (!engagementModel) {
            return res.status(404).json({
                success: false,
                message: "Model Data not found",
            });
        }

        await EngagementModel.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Model Data deleted successfully",
        });
    } catch (error) {
        console.error("Error to delete the data", error);
        res.status(500).json({
            success: false,
            message: "Error to delete the data",
        });
    }
});

module.exports = router;
