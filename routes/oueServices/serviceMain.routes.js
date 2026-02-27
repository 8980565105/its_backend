const express = require("express");
const mongoose = require("mongoose");
const { protect } = require("../../middlewares/auth");
const OurServicesMain = require("../../models/ourServices/ourServiesMain");
const cleanupImages = require("../../middlewares/cleanupImages");
const cleanupOldImages = require("../../middlewares/cleanupOldImages");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: OurServicesMain
 *   description: Manage the "Our Services" main sections including hero and technology details
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ManualPoint:
 *       type: object
 *       required:
 *         - label
 *         - image
 *         - serviceId
 *       properties:
 *         label:
 *           type: string
 *           example: "React"
 *         image:
 *           type: string
 *           example: "https://example.com/react.png"
 *         serviceId:
 *           type: string
 *           description: ObjectId reference to the Service
 *           example: "652fa12a45e89a98d21b342a"
 *
 *     SimplePoint:
 *       type: object
 *       required:
 *         - label
 *         - image
 *       properties:
 *         label:
 *           type: string
 *           example: "JavaScript"
 *         image:
 *           type: string
 *           example: "https://example.com/js.png"
 *
 *     HeroSection:
 *       type: object
 *       required:
 *         - image
 *         - title
 *         - points
 *       properties:
 *         image:
 *           type: string
 *           example: "https://example.com/hero.png"
 *         title:
 *           type: string
 *           example: "Web Development"
 *         points:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ManualPoint"
 *
 *     TechnologyDetail:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - image
 *       properties:
 *         title:
 *           type: string
 *           example: "Frontend Technologies"
 *         description:
 *           type: string
 *           example: "Tools and frameworks used for frontend development"
 *         image:
 *           type: string
 *           example: "https://example.com/frontend.png"
 *         technologyDetail:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/SimplePoint"
 *         developmentDetail:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ManualPoint"
 *
 *     OurServicesMain:
 *       type: object
 *       required:
 *         - mainTitle
 *         - description
 *         - heroSections
 *         - technologyDetails
 *       properties:
 *         mainTitle:
 *           type: string
 *           example: "Our Services"
 *         description:
 *           type: string
 *           example: "We provide full-stack web and mobile development solutions."
 *         heroSections:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/HeroSection"
 *         technologyDetails:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/TechnologyDetail"
 */

// --------------------------------------------------------------------
// Create
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/service-main:
 *   post:
 *     summary: Create a new OurServicesMain
 *     tags: [OurServicesMain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OurServicesMain'
 *     responses:
 *       201:
 *         description: Service created successfully
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
 *                   example: Service created successfully
 *                 data:
 *                   $ref: '#/components/schemas/OurServicesMain'
 *       400:
 *         description: All fields are required
 *       500:
 *         description: Server Error
 */
router.post("/", protect, async (req, res) => {
  try {
    const { mainTitle, description, heroSections, technologyDetails } = req.body;

    if (!mainTitle || !description || !heroSections || !technologyDetails) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (mainTitle, description, heroSections, technologyDetails)",
      });
    }

    const newService = new OurServicesMain({
      mainTitle,
      description,
      heroSections,
      technologyDetails,
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: newService,
    });
  } catch (error) {
    console.error("❌ Error creating service:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --------------------------------------------------------------------
// Get all (Public)
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/service-main:
 *   get:
 *     summary: Get all OurServicesMain (Public)
 *     tags: [OurServicesMain]
 *     responses:
 *       200:
 *         description: List of all services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OurServicesMain'
 *       500:
 *         description: Server Error
 */
router.get("/", async (req, res) => {
  try {
    // Use findOne() to get a single document instead of an array
    const service = await OurServicesMain.findOne().populate([
      {
        path: "heroSections.points.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
      {
        path: "technologyDetails.developmentDetail.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
    ]);

    // If a document is found, return it.
    // If no record is found (service is null), return an empty object {}.
    res.status(200).json({ success: true, data: service || {} });

  } catch (error) {
    console.error("❌ Error fetching services:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --------------------------------------------------------------------
// Get all (Admin)
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/service-main/admin:
 *   get:
 *     summary: Get all OurServicesMain for admin
 *     tags: [OurServicesMain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all services for admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OurServicesMain'
 *       401:
 *         description: Unauthorized (if no token or invalid token)
 *       500:
 *         description: Server Error
 */
router.get("/admin", protect, async (req, res) => {
  try {
    const services = await OurServicesMain.find().populate([
      {
        path: "heroSections.points.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
      {
        path: "technologyDetails.developmentDetail.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
    ]);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error("❌ Error fetching admin services:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --------------------------------------------------------------------
// Get by ID
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/service-main/{id}:
 *   get:
 *     summary: Get OurServicesMain by ID
 *     tags: [OurServicesMain]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OurServicesMain ID
 *     responses:
 *       200:
 *         description: Service fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/OurServicesMain'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server Error
 */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const service = await OurServicesMain.findById(req.params.id).populate([
      {
        path: "heroSections.points.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
      {
        path: "technologyDetails.developmentDetail.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
    ]);

    if (!service)
      return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.error("❌ Error fetching service by ID:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --------------------------------------------------------------------
// Update
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/service-main/{id}:
 *   put:
 *     summary: Update OurServicesMain by ID
 *     tags: [OurServicesMain]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OurServicesMain ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OurServicesMain'
 *     responses:
 *       200:
 *         description: Service updated successfully
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
 *                   example: Service updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/OurServicesMain'
 *       400:
 *         description: Invalid ID or missing required fields
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server Error
 */
router.put("/:id", protect,cleanupOldImages(OurServicesMain,"OurServicesMain"), async (req, res) => {
  try {
    const { mainTitle, description, heroSections, technologyDetails } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    if (!mainTitle || !description || !heroSections || !technologyDetails) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (mainTitle, description, heroSections, technologyDetails)",
      });
    }

    const updatedService = await OurServicesMain.findByIdAndUpdate(
      req.params.id,
      { mainTitle, description, heroSections, technologyDetails },
      { new: true, runValidators: true }
    ).populate([
      {
        path: "heroSections.points.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
      {
        path: "technologyDetails.developmentDetail.serviceId",
        model: "Service",
        select: "_id slug category subCategory mainTitle",
      },
    ]);

    if (!updatedService)
      return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    console.error("❌ Error updating service:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --------------------------------------------------------------------
// Delete
// --------------------------------------------------------------------

/**
 * @swagger
 * /api/service-main/{id}:
 *   delete:
 *     summary: Delete OurServicesMain by ID
 *     tags: [OurServicesMain]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OurServicesMain ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
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
 *                   example: Service deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server Error
 */
router.delete("/:id", protect, cleanupImages(OurServicesMain),async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const deleted = await OurServicesMain.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting service:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;