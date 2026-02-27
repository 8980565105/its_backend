const express = require('express');
const { protect } = require('../../middlewares/auth');
const router = express.Router();
const MasterCourse = require('../../models/training/masterCourse')

/**
 * @swagger
 * tags:
 *   name: MasterCourse
 *   description: API for managing master courses
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     KeyPoint:
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
 *     Faq:
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
 *     MasterCourse:
 *       type: object
 *       required:
 *         - category
 *         - subCategory
 *         - courseTitle
 *         - slug
 *         - aboutCourseDescription
 *         - keyPointsOfTeachnology
 *         - courseDuration
 *         - courseTime
 *         - skillLevel
 *       properties:
 *         _id:
 *           type: string
 *         category:
 *           type: string
 *         subCategory:
 *           type: string
 *         courseTitle:
 *           type: string
 *         slug:
 *           type: string
 *         aboutCourseDescription:
 *           type: string
 *         keyPointsOfTeachnology:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/KeyPoint'
 *         faqs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Faq'
 *         courseDuration:
 *           type: string
 *         courseTime:
 *           type: string
 *         skillLevel:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/master-courses:
 *   post:
 *     summary: Create a new master course
 *     tags: [MasterCourse]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterCourse'
 *     responses:
 *       201:
 *         description: Master Course created successfully
 *       400:
 *         description: Duplicate slug or missing fields
 *       500:
 *         description: Server error
 */
router.post("/", protect, async (req, res) => {
    try {
        const {
            category,
            subCategory,
            courseTitle,
            aboutCourseDescription,
            keyPointsOfTeachnology,
            faqs,
            courseDuration,
            slug,
            courseTime,
            skillLevel,
        } = req.body;

        // check if slug exists
        const existingCourse = await MasterCourse.findOne({ slug });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: "Course with the same slug already exists",
            });
        }

        if (!category || !subCategory) {
            return res.status(400).json({
                success: false,
                message: "Category and Subcategory are required",
            });
        }

        const masterCourse = new MasterCourse({
            category,
            subCategory,
            courseTitle,
            aboutCourseDescription,
            keyPointsOfTeachnology,
            faqs,
            courseDuration,
            slug,
            courseTime,
            skillLevel,
        });

        await masterCourse.save();
        res.status(201).json({
            success: true,
            message: "Master Course created successfully",
            data: masterCourse,
        });
    } catch (error) {
        console.error("Error creating master course:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/master-courses:
 *   get:
 *     summary: Get all master courses with pagination and filters
 *     tags: [MasterCourse]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of master courses
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, category, subCategory } = req.query;
        const query = {};
        if (category) query.category = category;
        if (subCategory) query.subCategory = subCategory;

        const skip = (Number(page) - 1) * Number(limit);
        const [courses, total] = await Promise.all([
            MasterCourse.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            MasterCourse.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
            },
        });
    } catch (error) {
        console.error("Error fetching master courses:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/master-courses/slug/{slug}:
 *   get:
 *     summary: Get a single master course by slug
 *     tags: [MasterCourse]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Master course retrieved
 *       404:
 *         description: Master Course not found
 */
router.get("/slug/:slug", async (req, res) => {
    try {
        const course = await MasterCourse.findOne({ slug: req.params.slug });
        if (!course) {
            return res
                .status(404)
                .json({ success: false, message: "Master Course not found" });
        }
        res.status(200).json({
            success: true,
            message: "Master Course retrieved successfully",
            data: course,
        });
    } catch (error) {
        console.error("Error fetching course by slug:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/master-courses/categories-with-subcategories:
 *   get:
 *     summary: Get all unique categories with their respective subcategories for MasterCourse
 *     tags: [MasterCourse]
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
        const structuredCategories = await MasterCourse.aggregate([
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
        console.error("Error fetching structured categories (MasterCourse):", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// /**
//  * @swagger
//  * /api/master-courses/{id}:
//  *   get:
//  *     summary: Get a single master course by ID
//  *     tags: [MasterCourse]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: MongoDB ID of the master course
//  *     responses:
//  *       200:
//  *         description: Master course retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/MasterCourse'
//  *       404:
//  *         description: Master Course not found
//  *       500:
//  *         description: Server error
//  */
// router.get("/:id", async (req, res) => {
//     try {
//         const course = await MasterCourse.findById(req.params.id);
//         if (!course) {
//             return res.status(404).json({ success: false, message: "Master Course not found" });
//         }
//         res.status(200).json(course);
//     } catch (err) {
//         res.status(500).json({ success: false, message: "Server error", error: err.message });
//     }
// });


/**
 * @swagger
 * /api/master-courses/{id}:
 *   put:
 *     summary: Update a master course by ID
 *     tags: [MasterCourse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Master course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterCourse'
 *     responses:
 *       200:
 *         description: Master Course updated successfully
 *       400:
 *         description: Duplicate slug
 *       404:
 *         description: Master Course not found
 *       500:
 *         description: Server error
 */






router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { category, subCategory, courseTitle, aboutCourseDescription, keyPointsOfTeachnology, faqs, courseDuration, slug, courseTime, skillLevel } = req.body;

        const course = await MasterCourse.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Master Course not found',
            });
        }

        // If slug is being updated, check for uniqueness
        if (slug && slug !== course.slug) {
            const existingCourse = await MasterCourse.findOne({ slug });
            if (existingCourse) {
                return res.status(400).json({
                    success: false,
                    message: 'Course with the same slug already exists',
                });
            }
            course.slug = slug;
        }

        // Update other fields
        if (category) course.category = category;
        if (subCategory) course.subCategory = subCategory;
        if (courseTitle) course.courseTitle = courseTitle;
        if (aboutCourseDescription) course.aboutCourseDescription = aboutCourseDescription;
        if (keyPointsOfTeachnology) course.keyPointsOfTeachnology = keyPointsOfTeachnology;
        if (faqs) course.faqs = faqs;
        if (courseDuration) course.courseDuration = courseDuration;
        if (courseTime) course.courseTime = courseTime;
        if (skillLevel) course.skillLevel = skillLevel;

        await course.save();
        res.status(200).json({
            success: true,
            message: 'Master Course updated successfully',
            data: course
        });
    } catch (error) {
        console.error("Error to update master course", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
})

/**
 * @swagger
 * /api/master-courses/{id}:
 *   delete:
 *     summary: Delete a master course by ID
 *     tags: [MasterCourse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Master course ID
 *     responses:
 *       200:
 *         description: Master Course deleted successfully
 *       404:
 *         description: Master Course not found
 *       500:
 *         description: Server error
 */

router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const course = await MasterCourse.findByIdAndDelete(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Master Course not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Master Course deleted successfully',
        });
    } catch (error) {
        console.error("Error to delete master course", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
})



module.exports = router;