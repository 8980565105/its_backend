const express = require("express");
const mongoose = require("mongoose");
const HireMainPageData = require("../../models/hire/hireMainPageData");
const { protect } = require("../../middlewares/auth"); 
const cleanupImages = require("../../middlewares/cleanupImages");
const cleanupOldImages = require("../../middlewares/cleanupOldImages");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: HireMainPageData
 *   description: API for hire main page data
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DevelopmentTeamSection:
 *       type: object
 *       required:
 *         - heading
 *         - description
 *         - image
 *       properties:
 *         heading:
 *           type: string
 *           example: "Expert Development Teams"
 *         description:
 *           type: string
 *           example: "We provide skilled development teams for your projects"
 *         image:
 *           type: string
 *           example: "https://example.com/team-image.jpg"
 *
 *     DedicatedDeveloperService:
 *       type: object
 *       required:
 *         - image
 *         - hirepageId
 *       properties:
 *         image:
 *           type: string
 *           example: "https://example.com/service-icon.png"
 *         hirepageId:
 *           type: string
 *           description: ObjectId reference to HirePageData
 *           example: "507f1f77bcf86cd799439011"
 *
 *     DedicatedDeveloperSection:
 *       type: object
 *       required:
 *         - title
 *         - services
 *       properties:
 *         title:
 *           type: string
 *           example: "Dedicated Developers"
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DedicatedDeveloperService'
 *
 *     WhyHireDetailBox:
 *       type: object
 *       required:
 *         - image
 *         - label
 *       properties:
 *         image:
 *           type: string
 *           example: "https://example.com/benefit-icon.png"
 *         label:
 *           type: string
 *           example: "Cost Effective"
 *
 *     WhyHireDeveloperForYourProject:
 *       type: object
 *       required:
 *         - mainTitle
 *         - detailBox
 *       properties:
 *         mainTitle:
 *           type: string
 *           example: "Why Hire Developers for Your Project"
 *         detailBox:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WhyHireDetailBox'
 *
 *     WhyChooseDetailBox:
 *       type: object
 *       required:
 *         - image
 *         - label
 *         - description
 *       properties:
 *         image:
 *           type: string
 *           example: "https://example.com/feature-icon.png"
 *         label:
 *           type: string
 *           example: "Expert Team"
 *         description:
 *           type: string
 *           example: "Our developers have 5+ years of experience"
 *
 *     WhyChooseItsForDedicatedResources:
 *       type: object
 *       required:
 *         - mainTitle
 *         - detailBox
 *       properties:
 *         mainTitle:
 *           type: string
 *           example: "Why Choose Us for Dedicated Resources"
 *         detailBox:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WhyChooseDetailBox'
 *
 *     HireDedicatedResourcesAndTalents:
 *       type: object
 *       required:
 *         - subTitle
 *         - mainTitle
 *         - keyPoints
 *         - buttonTitle
 *       properties:
 *         subTitle:
 *           type: string
 *           example: "Hire Top Talent"
 *         mainTitle:
 *           type: string
 *           example: "Dedicated Resources & Talents"
 *         keyPoints:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Flexible hiring models", "Quick onboarding", "24/7 support"]
 *         buttonTitle:
 *           type: string
 *           example: "Get Started Now"
 *
 *     HireMainPageData:
 *       type: object
 *       required:
 *         - mainTitle
 *         - description
 *         - developmentTeamSection
 *         - dedicatedDeveloperSection
 *         - whyHireDeveloperforYourProject
 *         - whyChooseItsForDedicatedResources
 *         - hireDedicatedResourcesAndTalents
 *         - pricePathAndFAQ
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         mainTitle:
 *           type: string
 *           example: "Hire Top Developers"
 *         description:
 *           type: string
 *           example: "Find the best developers for your projects"
 *         developmentTeamSection:
 *           $ref: '#/components/schemas/DevelopmentTeamSection'
 *         dedicatedDeveloperSection:
 *           $ref: '#/components/schemas/DedicatedDeveloperSection'
 *         whyHireDeveloperforYourProject:
 *           $ref: '#/components/schemas/WhyHireDeveloperForYourProject'
 *         whyChooseItsForDedicatedResources:
 *           $ref: '#/components/schemas/WhyChooseItsForDedicatedResources'
 *         hireDedicatedResourcesAndTalents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HireDedicatedResourcesAndTalents'
 *         pricePathAndFAQ:
 *           type: string
 *           description: ObjectId reference to HirePageData
 *           example: "507f1f77bcf86cd799439011"
 */

/**
 * @swagger
 * /api/hire-main-page:
 *   post:
 *     summary: Create Hire Main Page Data
 *     tags: [HireMainPageData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HireMainPageData'
 *     responses:
 *       201:
 *         description: Hire Main Page Data created successfully
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
 */

