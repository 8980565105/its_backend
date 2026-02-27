const express = require("express");
const HireForm = require('../../models/hire/hireForm')
const router = express.Router();
const axios = require("axios");
const nodemailer = require('nodemailer');
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const path = require('path');
const { protect } = require("../../middlewares/auth");

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
 *   name: HireForm
 *   description: API for hire requests
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HireForm:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - recruitment
 *         - subject
 *         - message
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the hire request
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         phone:
 *           type: string
 *           example: +91-9876543210
 *         recruitment:
 *           type: string
 *           example: Website development for e-commerce
 *         subject:
 *           type: string
 *           example: Need a full-stack developer team
 *         message:
 *           type: string
 *           example: We want to build an e-commerce platform with payment integration.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */


/**
 * @swagger
 * /api/hire-form:
 *   post:
 *     summary: Submit a new hire request
 *     tags: [HireForm]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - recruitment
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: +91-9876543210
 *               recruitment:
 *                 type: string
 *                 example: Website development for e-commerce
 *               subject:
 *                 type: string
 *                 example: Need a full-stack developer team
 *               message:
 *                 type: string
 *                 example: We want to build an e-commerce platform with payment integration.
 *               captchaToken:
 *                 type: string
 *                 description: Google reCAPTCHA token
 *                 example: "03AGdBq26K..."
 *     responses:
 *       201:
 *         description: Hire form submitted successfully
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
 *                   $ref: '#/components/schemas/HireForm'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */


// POST /api/hire-form
router.post("/", async (req, res) => {
    try {
        const { name, email, phone, recruitment, subject, message, captchaToken } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !recruitment || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        if (!captchaToken) {
            return res.status(400).json({
                success: false,
                message: "Captcha is required",
            });
        }

        const response = await axios.post("https://www.google.com/recaptcha/api/siteverify", null, // no JSON body, Google expects form-encoded
            {
                params: {
                    secret: RECAPTCHA_SECRET,
                    response: captchaToken,
                },
            }
        );
        if (!response.data.success) {
            return res.status(400).json({
                success: false,
                message: "Captcha verification failed"
            });
        }

        const newHireForm = new HireForm({
            name,
            email,
            phone,
            recruitment,
            subject,
            message,
        });

        const savedHireForm = await newHireForm.save();
        // --- Admin Mail ---
        let adminMailOptions = {
            from: `"${name}" <${email}>`,
            to: process.env.EMAIL_USER, // company inbox
            subject: `📌 New Hire Request - ${subject}`,
            html: `
        <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:700px; margin:auto;">
            <h2 style="color:#333;">New Hire Request</h2>
            <p>You have received a new hire request from <b>${name}</b></p>
            <table style="width:100%; border-collapse: collapse; margin-top:15px;">
                <tr><td style="padding:8px; border:1px solid #ddd;"><b>Name:</b></td><td style="padding:8px; border:1px solid #ddd;">${name}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><b>Email:</b></td><td style="padding:8px; border:1px solid #ddd;">${email}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><b>Phone:</b></td><td style="padding:8px; border:1px solid #ddd;">${phone}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><b>Subject:</b></td><td style="padding:8px; border:1px solid #ddd;">${subject}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><b>recruitment:</b></td><td style="padding:8px; border:1px solid #ddd;">${recruitment}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><b>Message:</b></td><td style="padding:8px; border:1px solid #ddd;">${message}</td></tr>
            </table>
            <br/>
            <p style="color:#555;">Best Regards,<br/>Inspire Techno Solution Website</p>
        </div>
    `
        };
        await transporter.sendMail(adminMailOptions);

        // --- User Mail ---
        let userMailOptions = {
            from: `"Inspire Techno Solution" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "✅ We Received Your Hire Request - Inspire Techno Solution",
            html: `
        <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
            <div style="text-align:center; margin-bottom:20px;">
                <img src="cid:companylogo" alt="Inspire Techno Solution" style="width:120px;"/>
            </div>
            <h2 style="color:#333;">Hi ${name},</h2>
            <p style="font-size:15px; color:#444; line-height:1.6;">
               Thank you for reaching out to <b style="color:#d35400;">Inspire Techno Solution</b> regarding <b>${subject}</b>.
            </p>
            <p style="font-size:15px; color:#444; line-height:1.6;">
                We have received your request and our team will get back to you shortly.
            </p>
            <div style="margin:20px 0; padding:10px; background:#f9f9f9; border-left:4px solid #d35400;">
                <p style="margin:0; font-size:14px; color:#555;"><b>Your recruitment: </b></p>
                <p style="margin:5px 0 0; font-size:14px; color:#444;">${recruitment}</p>
                <p style="margin:10px 0 0; font-size:14px; color:#555;"><b>Your Message: </b></p>
                <p style="margin:5px 0 0; font-size:14px; color:#444;">${message}</p>
            </div>
            <p style="color:#555;">Best regards,<br/>The Inspire Techno Solution Team</p>
            <hr style="margin:20px 0;"/>
            <p style="font-size:12px; color:#777; text-align:center;">
                📞 +91 93272 20484 | 📧 support@inspiretechnosolution.com | 🌐 www.inspiretechnosolution.com
            </p>
        </div>
    `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: path.join(__dirname, '../../assets/logo.png'),
                    cid: 'companylogo'
                }
            ]
        };
        await transporter.sendMail(userMailOptions);

        res.status(201).json({
            success: true,
            message: "Hire form submitted successfully",
            data: savedHireForm,
        });
    } catch (error) {
        console.error("Error submitting hire form:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});


//GET API  

/**
 * @swagger
 * /api/hire-form:
 *   get:
 *     summary: Get all hire requests with pagination and optional subject filter
 *     tags: [HireForm]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter hire requests by subject (case-insensitive)
 *     responses:
 *       200:
 *         description: List of hire requests with pagination
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
 *                     $ref: '#/components/schemas/HireForm'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category = '' } = req.query;
        let query = {};

        if (category) {
            query = {
                ...query,
                subject: { $regex: category, $options: 'i' } // case-insensitive search
            };
        }

        const skip = (page - 1) * limit;

        const [hireForms, total] = await Promise.all([
            HireForm.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            HireForm.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: hireForms,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error("Error retrieving hire forms:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});



/**
 * @swagger
 * /api/hire-form/{id}:
 *   delete:
 *     summary: Delete a hire request by ID
 *     tags: [HireForm]
 *     security:
 *       - bearerAuth: []   # Protect middleware
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hire request ID
 *     responses:
 *       200:
 *         description: Hire request deleted successfully
 *       404:
 *         description: Hire request not found
 *       500:
 *         description: Server error
 */

router.delete("/:id", protect, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedHireForm = await HireForm.findByIdAndDelete(id);
        if (!deletedHireForm) {
            return res.status(404).json(
                {
                    success: false,
                    message: "Hire form not found",
                }
            );
        }
        res.status(200).json({
            success: true,
            message: "Hire form deleted successfully",
            data: deletedHireForm,
        });
    } catch (error) {
        console.error("Error deleting hire form:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});

module.exports = router;