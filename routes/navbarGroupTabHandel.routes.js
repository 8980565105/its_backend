const express = require('express');
const mongoose = require('mongoose');
const NavbarGroupTabImageManage = require('../models/navbarGroupTabImage');
const { protect } = require('../middlewares/auth'); 
const cleanupImages = require('../middlewares/cleanupImages');
const cleanupOldImages = require('../middlewares/cleanupOldImages');


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: NavbarGroupTabImageManage
 *   description: API for managing navbar group tab images
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NavbarGroupTabImageManage:
 *       type: object
 *       required:
 *         - image
 *         - linkedType
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         image:
 *           type: string
 *           example: https://example.com/nav-image.png
 *         linkedType:
 *           type: string
 *           enum: [service, hire]
 *           example: service
 *         linkedService:
 *           type: string
 *           nullable: true
 *           description: ObjectId reference to Service model
 *         linkedHirePage:
 *           type: string
 *           nullable: true
 *           description: ObjectId reference to HirePageData model
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/navbar-group-tab-image-manage:
 *   post:
 *     summary: Create a new navbar group tab image
 *     tags: [NavbarGroupTabImageManage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NavbarGroupTabImageManage'
 *     responses:
 *       201:
 *         description: Navbar group tab image created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', protect, async (req, res) => {
    try {
        const { image, linkedType, linkedService, linkedHirePage } = req.body;

        // --- FIX START ---
        // Conditionally build the object to avoid saving null values
        const dataToSave = { image, linkedType };

        if (linkedType === 'service' && linkedService) {
            dataToSave.linkedService = linkedService;
        } else if (linkedType === 'hire' && linkedHirePage) {
            dataToSave.linkedHirePage = linkedHirePage;
        } else {
            // This happens if the user selects "service" but doesn't choose a page.
            return res.status(400).json({ success: false, message: 'A specific page must be selected to create a link.' });
        }
        // --- FIX END ---

        const newImage = new NavbarGroupTabImageManage(dataToSave);
        await newImage.save();

        res.status(201).json({
            success: true,
            message: 'Navbar group tab image created successfully',
            data: newImage,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'An icon is already linked to this specific page.' });
        }
        console.error('❌ Error creating navbar group tab image:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

/**
 * @swagger
 * /api/navbar-group-tab-image-manage:
 *   get:
 *     summary: Get all navbar group tab images with pagination
 *     tags: [NavbarGroupTabImageManage]
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
 *         description: Paginated navbar group tab images retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [total, images] = await Promise.all([
            NavbarGroupTabImageManage.countDocuments(),
            NavbarGroupTabImageManage.find()
                .populate('linkedService', 'category subCategory')
                .populate('linkedHirePage', 'category subCategory')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            data: images,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('❌ Error fetching navbar group tab images:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

/**
 * @swagger
 * /api/navbar-group-tab-image-manage/{id}:
 *   get:
 *     summary: Get navbar group tab image by ID
 *     tags: [NavbarGroupTabImageManage]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Navbar group tab image retrieved successfully
 *       404:
 *         description: Navbar group tab image not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid ID' });
        }

        const image = await NavbarGroupTabImageManage.findById(id)
            .populate('linkedService', 'category subCategory')
            .populate('linkedHirePage', 'category subCategory')
            .lean();

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Navbar group tab image not found',
            });
        }

        res.status(200).json({
            success: true,
            data: image,
        });
    } catch (error) {
        console.error('❌ Error fetching navbar group tab image:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

/**
 * @swagger
 * /api/navbar-group-tab-image-manage/{id}:
 *   put:
 *     summary: Update navbar group tab image by ID
 *     tags: [NavbarGroupTabImageManage]
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
 *             $ref: '#/components/schemas/NavbarGroupTabImageManage'
 *     responses:
 *       200:
 *         description: Navbar group tab image updated successfully
 *       404:
 *         description: Navbar group tab image not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect,cleanupOldImages(NavbarGroupTabImageManage,"NavbarGroupTabImageManage"), async (req, res) => {
    try {
        const { id } = req.params;
        const { image, linkedType, linkedService, linkedHirePage } = req.body;

        // --- FIX START ---
        // Build the update object and explicitly unset the unused field
        const updates = { image, linkedType };

        if (linkedType === 'service' && linkedService) {
            updates.linkedService = linkedService;
            updates.$unset = { linkedHirePage: 1 }; // Removes the other field from the document
        } else if (linkedType === 'hire' && linkedHirePage) {
            updates.linkedHirePage = linkedHirePage;
            updates.$unset = { linkedService: 1 }; // Removes the other field
        } else {
            return res.status(400).json({ success: false, message: 'A specific page must be selected.' });
        }
        // --- FIX END ---

        const updatedImage = await NavbarGroupTabImageManage.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedImage) {
            return res.status(404).json({
                success: false,
                message: 'Navbar group tab image not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Navbar group tab image updated successfully',
            data: updatedImage,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'An icon is already linked to this specific page.' });
        }
        console.error('❌ Error updating navbar group tab image:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});


/**
 * @swagger
 * /api/navbar-group-tab-image-manage/{id}:
 *   delete:
 *     summary: Delete navbar group tab image by ID and remove its image from storage
 *     tags: [NavbarGroupTabImageManage]
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
 *         description: Navbar group tab image deleted successfully
 *       404:
 *         description: Navbar group tab image not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, cleanupImages(NavbarGroupTabImageManage), async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await NavbarGroupTabImageManage.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Navbar group tab image not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Navbar group tab image deleted successfully',
        });
    } catch (error) {
        console.error('❌ Error deleting navbar group tab image:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

module.exports = router;
