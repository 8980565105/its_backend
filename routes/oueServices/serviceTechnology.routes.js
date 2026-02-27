const express = require('express');
const ServiceTechnologyList = require('../../models/ourServices/tecnologySection');
const router = express.Router();
const { protect } = require('../../middlewares/auth');
const cleanupImages = require('../../middlewares/cleanupImages');

/**
 * @swagger
 * tags:
 *   name: ServiceTechnology
 *   description: API for managing service technology list
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceTechnology:
 *       type: object
 *       required:
 *         - image
 *         - label
 *         - serviceId
 *       properties:
 *         id:
 *           type: string
 *         image:
 *           type: string
 *           example: https://example.com/react.png
 *         label:
 *           type: string
 *           example: React.js
 *         serviceId:
 *           type: string
 *           example: 64c12345aabbccddeeff0011
 */

// ----------------- CREATE -----------------
/**
 * @swagger
 * /api/service-technology:
 *   post:
 *     summary: Create a new service technology
 *     tags: [ServiceTechnology]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceTechnology'
 *     responses:
 *       201:
 *         description: Service technology created successfully
 *       400:
 *         description: Missing fields or duplicate label for service
 *       500:
 *         description: Error creating service technology
 */
router.post('/', protect, async (req, res) => {
  try {
    const { image, label, serviceId } = req.body;

    if (!image || !label || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (image, label, serviceId)',
      });
    }

    const existTechnology = await ServiceTechnologyList.findOne({ label, serviceId });
    if (existTechnology) {
      return res.status(400).json({
        success: false,
        message: 'Label already exists for this service',
      });
    }

    const serviceTech = new ServiceTechnologyList({ image, label, serviceId });
    await serviceTech.save();

    res.status(201).json({
      success: true,
      message: 'Service technology created successfully',
      data: serviceTech,
    });
  } catch (error) {
    console.error('Error creating service technology:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service technology',
    });
  }
});

// ----------------- GET ALL -----------------
/**
 * @swagger
 * /api/service-technology:
 *   get:
 *     summary: Get all service technologies (paginated + search)
 *     tags: [ServiceTechnology]
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
 *         description: Search text for label field
 *     responses:
 *       200:
 *         description: List of service technologies
 *       500:
 *         description: Error fetching service technologies
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, value = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (value) {
      query = {
        $or: [{ label: { $regex: value, $options: 'i' } }],
      };
    }

    const [services, count] = await Promise.all([
      ServiceTechnologyList.find(query)
        .populate('serviceId', 'mainTitle')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServiceTechnologyList.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: services,
      pagination: {
        current: Number(page),
        pages: Math.ceil(count / limit),
        total: count,
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
    });
  }
});

// ----------------- GET BY ID -----------------
/**
 * @swagger
 * /api/service-technology/{id}:
 *   get:
 *     summary: Get a single service technology by ID
 *     tags: [ServiceTechnology]
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
 *         description: Service technology details
 *       404:
 *         description: Service technology not found
 *       500:
 *         description: Error fetching service technology
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const serviceTech = await ServiceTechnologyList.findById(req.params.id)
      .populate('serviceId', 'name');

    if (!serviceTech) {
      return res.status(404).json({
        success: false,
        message: 'Service technology not found',
      });
    }

    res.status(200).json({
      success: true,
      data: serviceTech,
    });
  } catch (error) {
    console.error('Error fetching service technology:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service technology',
    });
  }
});

// ----------------- UPDATE -----------------
/**
 * @swagger
 * /api/service-technology/{id}:
 *   put:
 *     summary: Update a service technology by ID
 *     tags: [ServiceTechnology]
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
 *             $ref: '#/components/schemas/ServiceTechnology'
 *     responses:
 *       200:
 *         description: Service technology updated successfully
 *       400:
 *         description: Duplicate label for this service
 *       404:
 *         description: Service technology not found
 *       500:
 *         description: Error updating service technology
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    const { image, label, serviceId } = req.body;

    const serviceTech = await ServiceTechnologyList.findById(id);
    if (!serviceTech) {
      return res.status(404).json({
        success: false,
        message: 'Service technology not found',
      });
    }

    if (label && serviceId) {
      const existing = await ServiceTechnologyList.findOne({ label, serviceId });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'Label already exists for this service',
        });
      }
    }

    if (image) serviceTech.image = image;
    if (label) serviceTech.label = label;
    if (serviceId) serviceTech.serviceId = serviceId;

    await serviceTech.save();

    res.status(200).json({
      success: true,
      message: 'Service technology updated successfully',
      data: serviceTech,
    });
  } catch (error) {
    console.error('Error updating service technology:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service technology',
    });
  }
});

// ----------------- DELETE -----------------
/**
 * @swagger
 * /api/service-technology/{id}:
 *   delete:
 *     summary: Delete a service technology by ID
 *     tags: [ServiceTechnology]
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
 *         description: Service technology deleted successfully
 *       404:
 *         description: Service technology not found
 *       500:
 *         description: Error deleting service technology
 */
router.delete('/:id',  protect, cleanupImages(ServiceTechnologyList, 'ServiceTechnologyList') , async (req, res) => {
  try {
    const id = req.params.id;
    const serviceTech = await ServiceTechnologyList.findById(id);
    if (!serviceTech) {
      return res.status(404).json({
        success: false,
        message: 'Service technology not found',
      });
    }

    await ServiceTechnologyList.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Service technology deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service technology:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service technology',
    });
  }
});

module.exports = router;
