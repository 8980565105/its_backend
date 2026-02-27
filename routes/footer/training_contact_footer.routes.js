const express = require("express");
const TranningContact = require("../../models/footer/tranning_contact_footer");
const { protect } = require("../../middlewares/auth");
const nodemailer = require("nodemailer");
const axios = require("axios");

const router = express.Router();
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;


// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * @swagger
 * tags:
 *   name: TranningContact
 *   description: API for training footer contacts
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TranningContact:
 *       type: object
 *       required:
 *         - fullname
 *         - email
 *         - phone
 *         - message
 *         - location
 *         - selectedCourse
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID
 *         fullname:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         message:
 *           type: string
 *         location:
 *           type: string
 *         selectedCourse:
 *           type: string
 *           enum:
 *             - Web Development
 *             - Full Stack Development
 *             - Mobile App Development
 *             - UI/UX Design
 *             - Web Design
 *             - Other Services
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/tranning-contact:
 *   post:
 *     summary: Submit a new training contact form
 *     tags: [TranningContact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - phone
 *               - message
 *               - location
 *               - selectedCourse
 *               - token
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *               location:
 *                 type: string
 *               selectedCourse:
 *                 type: string
 *                 enum: ["Web Development","Full Stack Development","Mobile App Development","UI/UX Design","Web Design","Other Services"]
 *               token:
 *                 type: string
 *                 description: Google reCAPTCHA token
 *     responses:
 *       201:
 *         description: Contact saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TranningContact'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

router.post("/", async (req, res) => {
    try {
        const { fullname, email, phone, message, location, selectedCourse, token } = req.body;

        if (!fullname || !email || !phone || !message || !location || !selectedCourse) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Verify reCAPTCHA
        if (!token) {
            return res.status(400).json({ success: false, message: "reCAPTCHA is required" });
        }

        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            null, // no JSON body, Google expects form-encoded
            {
                params: {
                    secret: RECAPTCHA_SECRET,
                    response: token,
                },
            }
        );

        if (!response.data.success) {
            return res.status(400).json({
                success: false,
                message: "Captcha verification failed"
            });
        }
        // Save contact to DB
        const tranningContact = new TranningContact({
            fullname,
            email,
            phone,
            message,
            location,
            selectedCourse
        });
        await tranningContact.save();

        // ======================
        // 📧 Send Admin Email
        // ======================
        const adminMailOptions = {
            from: `"${fullname}" <${email}>`,
            to: process.env.EMAIL_USER,
            subject: "📩 New Training Contact Form Submission",
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:700px; margin:auto;">
                    <h2 style="color:#333;">New Training Contact Request</h2>
                    <p>You have received a new training contact form submission:</p>
                    <table style="width:100%; border-collapse: collapse; margin-top:15px;">
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Full Name:</b></td><td style="padding:8px; border:1px solid #ddd;">${fullname}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Email:</b></td><td style="padding:8px; border:1px solid #ddd;">${email}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Phone:</b></td><td style="padding:8px; border:1px solid #ddd;">${phone}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Location:</b></td><td style="padding:8px; border:1px solid #ddd;">${location}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Course:</b></td><td style="padding:8px; border:1px solid #ddd;">${selectedCourse}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Message:</b></td><td style="padding:8px; border:1px solid #ddd;">${message}</td></tr>
                    </table>
                    <br/>
                    <p style="color:#555;">Best Regards,<br/>Inspire Techno Solution Website</p>
                </div>
            `,
        };

        await transporter.sendMail(adminMailOptions);

        // ======================
        // 📧 Send Confirmation to User
        // ======================
        const userMailOptions = {
            from: `"Inspire Techno Solution" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "✅ Thank you for contacting us about Training",
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
                    <h2 style="color:#333;">Hi ${fullname},</h2>
                    <p style="font-size:15px; color:#444; line-height:1.6;">
                        Thank you for contacting <b>Inspire Techno Solution</b> about our training program:
                        <br/><b style="color:#d35400;">${selectedCourse}</b>
                    </p>
                    <p style="font-size:15px; color:#444; line-height:1.6;">
                        We have received your message and one of our training specialists will reach out to you shortly.
                    </p>
                    <div style="margin:20px 0; padding:10px; background:#f9f9f9; border-left:4px solid #d35400;">
                        <p style="margin:0; font-size:14px; color:#555;"><b>Your message: </b></p>
                        <p style="margin:5px 0 0; font-size:14px; color:#444;">${message}</p>
                    </div>
                    <p style="color:#555;">Best regards,<br/>The Inspire Techno Solution Team</p>
                    <hr style="margin:20px 0;"/>
                    <p style="font-size:12px; color:#777; text-align:center;">
                        📞 +91 93272 20484 | 📧 support@inspiretechnosolution.com | 🌐 www.inspiretechnosolution.com
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(userMailOptions);

        // Final Response
        res.status(201).json({
            success: true,
            message: "Training Contact saved successfully & emails sent",
            data: tranningContact,
        });

    } catch (error) {
        console.error("❌ Error in Training Contact:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


/**
 * @swagger
 * /api/tranning-contact:
 *   get:
 *     summary: Get all training contacts (with pagination and search)
 *     tags: [TranningContact]
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
 *         name: value
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of training contacts
 */

router.get("/", protect, async (req, res) => {
    try {
        const { page = 1, limit = 10, category = '', value = '' } = req.query;
        let query = {};

        if (category) {
            query.selectedCourse = category;
        }

        if (value) {
            const regex = new RegExp(value, 'i');
            query.$or = [
                { fullname: regex },
                { email: regex },
                { location: regex },
            ];
        }

        const skip = (page - 1) * limit;
        const [contacts, count] = await Promise.all([
            TranningContact.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            TranningContact.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: contacts,
            pagination: {
                current: Number(page),
                pages: Math.ceil(count / limit),
                total: count,
            },
        });

    } catch (error) {
        console.error("❌ Error getting training contacts:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});



/**
 * @swagger
 * /api/tranning-contact/{id}:
 *   delete:
 *     summary: Delete a training contact by ID
 *     tags: [TranningContact]
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
 *         description: Contact deleted successfully
 *       404:
 *         description: Contact not found
 */

router.delete("/:id", protect, async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await TranningContact.findById(id);
        if (!contact) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }
        await TranningContact.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Contact deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting training contact:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
