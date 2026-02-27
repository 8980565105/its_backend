const express = require('express');
const Blog = require('../../models/blog/blog.model');
const { protect } = require('../../middlewares/auth');
const cleanupImages = require('../../middlewares/cleanupImages');
const cleanupOldImages = require('../../middlewares/cleanupOldImages');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: API for managing blogs
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     BlogDetail:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - author
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the blog
 *         description:
 *           type: string
 *           description: Content of the blog
 *         author:
 *           type: string
 *           description: Author of the blog
 *
 *     Blog:
 *       type: object
 *       required:
 *         - categories
 *         - subCategories
 *         - slug
 *         - details
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         categories:
 *           type: string
 *           description: Main category of the blog
 *         subCategories:
 *           type: string
 *           description: Subcategory of the blog
 *         slug:
 *           type: string
 *           description: Unique slug for the blog
 *         image:
 *           type: string
 *           description: Image URL for the blog
 *         details:
 *           type: array
 *           description: Array of blog details
 *           items:
 *             $ref: '#/components/schemas/BlogDetail'
 *         seo_title:
 *           type: string
 *           description: SEO title for the blog (meta title)
 *         meta_description:
 *           type: string
 *           description: Meta description for search engines
 *         seo_keyphrase:
 *           type: string
 *           description: Comma-separated SEO keywords
 *         cover_image:
 *           type: string
 *           description: Open Graph / social share image URL
 */

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', protect, async (req, res) => {
    try {
        // ✅ Updated destructuring to include SEO fields
        const {
            categories,
            subCategories,
            slug,
            image,
            details,
            seo_title,
            meta_description,
            seo_keyphrase,
            cover_image
        } = req.body;

        if (!categories || !subCategories || !slug || !details) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        const existingBlog = await Blog.findOne({ slug });
        if (existingBlog) {
            return res.status(400).json({
                success: false,
                message: 'Slug already exists',
            });
        }

        // ✅ Updated Blog creation to include SEO fields
        const blog = new Blog({
            categories,
            subCategories,
            slug,
            image: image || '',
            details,
            seo_title,
            meta_description,
            seo_keyphrase,
            cover_image
        });

        await blog.save();

        res.status(201).json({ success: true, data: blog });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/blogs/admin:
 *   get:
 *     summary: Get blogs for admin panel with pagination, filters, and search
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           description: Filter by blog category
 *       - in: query
 *         name: subCategories
 *         schema:
 *           type: string
 *           description: Filter by blog subcategory
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *           example: "AI"
 *           description: Search term to match against blog titles and SEO titles
 *     responses:
 *       200:
 *         description: List of blogs with pagination
 *       500:
 *         description: Server error
 */

router.get('/admin', async (req, res) => {
    try {
        const { page = 1, limit = 10, category = '', subCategories = '', value = '' } = req.query;

        const query = {};
        if (category) query.categories = category;
        if (subCategories) query.subCategories = subCategories;

        // 🔎 Add search condition if "value" is provided
        if (value) {
            query.$or = [
                { "details.title": { $regex: value, $options: "i" } }, // search inside array of details
                { seo_title: { $regex: value, $options: "i" } }
            ];
        }

        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            Blog.find(query)
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Blog.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: blogs,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('❌ Error getting blogs:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



// Get API to fetch unique categories + subcategories
// Get API to fetch unique categories + subcategories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Blog.distinct('categories');
        const subCategories = await Blog.distinct('subCategories');

        // Combine, remove falsy, trim and remove empty strings
        const combined = [...categories, ...subCategories]
            .filter(Boolean)
            .map(item => item.trim())
            .filter(item => item.length);

        // Remove exact duplicates (keeps "Android" and "android" as separate items)
        let uniqueCombined = [...new Set(combined)];

        // Preferred: use Intl.Collator for locale-aware compare,
        // primary: case-insensitive (sensitivity: 'base'), tiebreaker: uppercase first (caseFirst: 'upper')
        if (typeof Intl !== 'undefined' && Intl.Collator) {
            const collator = new Intl.Collator('en', { sensitivity: 'base', caseFirst: 'upper' });
            uniqueCombined.sort(collator.compare);
        } else {
            // Fallback: case-insensitive primary, ASCII case-sensitive fallback (uppercase < lowercase)
            uniqueCombined.sort((a, b) => {
                const al = a.toLowerCase();
                const bl = b.toLowerCase();
                if (al < bl) return -1;
                if (al > bl) return 1;
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
        }

        res.status(200).json({
            success: true,
            data: uniqueCombined,
        });
    } catch (error) {
        console.error('❌ Error getting categories:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add this route to your blog.routes.js file in the backend
router.get('/slugs', async (req, res) => {
    try {
        const blogs = await Blog.find().select('slug -_id').lean();
        res.json({ success: true, data: blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/categorieswithsubcategories', async (req, res) => {
    try {
        const result = await Blog.aggregate([
            {
                $match: {
                    categories: { $exists: true, $ne: "" },
                    subCategories: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$categories",
                    subCategories: { $addToSet: "$subCategories" }
                }
            },
            {
                $project: {
                    category: "$_id",
                    subCategories: 1,
                    _id: 0
                }
            },
            {
                $sort: { category: 1 }
            }
        ]);

        const filteredResult = result
            .filter(item => item.category && item.category.trim() !== '')
            .map(item => ({
                ...item,
                subCategories: item.subCategories
                    .filter(subCat => subCat && subCat.trim() !== '')
                    .sort((a, b) => a.localeCompare(b))
            }))
            .filter(item => item.subCategories.length > 0);

        res.status(200).json({
            success: true,
            data: filteredResult
        });

    } catch (error) {
        console.error('❌ Error getting categories with subcategories:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});




/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get blogs for frontend with pagination (30 per page) and optional category/subCategory filter
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 30
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           description: Optional filter that matches either category or subCategory
 *     responses:
 *       200:
 *         description: List of blogs
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 30, category = '' } = req.query;
        console.log("🚀 ~ category:", category)
        const skip = (page - 1) * limit;

        let query = {};
        if (category) {
            const normalizedCategory = category.trim();
            query = {
                $or: [
                    { categories: { $regex: `^${normalizedCategory}$`, $options: 'i' } },
                    { subCategories: { $regex: `^${normalizedCategory}$`, $options: 'i' } }
                ]
            };
        }

        const [blogs, count] = await Promise.all([
            Blog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Blog.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: blogs,
            pagination: {
                current: Number(page),
                pages: Math.ceil(count / limit),
                total: count,
            },
        });
    } catch (error) {
        console.error('❌ Error getting blogs:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get blog by ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog found
 *       404:
 *         description: Blog not found
 */
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        res.json({ success: true, data: blog });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/blogs/slug/{slug}:
 *   get:
 *     summary: Get blog by slug
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog found
 *       404:
 *         description: Blog not found
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        res.json({ success: true, data: blog });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update blog
 *     tags: [Blogs]
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
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       404:
 *         description: Blog not found
 */
router.put('/:id', protect, cleanupOldImages(Blog, "Blog"), async (req, res) => {
    try {
        // ✅ Updated destructuring to include SEO fields
        const {
            categories,
            subCategories,
            slug,
            image,
            details,
            seo_title,
            meta_description,
            seo_keyphrase,
            cover_image
        } = req.body;

        const existingBlog = await Blog.findOne({
            slug,
            _id: { $ne: req.params.id },
        });
        if (existingBlog) {
            return res.status(400).json({
                success: false,
                message: 'Slug already exists',
            });
        }

        // ✅ Created an update object with all fields
        const updateData = {
            categories,
            subCategories,
            slug,
            image: image || '',
            details,
            seo_title,
            meta_description,
            seo_keyphrase,
            cover_image
        };

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.json({ success: true, data: updatedBlog });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete blog
 *     tags: [Blogs]
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
 *         description: Blog deleted successfully
 *       404:
 *         description: Blog not found
 */
router.delete('/:id', protect, cleanupImages(Blog),async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
});

module.exports = router;
