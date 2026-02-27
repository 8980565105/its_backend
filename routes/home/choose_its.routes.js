const express = require('express');
const HomeChooseIts = require('../../models/home/choose_its_home');
const router = express.Router();
const { protect } = require('../../middlewares/auth');
const cleanupImages = require('../../middlewares/cleanupImages');
const cleanupOldImages = require('../../middlewares/cleanupOldImages');

// @desc    store data of why choode ITS  in home page
// @route   POST /api/choose_its_home
// @access  Private

// router.post('/', protect, async (req, res) => {

// })

// // @desc    get all data of why choose its in home page
// // @route   GET /api/choose_its_home
// // @access  Private

// router.get('/', async (req, res) => {

// })


// // @desc     update data of why choose its in home page by id
// // @route    PUT /api/choose_its_home/:id
// // @access   Private

// router.put('/:id', protect, async (req, res) => {
    

// })


// // @desc     delete data of why choose its in home page by id
// // @route    DELETE /api/choose_its_home/:id
// // @access   Private
// router.delete('/:id', protect, async (req, res) => {

// })



/**
 * @swagger
 * tags:
 *   name: ChooseItsHome
 *   description: API for managing "Why Choose Us" section
 */

/**
 * @swagger
 * /api/choose_its_home:
 *   post:
 *     summary: Create a "Why Choose Us" entry
 *     tags: [ChooseItsHome]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *                 example: High Quality
 *               description:
 *                 type: string
 *                 example: We deliver high-quality products on time.
 *               image:
 *                 type: string
 *                 example: https://example.com/image.png
 *     responses:
 *       201:
 *         description: Entry created successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, image } = req.body;

        const newHomeChooseIts = new HomeChooseIts({
            title,
            description,
            image
        });
        console.log("🚀 ~ newHomeChooseIts:", newHomeChooseIts)
        await newHomeChooseIts.save();
        res.status(201).json({
            success: true,
            message: 'Data is Store Sucessfully',
            data: newHomeChooseIts
        })
    } catch (error) {
        console.error("Home page why choose its data store error", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
});

/**
 * @swagger
 * /api/choose_its_home:
 *   get:
 *     summary: Get all "Why Choose Us" entries
 *     tags: [ChooseItsHome]
 *     responses:
 *       200:
 *         description: List of entries
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {

        const homeChooseIts = await HomeChooseIts.find();
        res.status(200).json({
            success: true,
            message: 'Data is Fetched Sucessfully',
            data: homeChooseIts
        })


    } catch (error) {
        console.error(" Error to get data", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
});

/**
 * @swagger
 * /api/choose_its_home/{id}:
 *   put:
 *     summary: Update a "Why Choose Us" entry by ID
 *     tags: [ChooseItsHome]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entry ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entry updated successfully
 *       404:
 *         description: Entry not found
 */
router.put('/:id', protect,cleanupOldImages(HomeChooseIts,"HomeChooseIts"), async (req, res) => {
    try {
        // check the data is exist or not
        const homeChooseIts = await HomeChooseIts.findById(req.params.id);
        if (!homeChooseIts) {
            return res.status(404).json({
                success: false,
                message: 'Data is not found',
            })
        }
        // update data
        const updateData = {
            ...req.body
        }
        const updatedHomeChooseIts = await HomeChooseIts.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        })
        res.status(200).json({
            success: true,
            message: 'Data is Updated Sucessfully',
            data: updatedHomeChooseIts
        })
    } catch (error) {
        console.error(" Error to update data", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
});

/**
 * @swagger
 * /api/choose_its_home/{id}:
 *   delete:
 *     summary: Delete a "Why Choose Us" entry by ID
 *     tags: [ChooseItsHome]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Entry deleted successfully
 *       404:
 *         description: Entry not found
 */
router.delete('/:id', protect,cleanupImages(HomeChooseIts), async (req, res) => {
    try {
        // check the data is exist or not
        const homeChooseIts = await HomeChooseIts.findById(req.params.id);
        if (!homeChooseIts) {
            return res.status(404).json({
                success: false,
                message: 'Data is not found',
            })
        }
        // delete data
        await HomeChooseIts.findByIdAndDelete(req.params.id)
        res.status(200).json({
            success: true,
            message: 'Data is Deleted Sucessfully',
        })
    }
    catch (error) {
        console.error(" Error to delete data", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
});


module.exports = router;
