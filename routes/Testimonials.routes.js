const express = require('express');
const Testimonials = require('../models/testimonials');
const { protect } = require('../middlewares/auth');  
const cleanupImages = require('../middlewares/cleanupImages');
const cleanupOldImages = require('../middlewares/cleanupOldImages');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: API for managing testimonials
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Testimonial:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           example: John Doe
 *         image:
 *           type: string
 *           example: https://example.com/image.jpg
 *         location:
 *           type: string
 *           example: New York, USA
 *         description:
 *           type: string
 *           example: This service is amazing!
 */

/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create a new testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Testimonial'
 *     responses:
 *       201:
 *         description: Testimonial created successfully
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
 *                   example: Testimonials saved successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', protect, async (req, res) => {
    try {
        const { name, image, location, description } = req.body;
        if (!name || !location || !description) {
            return res.status(400).json({
                success: false,
                message: 'name, image, location, description are required',
            });
        }
        const testimonials = new Testimonials({
            name,
            image: image || '',
            location,
            description
        });
        await testimonials.save();
        res.status(201).json({
            success: true,
            message: 'Testimonials saved successfully',
        });
    } catch (error) {
        console.error("Error to save testimonials : ", error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get all testimonials with pagination
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of testimonials with pagination
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
 *                     $ref: '#/components/schemas/Testimonial'
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
 *                       example: 15
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 3 } = req.query;
        const skip = (page - 1) * limit;

        const [testimonials, count] = await Promise.all([
            Testimonials.find()
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Testimonials.countDocuments()
        ])

        res.status(200).json({
            success: true,
            data: testimonials,
            pagination: {
                current: Number(page),
                pages: Math.ceil(count / limit),
                total: count
            }
        })

        // const testimonials = await Testimonials.find().sort({ createdAt: -1 });
        // res.status(200).json({
        //     success: true,
        //     testimonials
        // });
    } catch (error) {
        console.error("Error to get testimonials : ", error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

/**
 * @swagger
 * /api/testimonials/{id}:
 *   put:
 *     summary: Update a testimonial by ID
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Testimonial'
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
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
 *                   example: Testimonial updated successfully
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, cleanupOldImages(Testimonials,"Testimonial"), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, image, location, description } = req.body;
        const testimonial = await Testimonials.findById(id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found',
            });
        }
        testimonial.name = name;
        testimonial.image = image;
        testimonial.location = location;
        testimonial.description = description;
        await testimonial.save();
        res.status(200).json({
            success: true,
            message: 'Testimonial updated successfully',
        });
    } catch (error) {
        console.error("Error to update testimonials : ", error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial by ID
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial deleted successfully
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
 *                   example: Testimonial deleted successfully
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, cleanupImages(Testimonials), async (req, res) => {
    try {
        const id = req.params.id;
        const testimonial = await Testimonials.findById(id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found',
            });
        }
        await Testimonials.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Testimonial deleted successfully',
        });
    } catch (error) {
        console.error("Error to delete testimonials : ", error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

module.exports = router;
