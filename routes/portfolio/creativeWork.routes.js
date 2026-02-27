const express = require('express');
const CreativeWork = require('../../models/portfolio/creativeWork');
const { protect } = require('../../middlewares/auth');
const cleanupImages = require('../../middlewares/cleanupImages');
const cleanupOldImages = require('../../middlewares/cleanupOldImages');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: CreativeWork
 *   description: API for managing portfolio creative works
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreativeWork:
 *       type: object
 *       required:
 *         - category
 *         - title
 *         - image
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         category:
 *           type: string
 *           example: Web Design
 *         title:
 *           type: string
 *           example: Corporate Website Project
 *         url:
 *           type: string
 *           example: https://example.com/project
 *         image:
 *           type: string
 *           example: https://example.com/image.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/creative-work:
 *   post:
 *     summary: Create a new creative work
 *     tags: [CreativeWork]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreativeWork'
 *     responses:
 *       201:
 *         description: Creative work created successfully
 *       400:
 *         description: All required fields are missing
 *       500:
 *         description: Server error
 */
router.post('/', protect, async (req, res) => {
    try {
        const { category, title, url, image } = req.body;
        if (!category || !title || !image) {
            return res.status(400).json({
                success: false,
                message: 'Category, title, and image are required',
            });
        }

        const creativeWork = new CreativeWork({
            category,
            title,
            url,
            image,
        });

        await creativeWork.save();

        res.status(201).json({
            success: true,
            message: 'Creative work saved successfully',
        });

    } catch (error) {
        console.error('❌ Error saving creative work:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

/**
 * @swagger
 * /api/creative-work:
 *   get:
 *     summary: Get all creative works (with pagination, category filter, and search)
 *     tags: [CreativeWork]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter creative works by category
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Search creative works by title (case-insensitive)
 *     responses:
 *       200:
 *         description: List of creative works with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CreativeWork'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                     total:
 *                       type: integer
 *                       example: 42
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category || '';
        const value = req.query.value || '';

        const skip = (page - 1) * limit;

        let query = {};
        if (category) {
            query.category = category;
        }
        if (value) {
            query.title = { $regex: value, $options: 'i' };
        }

        const [creativeWorks, total] = await Promise.all([
            CreativeWork.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CreativeWork.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: creativeWorks,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });

    } catch (error) {
        console.error('❌ Error fetching creative works:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});



/**
 * @swagger
 * /api/creative-work/{id}:
 *   put:
 *     summary: Update a creative work by ID
 *     tags: [CreativeWork]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Creative work ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreativeWork'
 *     responses:
 *       200:
 *         description: Creative work updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Creative work not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect,cleanupOldImages(CreativeWork, "CreativeWork"), async (req, res) => {
    try {
        const { category, title, url, image } = req.body;
        if (!category || !title || !image) {
            return res.status(400).json({
                success: false,
                message: 'Category, title, and image are required',
            });
        }

        const creativeWork = await CreativeWork.findById(req.params.id);
        if (!creativeWork) {
            return res.status(404).json({
                success: false,
                message: 'Creative work not found',
            });
        }

        const updatedCreativeWork = await CreativeWork.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Creative work updated successfully',
            data: updatedCreativeWork,
        });

    } catch (error) {
        console.error('❌ Error updating creative work:', error)
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});


/**
 * @swagger
 * /api/creative-work/{id}:
 *   delete:
 *     summary: Delete a creative work by ID
 *     tags: [CreativeWork]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Creative work ID
 *     responses:
 *       200:
 *         description: Creative work deleted successfully
 *       404:
 *         description: Creative work not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect,cleanupImages(CreativeWork), async (req, res) => {
    try {
        const creativeWork = await CreativeWork.findById(req.params.id);
        if (!creativeWork) {
            return res.status(404).json({
                success: false,
                message: 'Creative work not found',
            });
        }

        await CreativeWork.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Creative work deleted successfully',
        });
    } catch (error) {
        console.error('❌ Error deleting creative work:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

module.exports = router;