const populateOptions = [
    {
        path: "dedicatedDeveloperSection.services.serviceItemBox.hirepageId",
        select: "title slug category subCategory",
    },
    {
        path: "pricePathAndFAQ",
        select: "title slug category subCategory hireDevelopersAsYourNeeds faq",
    },
];
router.post("/", protect, async (req, res) => {
    try {
        const {
            mainTitle,
            description,
            developmentTeamSection,
            dedicatedDeveloperSection,
            whyHireDeveloperforYourProject,
            whyChooseItsForDedicatedResources,
            hireDedicatedResourcesAndTalents,
            pricePathAndFAQ,
        } = req.body;

        // Basic validation
        if (
            !mainTitle ||
            !description ||
            !developmentTeamSection ||
            !dedicatedDeveloperSection ||
            !whyHireDeveloperforYourProject ||
            !whyChooseItsForDedicatedResources ||
            !hireDedicatedResourcesAndTalents ||
            !pricePathAndFAQ
        ) {
            return res.status(400).json({
                success: false,
                message: "All top-level fields are required",
            });
        }

        // Nested validation for dedicatedDeveloperSection
        if (
            !dedicatedDeveloperSection.maintitle ||
            !Array.isArray(dedicatedDeveloperSection.services) ||
            dedicatedDeveloperSection.services.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "DedicatedDeveloperSection requires a maintitle and at least one service category.",
            });
        }

        for (const service of dedicatedDeveloperSection.services) {
            if (
                !service.title ||
                !Array.isArray(service.serviceItemBox) ||
                service.serviceItemBox.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Each service in DedicatedDeveloperSection must have a title and at least one service item.",
                });
            }
        }

        const existingData = await HireMainPageData.findOne();
        if (existingData) {
            return res.status(400).json({
                success: false,
                message:
                    "Hire Main Page Data already exists. Use the update functionality instead.",
            });
        }

        const hireMainPageData = new HireMainPageData(req.body);
        const saved = await hireMainPageData.save();

        const populatedData = await HireMainPageData.findById(saved._id).populate(
            populateOptions
        );

        res.status(201).json({
            success: true,
            message: "Hire Main Page Data created successfully",
            data: populatedData,
        });
    } catch (error) {
        console.error("Error creating Hire Main Page Data:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/hire-main-page/admin:
 *   get:
 *     summary: Get Hire Main Page Data for admin
 *     tags: [HireMainPageData]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hire Main Page Data retrieved successfully
 *       404:
 *         description: No Hire Main Page Data found
 *       500:
 *         description: Server error
 */
router.get("/admin", protect, async (req, res) => {
    try {
        const data = await HireMainPageData.findOne().populate(populateOptions);

        if (!data) {
            // Return success:false but status 200, so frontend can handle 'no data' state gracefully
            return res.status(200).json({
                success: false,
                message: "No Hire Main Page Data found",
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Error getting Hire Main Page Data for admin:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/hire-main-page:
 *   get:
 *     summary: Get Hire Main Page Data
 *     tags: [HireMainPageData]
 *     responses:
 *       200:
 *         description: Hire Main Page Data retrieved successfully
 *       404:
 *         description: No Hire Main Page Data found
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
    try {
        const data = await HireMainPageData.findOne().populate(populateOptions);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "No Hire Main Page Data found",
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Error getting Hire Main Page Data:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/hire-main-page/{id}:
 *   get:
 *     summary: Get Hire Main Page Data by ID
 *     tags: [HireMainPageData]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hire Main Page Data retrieved successfully
 *       404:
 *         description: Hire Main Page Data not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format",
            });
        }

        const data = await HireMainPageData.findById(id)
            .populate(
                "dedicatedDeveloperSection.services.hirepageId",
                "title slug category subCategory "
            )
            .populate(
                "pricePathAndFAQ",
                "title slug category subCategory hireDevelopersAsYourNeeds faq"
            );

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Hire Main Page Data not found",
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Error getting Hire Main Page Data by ID:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/hire-main-page/{id}:
 *   put:
 *     summary: Update Hire Main Page Data by ID
 *     tags: [HireMainPageData]
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
 *             $ref: '#/components/schemas/HireMainPageData'
 *     responses:
 *       200:
 *         description: Hire Main Page Data updated successfully
 *       400:
 *         description: Missing or invalid fields
 *       404:
 *         description: Hire Main Page Data not found
 *       500:
 *         description: Server error
 */
router.put("/:id", protect,cleanupOldImages(HireMainPageData,"HireMainPageData"), async (req, res) => {
    try {
        const { id } = req.params;
        const { dedicatedDeveloperSection } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid ID format" });
        }

        // Nested validation for dedicatedDeveloperSection
        if (
            !dedicatedDeveloperSection ||
            !dedicatedDeveloperSection.maintitle ||
            !Array.isArray(dedicatedDeveloperSection.services) ||
            dedicatedDeveloperSection.services.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "DedicatedDeveloperSection requires a maintitle and at least one service category.",
            });
        }
        for (const service of dedicatedDeveloperSection.services) {
            if (
                !service.title ||
                !Array.isArray(service.serviceItemBox) ||
                service.serviceItemBox.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Each service in DedicatedDeveloperSection must have a title and at least one service item.",
                });
            }
        }

        const updated = await HireMainPageData.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        }).populate(populateOptions);

        if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Hire Main Page Data not found" });
        }

        res.status(200).json({
            success: true,
            message: "Hire Main Page Data updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error("Error updating Hire Main Page Data:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/hire-main-page/{id}:
 *   delete:
 *     summary: Delete Hire Main Page Data by ID
 *     tags: [HireMainPageData]
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
 *         description: Hire Main Page Data deleted successfully
 *       404:
 *         description: Hire Main Page Data not found
 *       500:
 *         description: Server error
 */
router.delete(
    "/:id",
    protect, 
    cleanupImages(HireMainPageData),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res
                    .status(400)
                    .json({ success: false, message: "Invalid ID format" });
            }

            const data = await HireMainPageData.findByIdAndDelete(id);

            if (!data) {
                return res
                    .status(404)
                    .json({ success: false, message: "Hire Main Page Data not found" });
            }

            res.status(200).json({
                success: true,
                message: "Hire Main Page Data deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting Hire Main Page Data:", error);
            res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message,
            });
        }
    }
);

module.exports = router;
