



const express = require('express');
const ProgrammingLanguageAndDesign = require('../../models/training/programmingLanguageandDesign')
const { protect } = require('../../middlewares/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProgrammingLanguageAndDesign
 *   description: API for managing programming languages and design courses
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     KeyPointOfTechnology:
 *       type: object
 *       required:
 *         - title
 *         - points
 *       properties:
 *         title:
 *           type: string
 *         points:
 *           type: array
 *           items:
 *             type: string
 *     FAQ:
 *       type: object
 *       required:
 *         - question
 *         - answer
 *       properties:
 *         question:
 *           type: string
 *         answer:
 *           type: array
 *           items:
 *             type: string
 *     ProgrammingLanguageAndDesign:
 *       type: object
 *       required:
 *         - category
 *         - subCategory
 *         - title
 *         - slug
 *         - descriptionOfCourse
 *         - courseDuration
 *         - courseTime
 *         - skillLevel
 *         - courseDetails
 *       properties:
 *         _id:
 *           type: string
 *         category:
 *           type: string
 *         subCategory:
 *           type: string
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         descriptionOfCourse:
 *           type: string
 *         courseDuration:
 *           type: string
 *         courseTime:
 *           type: string
 *         skillLevel:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         courseDetails:
 *           type: array
 *           items:
 *             type: string
 *         keyPointsOfTechnology:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/KeyPointOfTechnology'
 *         faqs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FAQ'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/programming-language-design:
 *   post:
 *     summary: Create a new Programming Language & Design course
 *     tags: [ProgrammingLanguageAndDesign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgrammingLanguageAndDesign'
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Bad request (missing or duplicate slug, required fields missing)
 *       500:
 *         description: Server error
 */


router.post('/', protect, async (req, res) => {
    try {
        const { category, subCategory, title, descriptionOfCourse, slug, courseDuration, courseTime, skillLevel, courseDetails, keyPointsOfTechnology, faqs } = req.body;

        // check slug
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Slug is required"
            })
        }
        const existingCourse = await ProgrammingLanguageAndDesign.findOne({ slug });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: "Slug must be unique. This slug is already in use."
            })
        }

        //checl required fields
        if (!category || !subCategory || !title || !descriptionOfCourse || !courseDuration || !courseTime || !skillLevel || !courseDetails || !keyPointsOfTechnology || !faqs) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            })
        }

        const programmingLanguageandDesign = new ProgrammingLanguageAndDesign({
            category,
            subCategory,
            title,
            slug,
            descriptionOfCourse,
            courseDuration,
            courseTime,
            courseDetails,
            skillLevel,
            keyPointsOfTechnology,
            faqs
        });

        await programmingLanguageandDesign.save();
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: programmingLanguageandDesign
        })
    } catch (error) {
        console.error("Error to create course : ", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
})

/**
 * @swagger
 * /api/programming-language-design:
 *   get:
 *     summary: Get all courses (with pagination & filters)
 *     tags: [ProgrammingLanguageAndDesign]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, subCategory } = req.query;
        let query = {};
        if (category) {
            query.category = category;
        }
        if (subCategory) {
            query.subCategory = subCategory;
        }

        const skip = (page - 1) * limit;
        const [courses, total] = await Promise.all([
            ProgrammingLanguageAndDesign.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            ProgrammingLanguageAndDesign.countDocuments(query)
        ])
        res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total: total
            }
        })

    } catch (error) {
        console.error("Error to get courses : ", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
})

/**
 * @swagger
 * /api/programming-language-design/categories-with-subcategories:
 *   get:
 *     summary: Get all unique categories with their respective subcategories for ProgrammingLanguage
 *     tags: [ProgrammingLanguage]
 *     responses:
 *       200:
 *         description: A structured list of categories and subcategories.
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
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       subCategories:
 *                         type: array
 *                         items:
 *                           type: string
 *       500:
 *         description: Server error
 */
router.get("/categorieswithsubcategories", async (req, res) => {
    try {
        const structuredCategories = await ProgrammingLanguage.aggregate([
            {
                $group: {
                    _id: "$category",
                    subCategories: { $addToSet: "$subCategory" },
                },
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    subCategories: 1,
                },
            },
            { $sort: { category: 1 } },
        ]);

        res.status(200).json({ success: true, data: structuredCategories });
    } catch (error) {
        console.error("Error fetching structured categories (ProgrammingLanguage):", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * @swagger
 * /api/programming-language-design/slug/{slug}:
 *   get:
 *     summary: Get a course by slug
 *     tags: [ProgrammingLanguageAndDesign]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the course
 *     responses:
 *       200:
 *         description: Course found
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */


router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const course = await ProgrammingLanguageAndDesign.findOne({ slug });
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Course found",
            data: course
        })
    } catch (error) {
        console.error("Error to get course by slug : ", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
})

/**
 * @swagger
 * /api/programming-language-design/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [ProgrammingLanguageAndDesign]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Course found
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */


router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID is required"
            })
        }
        const course = await ProgrammingLanguageAndDesign.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }
        res.status(200).json({
            success: true,
            message: "Course found",
            data: course
        })

    } catch (error) {
        console.error("Error to get course by id : ", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
})

/**
 * @swagger
 * /api/programming-language-design/{id}:
 *   put:
 *     summary: Update a course by ID
 *     tags: [ProgrammingLanguageAndDesign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgrammingLanguageAndDesign'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Bad request (duplicate slug or missing fields)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */


router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { category, subCategory, title, descriptionOfCourse, slug, courseDuration, courseTime, skillLevel, courseDetails, keyPointsOfTechnology, faqs } = req.body;

        // check slug
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Slug is required"
            })
        }
        const existingCourse = await ProgrammingLanguageAndDesign.findOne({ slug, _id: { $ne: id } });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: "Slug must be unique. This slug is already in use."
            })
        }
        //checl required fields
        if (!category || !subCategory || !title || !descriptionOfCourse || !courseDuration || !courseTime || !skillLevel || !courseDetails || !keyPointsOfTechnology || !faqs) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            })
        }
        const updatedCourse = await ProgrammingLanguageAndDesign.findByIdAndUpdate(id, {
            category,
            subCategory,
            title,
            slug,
            descriptionOfCourse,
            courseDuration,
            courseTime,
            courseDetails,
            skillLevel,
            keyPointsOfTechnology,
            faqs
        }, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }
        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse
        })

    } catch (error) {
        console.error("Error to update course : ", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
})

/**
 * @swagger
 * /api/programming-language-design/{id}:
 *   delete:
 *     summary: Delete a course by ID
 *     tags: [ProgrammingLanguageAndDesign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */

router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCourse = await ProgrammingLanguageAndDesign.findByIdAndDelete(id);
        if (!deletedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }
        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        })
    }
    catch (error) {
        console.error("Error to delete course : ", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
})


module.exports = router;