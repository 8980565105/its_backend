const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const axios = require("axios");
const ApplyPosition = require('../../models/career/applyForPosition');
const { protect } = require('../../middlewares/auth');
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const router = express.Router();

const UPLOAD_DIR = path.resolve('uploads/position_apply');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Format: YYYY-MM-DD-original-name.ext (with timestamp to avoid collisions)
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const datePrefix = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const safeBase = base
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Add timestamp so two uploads with same name on same day don't overwrite
        const filename = `${datePrefix}-${safeBase}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

// File filter: only PDF/DOC/DOCX
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and DOC/DOCX files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single("file");

// Custom middleware for Multer error handling
const uploadMiddleware = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.message == 'File too large') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 5MB.',
                });
            }
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error"
            });
        }
        next();
    })
}

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
 *   name: ApplyPosition
 *   description: API for job applications
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApplyPosition:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - graduation
 *         - experience
 *         - positionApplied
 *         - currentCTC
 *         - noticePeriod
 *         - message
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the application
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         phone:
 *           type: string
 *           example: +91-9876543210
 *         graduation:
 *           type: string
 *           example: B.Tech Computer Science
 *         experience:
 *           type: string
 *           example: 2 Years
 *         positionApplied:
 *           type: string
 *           description: ID of the job position applied for
 *           example: 66b54c734b18a5a90f67a12c
 *         currentCTC:
 *           type: string
 *           example: 5 LPA
 *         noticePeriod:
 *           type: string
 *           example: 2 Months
 *         message: 
 *           type: string
 *           example: I am very excited to join your company.
 *         fileUrl:
 *           type: string
 *           example: uploads/position_apply/2025-08-18-resume-123456.pdf
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/applyPosition:
 *   post:
 *     summary: Submit a new job application
 *     tags: [ApplyPosition]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - graduation
 *               - experience
 *               - positionApplied
 *               - currentCTC
 *               - noticePeriod
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
 *               graduation:
 *                 type: string
 *                 example: B.Tech Computer Science
 *               experience:
 *                 type: string
 *                 example: 2 Years
 *               positionApplied:
 *                 type: string
 *                 example: 66b54c734b18a5a90f67a12c
 *               currentCTC:
 *                 type: string
 *                 example: 5 LPA
 *               noticePeriod:
 *                 type: string
 *                 example: 2 Months
 *               message: 
 *                 type: string
 *                 example: I am very excited to join your company.
 *               captchaToken:
 *                 type: string
 *                 description: Google reCAPTCHA token
 *                 example: "03AGdBq26K..."
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Job application submitted successfully
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
 *                   $ref: '#/components/schemas/ApplyPosition'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

router.post('/', uploadMiddleware, async (req, res) => {
    try {
        const { name, email, phone, graduation, experience, positionApplied, currentCTC, noticePeriod, message, captchaToken } = req.body;
        const fileUrl = req.file ? path.join('uploads/position_apply', req.file.filename) : null;
        // check evry thing avialble or not
        if (!name || !email || !phone || !graduation || !experience || !positionApplied || !currentCTC || !noticePeriod || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
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

        const newApplyPosition = new ApplyPosition({
            name,
            email,
            phone,
            graduation,
            experience,
            positionApplied,
            currentCTC,
            noticePeriod,
            message,
            fileUrl: fileUrl || '',
        })

        // Save and populate job position
        const savedApp = await newApplyPosition.save();
        const populatedApp = await savedApp.populate('positionApplied', 'name qualifications experience');

        // --- Admin Mail ---
        let adminMailOptions = {
            from: `"${name}" <${email}>`,
            to: process.env.EMAIL_USER,  // goes to company inbox
            subject: "📄 New Job Application Received",
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:700px; margin:auto;">
                    <h2 style="color:#333;">New Job Application</h2>
                   <p>You have received a new application for <b>${populatedApp.positionApplied.name}</b></p>
                    <table style="width:100%; border-collapse: collapse; margin-top:15px;">
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Name:</b></td><td style="padding:8px; border:1px solid #ddd;">${name}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Email:</b></td><td style="padding:8px; border:1px solid #ddd;">${email}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Phone:</b></td><td style="padding:8px; border:1px solid #ddd;">${phone}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Graduation:</b></td><td style="padding:8px; border:1px solid #ddd;">${graduation}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Experience:</b></td><td style="padding:8px; border:1px solid #ddd;">${experience}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Current CTC:</b></td><td style="padding:8px; border:1px solid #ddd;">${currentCTC}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Notice Period:</b></td><td style="padding:8px; border:1px solid #ddd;">${noticePeriod}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>message: </b></td><td style="padding:8px; border:1px solid #ddd;">${message}</td></tr>
                    </table>
                    <br/>
                    <p style="color:#555;">Best Regards,<br/>Inspire Techno Solution Website</p>
                </div>
            `,
            attachments: fileUrl
                ? [
                    {
                        filename: req.file.filename,
                        path: path.join(process.cwd(), fileUrl),
                    },
                ]
                : [],
        };
        await transporter.sendMail(adminMailOptions);

        // --- User Mail ---
        let userMailOptions = {
            from: `"Inspire Techno Solution" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "✅ Application Received - Inspire Techno Solution",
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <img src="cid:companylogo" alt="Inspire Techno Solution" style="width:120px;"/>
                    </div>
                    <h2 style="color:#333;">Hi ${name},</h2>
                    <p style="font-size:15px; color:#444; line-height:1.6;">
                       Thank you for applying for the position of <b style="color:#d35400;">${populatedApp.positionApplied.name}</b>.
                    </p>
                    <p style="font-size:15px; color:#444; line-height:1.6;">
                        We have received your application and our HR team will review your details shortly.
                    </p>
                    <div style="margin:20px 0; padding:10px; background:#f9f9f9; border-left:4px solid #d35400;">
                        <p style="margin:0; font-size:14px; color:#555;"><b>Your message: </b></p>
                        <p style="margin:5px 0 0; font-size:14px; color:#444;">${message}</p>
                    </div>
                    <p style="color:#555;">Best regards,<br/>The Inspire Techno Solution HR Team</p>
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
            message: "Application Submited successfully",
            data: populatedApp,
        });


    } catch (error) {
        console.error('❌ Error saving contact:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
})

/**
 * @swagger
 * /api/applyPosition:
 *   get:
 *     summary: Get all job applications
 *     tags: [ApplyPosition]
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
 *         description: Filter applications by positionApplied ID
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Search term to match against name, email, experience, or graduation
 *     responses:
 *       200:
 *         description: List of job applications with pagination
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
 *                     $ref: '#/components/schemas/ApplyPosition'
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
        const { page = 1, limit = 10, category = '', value = '' } = req.query;

        let query = {};

        // Filter by category (positionApplied ID)
        if (category) {
            query.positionApplied = category;
        }

        // Search filter across multiple fields
        if (value) {
            const regex = new RegExp(value, 'i'); // case-insensitive partial match
            query.$or = [
                { name: regex },
                { email: regex },
                { experience: regex },
                { graduation: regex },
            ];
        }

        const skip = (page - 1) * limit;

        const [applyedPosition, total] = await Promise.all([
            ApplyPosition.find(query)
                .populate('positionApplied', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            ApplyPosition.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: applyedPosition,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error("Get applyPosition error: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}); 


// ✅ Get distinct job positions (using populate)
router.get("/positions", async (req, res) => {
    try {
        // populate positionApplied from JobPosition model
        const applications = await ApplyPosition.find()
            .populate("positionApplied", "name qualifications experience");

        // extract unique positions
        const positionsMap = new Map();

        applications.forEach(app => {
            if (app.positionApplied) {
                positionsMap.set(app.positionApplied._id.toString(), app.positionApplied);
            }
        });

        const uniquePositions = Array.from(positionsMap.values());

        res.json({ success: true, data: uniquePositions });
    } catch (error) {
        console.error("Error fetching positions:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


/**
 * @swagger
 * /api/applyPosition/positions:
 *   get:
 *     summary: Get distinct job positions applied for
 *     tags: [ApplyPosition]
 *     responses:
 *       200:
 *         description: List of distinct job positions
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
 *                       _id:
 *                         type: string
 *                         description: Position ID
 *                       name:
 *                         type: string
 *                       qualifications:
 *                         type: string
 *                       experience:
 *                         type: string
 *       500:
 *         description: Server error
 */

// ✅ Then keep your ID route after
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const applyPosition = await ApplyPosition.findById(id)
            .populate('positionApplied', 'name qualifications experience');

        if (!applyPosition) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        res.status(200).json({
            success: true,
            data: applyPosition
        });
    } catch (error) {
        console.error("Get applyPosition by ID error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


/**
 * @swagger
 * /api/applyPosition/{id}:
 *   delete:
 *     summary: Delete a job application by ID
 *     tags: [ApplyPosition]
 *     security:
 *       - bearerAuth: []   # Protect middleware is used
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Job application deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message: 
 *                   type: string
 *                   example: ApplyPosition deleted successfully
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const id = req.params.id;
        const applyPosition = await ApplyPosition.findById(id);
        if (!applyPosition) {
            return res.status(404).json({
                success: false,
                message: "ApplyPosition not found"
            });
        }
        if (applyPosition.fileUrl) {
            const absolutePath = path.isAbsolute(applyPosition.fileUrl)
                ? applyPosition.fileUrl
                : path.join(process.cwd(), applyPosition.fileUrl);
            try {
                await fs.promises.unlink(absolutePath);
                console.log(`🗑 Deleted file: ${absolutePath}`);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error("❌ File delete error:", err);
                } else {
                    console.warn(`⚠️ File not found (already gone): ${absolutePath}`);
                }
            }
        }
        const deletedApplyPosition = await ApplyPosition.findByIdAndDelete(id);
        if (!deletedApplyPosition) {
            return res.status(404).json({
                success: false,
                message: "ApplyPosition not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "ApplyPosition deleted successfully"
        });
    } catch (error) {
        console.error("Delete contact user error: ", error);
        res.status.json({
            Success: false,
            message: "Server Error"
        })
    }
})



module.exports = router;