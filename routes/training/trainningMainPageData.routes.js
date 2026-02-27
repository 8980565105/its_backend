const express = require("express");
const TrainingMainPageData = require("../../models/training/tranningMainPage");
const { protect } = require("../../middlewares/auth");
const cleanupImages = require("../../middlewares/cleanupImages");
const cleanupOldImages = require("../../middlewares/cleanupOldImages");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TrainingPageContent
 *   description: API for managing the main training page content
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TrainingHeroSection:
 *       type: object
 *       properties:
 *         subTitle:
 *           type: string
 *         mainTitle:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *
 *     TrainingAboutusSection:
 *       type: object
 *       properties:
 *         image:
 *           type: string
 *         subTitle:
 *           type: string
 *         mainTitle:
 *           type: string
 *         description:
 *           type: string
 *         detailbox:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             detailbox:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   heading:
 *                     type: string
 *                   description:
 *                     type: string
 *
 *     TrainingITSInstituteFacilitiesSection:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         points:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               heading:
 *                 type: string
 *               image:
 *                 type: string
 *
 *     TrainingRightCoursePickSection:
 *       type: object
 *       properties:
 *         mainHeading:
 *           type: string
 *         cardBox:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               heading:
 *                 type: string
 *               image:
 *                 type: string
 *         subTitle:
 *           type: string
 *         mainTitle:
 *           type: string
 *         description:
 *           type: string
 *         detailbox:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *
 *     TrainingMainPageContent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         heroSection:
 *           $ref: '#/components/schemas/TrainingHeroSection'
 *         aboutusSection:
 *           $ref: '#/components/schemas/TrainingAboutusSection'
 *         itsInstituteFacilitiesSection:
 *           $ref: '#/components/schemas/TrainingITSInstituteFacilitiesSection'
 *         rightCoursePickSection:
 *           $ref: '#/components/schemas/TrainingRightCoursePickSection'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/training-main-page:
 *   post:
 *     summary: Create content for the main training page
 *     tags: [TrainingPageContent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainingMainPageContent'
 *     responses:
 *       201:
 *         description: Training page content created successfully
 *       400:
 *         description: All sections are required
 *       500:
 *         description: Server error
 */
router.post("/", protect, async (req, res) => {
  try {
    const {
      heroSection,
      aboutusSection,
      itsInstituteFacilitiesSection,
      rightCoursePickSection,
    } = req.body;

    if (
      !heroSection ||
      !aboutusSection ||
      !itsInstituteFacilitiesSection ||
      !rightCoursePickSection
    ) {
      return res.status(400).json({
        success: false,
        message: "All page sections are required",
      });
    }

    const trainingContent = new TrainingMainPageData(req.body);
    await trainingContent.save();

    res.status(201).json({
      success: true,
      message: "Training page content created successfully",
      data: trainingContent,
    });
  } catch (error) {
    console.error("❌ Error creating training page content:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/training-main-page:
 *   get:
 *     summary: Get the latest content for the main training page
 *     tags: [TrainingPageContent]
 *     responses:
 *       200:
 *         description: Training page content retrieved successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const content = await TrainingMainPageData.findOne().sort({ createdAt: -1 });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Training page content not found",
      });
    }

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error("❌ Error fetching training page content:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/training-main-page/{id}:
 *   put:
 *     summary: Update the main training page content
 *     tags: [TrainingPageContent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Training Page Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainingMainPageContent'
 *     responses:
 *       200:
 *         description: Training page content updated successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put("/:id", protect,cleanupOldImages(TrainingMainPageData,"TrainingMainPageData"), async (req, res) => {
  try {
    const content = await TrainingMainPageData.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Training page content not found",
      });
    }

    const updatedContent = await TrainingMainPageData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Training page content updated successfully",
      data: updatedContent,
    });
  } catch (error) {
    console.error("❌ Error updating training page content:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/training-main-page/{id}:
 *   delete:
 *     summary: Delete the main training page content
 *     tags: [TrainingPageContent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Training Page Content ID
 *     responses:
 *       200:
 *         description: Training page content deleted successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", protect, cleanupImages(TrainingMainPageData) ,async (req, res) => {
  try {
    const content = await TrainingMainPageData.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Training page content not found",
      });
    }

    await TrainingMainPageData.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Training page content deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting training page content:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
