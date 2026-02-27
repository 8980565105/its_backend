const express = require('express');
const router = express.Router();
const ExpertiseIndustries = require('../models/expertiseIndustries');
const { protect } = require('../middlewares/auth');
const cleanupImages = require('../middlewares/cleanupImages');
const cleanupOldImages = require('../middlewares/cleanupOldImages');

/**
 * @swagger
 * tags:
 *   name: ExpertiseIndustries
 *   description: API for managing expertise industries
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ExpertiseIndustries:
 *       type: object
 *       required:
 *         - title
 *         - image
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *           example: Healthcare
 *         image:
 *           type: string
 *           example: https://example.com/healthcare.png
 */

// ----------------- CREATE -----------------
/**
 * @swagger
 * /api/expertise-industries:
 *   post:
 *     summary: Create a new expertise industry
 *     tags: [ExpertiseIndustries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpertiseIndustries'
 *     responses:
 *       201:
 *         description: Expertise industry created successfully
 *       400:
 *         description: Missing fields or duplicate title
 *       500:
 *         description: Error creating expertise industry
 */
router.post('/', protect, async (req, res) => {
  try {
    const { title, image } = req.body;
    if (!title || !image) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (title, image)',
      });
    }

    const existingExpertise = await ExpertiseIndustries.findOne({ title });
    if (existingExpertise) {
      return res.status(400).json({
        success: false,
        message: 'Expertise already exists',
      });
    }

    const expertise = new ExpertiseIndustries({ title, image });
    await expertise.save();

    res.status(201).json({
      success: true,
      message: 'Expertise created successfully',
      data: expertise,
    });
  } catch (error) {
    console.error('Error creating expertise:', error);
    res.status(500).json({ success: false, message: 'Error creating expertise' });
  }
});

// ----------------- GET (Admin - Paginated + Search) -----------------
/**
 * @swagger
 * /api/expertise-industries/admin:
 *   get:
 *     summary: Get all expertise industries (admin - paginated + search)
 *     tags: [ExpertiseIndustries]
 *     security:
 *       - bearerAuth: []
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
 *         name: value
 *         schema:
 *           type: string
 *         description: Search text for title field
 *     responses:
 *       200:
 *         description: List of expertise industries with pagination
 *       500:
 *         description: Error fetching expertise industries
 */
router.get('/admin', async (req, res) => {
  try {
    const { page = 1, limit = 10, value = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (value) {
      query = { title: { $regex: value, $options: 'i' } };
    }

    const [expertise, count] = await Promise.all([
      ExpertiseIndustries.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ExpertiseIndustries.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: expertise,
      pagination: {
        current: Number(page),
        pages: Math.ceil(count / limit),
        total: count,
      },
    });
  } catch (error) {
    console.error('Error fetching expertise:', error);
    res.status(500).json({ success: false, message: 'Error fetching expertise' });
  }
});

// ----------------- GET (Public) -----------------
/**
 * @swagger
 * /api/expertise-industries:
 *   get:
 *     summary: Get all expertise industries (public)
 *     tags: [ExpertiseIndustries]
 *     responses:
 *       200:
 *         description: List of all expertise industries
 *       404:
 *         description: No expertise industries found
 *       500:
 *         description: Error fetching expertise industries
 */
router.get('/', async (req, res) => {
  try {
    const expertise = await ExpertiseIndustries.find();
    if (!expertise || expertise.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expertise not found',
      });
    }
    res.status(200).json({
      success: true,
      data: expertise,
    });
  } catch (error) {
    console.error('Error to get expertise', error);
    res.status(500).json({ success: false, message: 'Error to get expertise' });
  }
});

// ----------------- UPDATE -----------------
/**
 * @swagger
 * /api/expertise-industries/{id}:
 *   put:
 *     summary: Update an expertise industry by ID
 *     tags: [ExpertiseIndustries]
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
 *             $ref: '#/components/schemas/ExpertiseIndustries'
 *     responses:
 *       200:
 *         description: Expertise industry updated successfully
 *       400:
 *         description: Missing fields or duplicate title
 *       404:
 *         description: Expertise industry not found
 *       500:
 *         description: Error updating expertise industry
 */
router.put('/:id', protect,cleanupOldImages(ExpertiseIndustries,"ExpertiseIndustry"), async (req, res) => {
  try {
    const { title, image } = req.body;
    const id = req.params.id;

    if (!title || !image) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (title, image)',
      });
    }

    const existingExpertise = await ExpertiseIndustries.findById(id);
    if (!existingExpertise) {
      return res.status(404).json({
        success: false,
        message: 'Expertise not found',
      });
    }

    const existingTitle = await ExpertiseIndustries.findOne({ title });
    if (existingTitle && existingTitle._id.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: 'Title already exists',
      });
    }

    existingExpertise.title = title;
    existingExpertise.image = image;
    await existingExpertise.save();

    res.status(200).json({
      success: true,
      message: 'Expertise updated successfully',
      data: existingExpertise,
    });
  } catch (error) {
    console.error('Error updating expertise:', error);
    res.status(500).json({ success: false, message: 'Error updating expertise' });
  }
});

// ----------------- DELETE -----------------
/**
 * @swagger
 * /api/expertise-industries/{id}:
 *   delete:
 *     summary: Delete an expertise industry by ID
 *     tags: [ExpertiseIndustries]
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
 *         description: Expertise industry deleted successfully
 *       404:
 *         description: Expertise industry not found
 *       500:
 *         description: Error deleting expertise industry
 */
router.delete('/:id', protect, cleanupImages(ExpertiseIndustries), async (req, res) => {
  try {
    const id = req.params.id;
    const expertise = await ExpertiseIndustries.findById(id);
    if (!expertise) {
      return res.status(404).json({
        success: false,
        message: 'Expertise not found',
      });
    }

    await ExpertiseIndustries.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Expertise deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expertise:', error);
    res.status(500).json({ success: false, message: 'Error deleting expertise' });
  }
});

module.exports = router;
