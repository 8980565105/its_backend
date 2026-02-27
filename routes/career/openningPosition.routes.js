const express = require('express');
const OpenningPosition = require('../../models/career/openningPosition');
const router = express.Router();
const { protect } = require('../../middlewares/auth');
const ApplyPosition = require('../../models/career/applyForPosition'); 
const cleanupImages = require('../../middlewares/cleanupImages');
const cleanupOldImages = require('../../middlewares/cleanupOldImages');

/**
 * @swagger
 * tags:
 *   name: OpenningPosition
 *   description: API for managing job openings
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OpenningPosition:
 *       type: object
 *       required:
 *         - name
 *         - image
 *         - openning
 *         - qualifications
 *         - experience
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           example: Software Engineer
 *         image:
 *           type: string
 *           example: https://example.com/job-image.png
 *         openning:
 *           type: string
 *           example: 5
 *         qualifications:
 *           type: string
 *           example: Bachelor's degree in Computer Science
 *         experience:
 *           type: string
 *           example: 2+ years of software development
 */

/**
 * @swagger
 * /api/opennig-position:
 *   post:
 *     summary: Create a new job opening
 *     tags: [OpenningPosition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpenningPosition'
 *     responses:
 *       201:
 *         description: Job opening created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', protect, async (req, res) => {
    try {
        const { name, image, openning, qualifications, experience } = req.body;
        if (!name || !image || !openning || !qualifications || !experience) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all fields',
            });
        }
        const openningPosition = new OpenningPosition({
            name,
            image,
            openning,
            qualifications,
            experience
        });
        const savedOpenningPosition = await openningPosition.save();
        if (!savedOpenningPosition) {
            return res.status(400).json({
                success: false,
                message: 'Failed to save OpenningPosition',
            });
        }
        res.status(201).json({
            success: true,
            message: 'OpenningPosition created successfully',
            data: savedOpenningPosition
        });
    } catch (error) {
        console.error("Error to store openning position", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

/**
 * @swagger
 * /api/opennig-position:
 *   get:
 *     summary: Get all job openings
 *     tags: [OpenningPosition]
 *     responses:
 *       200:
 *         description: List of job openings
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const openningPositions = await OpenningPosition.find().sort({ createdAt: -1 });
        if (!openningPositions) {
            return res.status(400).json({
                success: false,
                message: 'No OpenningPositions found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'OpenningPositions retrieved successfully',
            data: openningPositions
        });
    } catch (error) {
        console.error("Error to retrieve openning positions", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

/**
 * @swagger
 * /api/opennig-position/{id}:
 *   put:
 *     summary: Update a job opening by ID
 *     tags: [OpenningPosition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Job opening ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpenningPosition'
 *     responses:
 *       200:
 *         description: Job opening updated successfully
 *       404:
 *         description: OpenningPosition not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect,cleanupOldImages(OpenningPosition, "OpenningPosition"), async (req, res) => {
    try {
        const { name, image, openning, qualifications, experience } = req.body;
        if (!name || !image || !openning || !qualifications || !experience) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all fields',
            });
        }
        const openningPosition = await OpenningPosition.findById(req.params.id);
        if (!openningPosition) {
            return res.status(404).json({
                success: false,
                message: 'OpenningPosition not found',
            });
        }
        const updatedOpenningPosition = await OpenningPosition.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json({
            success: true,
            message: 'OpenningPosition updated successfully',
            data: updatedOpenningPosition
        });
    } catch (error) {
        console.error("Error to update openning position", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

/**
 * @swagger
 * /api/opennig-position/{id}:
 *   delete:
 *     summary: Delete a job opening by ID
 *     tags: [OpenningPosition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Job opening ID
 *     responses:
 *       200:
 *         description: Job opening deleted successfully
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
 *                   example: OpenningPosition deleted successfully
 *       400:
 *         description: Cannot delete because related applications exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Cannot delete this job opening because 3 application(s) exist. Remove related ApplyPosition records first.
 *       404:
 *         description: OpenningPosition not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: OpenningPosition not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server Error
 */

router.delete('/:id', protect, cleanupImages(OpenningPosition),async (req, res) => {
    try {
        const openningPosition = await OpenningPosition.findById(req.params.id);
        if (!openningPosition) {
            return res.status(404).json({
                success: false,
                message: 'OpenningPosition not found',
            });
        }

        const appliedCount = await ApplyPosition.countDocuments({ positionApplied: req.params.id })
        if (appliedCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete this job opening because ${appliedCount} application(s) exist. Remove related ApplyPosition records first.`,
            });
        }

        await OpenningPosition.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'OpenningPosition deleted successfully',
        });
    } catch (error) {
        console.error("Error to delete openning position", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

module.exports = router; 