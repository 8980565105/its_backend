const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { CronJob } = require('cron');
const axios = require("axios");
const Contact = require('../../models/footer/contact_footer');
const { protect } = require('../../middlewares/auth');
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: API for contact form submissions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       required:
 *         - firstname
 *         - lastname
 *         - email
 *         - phone
 *         - subject
 *         - message
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the contact
 *         firstname:
 *           type: string
 *           example: John
 *         lastname:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         phone:
 *           type: string
 *           example: +91-9876543210
 *         subject:
 *           type: string
 *           enum: 
 *             - Hire Developer(s)
 *             - Web Development
 *             - Mobile App Development
 *             - UI/UX Design
 *             - QA Service
 *             - Digital Marketing
 *             - Other Services
 *           example: Web Development
 *         message: 
 *           type: string
 *           example: I am interested in your services.
 *         fileUrl:
 *           type: string
 *           example: uploads/2025-08-18-resume-123456.pdf
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */


const UPLOAD_DIR = path.resolve('uploads');
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
        const safeBase = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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
            console.log("🚀 ~ uploadMiddleware else ~ err.message: ", err.message);
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error"
            });
        }
        next();
    });
};


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a new contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *               - phone
 *               - subject
 *               - message
 *               - captchaToken
 *             properties:
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: +91-9876543210
 *               subject:
 *                 type: string
 *                 enum: 
 *                   - Hire Developer(s)
 *                   - Web Development
 *                   - Mobile App Development
 *                   - UI/UX Design
 *                   - QA Service
 *                   - Digital Marketing
 *                   - Other Services
 *                 example: Mobile App Development
 *               message: 
 *                 type: string
 *                 example: I want to build a mobile app with your team.
 *               captchaToken:
 *                 type: string
 *                 description: Google reCAPTCHA token
 *                 example: "03AGdBq26K..."
 *               file:
 *                 type: string
 *                 format: binary
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
 *                   example: true
 *                 message: 
 *                   type: string
 *                   example: Contact saved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Bad request (validation, captcha, or file error)
 *       500:
 *         description: Server error
 */

router.post('/', uploadMiddleware, async (req, res) => {
    try {
        const { firstname, lastname, email, subject, phone, message, captchaToken } = req.body;
        console.log("🚀 ~ message:", message)
        console.log("🚀 ~ phone:", phone)
        console.log("🚀 ~ subject:", subject)
        console.log("🚀 ~ email:", email)
        console.log("🚀 ~ lastname:", lastname)
        console.log("🚀 ~ firstname:", firstname)
        // console.log("🚀 ~ req.body:", req.body)
        const fileUrl = req.file ? path.join('uploads', req.file.filename) : null;
        // check evry thing avialble or not   
        if (!firstname || !lastname || !email || !phone || !subject || !message) {
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

        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            null, // no JSON body, Google expects form-encoded
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



        const newContact = new Contact({
            firstname,
            lastname,
            email,
            phone,
            subject,
            message,
            fileUrl,
        });

        await newContact.save();

        let adminMailOptions = {
            // from: email,
            // to: process.env.EMAIL_USER, // ✅ Replace with your admin email
            from: `"${firstname} ${lastname}" <${email}>`, // ✅ user who submitted the form
            to: process.env.EMAIL_USER,                   // ✅ goes to your company inbox
            subject: "📩 New Contact Form Submission",
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:700px; margin:auto;">
                    <h2 style="color:#333;">New Contact Request</h2>
                    <p>You have received a new contact form submission:</p>
      
                    <table style="width:100%; border-collapse: collapse; margin-top:15px;">
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>First Name:</b></td><td style="padding:8px; border:1px solid #ddd;">${firstname}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Last Name:</b></td><td style="padding:8px; border:1px solid #ddd;">${lastname}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Email:</b></td><td style="padding:8px; border:1px solid #ddd;">${email}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Phone:</b></td><td style="padding:8px; border:1px solid #ddd;">${phone}</td></tr>
                        <tr><td style="padding:8px; border:1px solid #ddd;"><b>Subject:</b></td><td style="padding:8px; border:1px solid #ddd;">${subject}</td></tr>
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

        // Send to admin
        await transporter.sendMail(adminMailOptions);

        let userMailOptions = {
            from: `"Inspire Techno Solution" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: " Thank you for reaching out to us ",
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <img  src="cid:companylogo" alt="Inspire Techno Solution" style="width:120px;"/>
                    </div>
                    <h2 style="color:#333;">Hi ${firstname},</h2>
                    <p style="font-size:15px; color:#444; line-height:1.6;">
                        Thank you for contacting <b>Inspire Techno Solution</b> with the subject:
                        <br/><b style="color:#d35400;">${subject}</b>
                    </p>
                    <p style="font-size:15px; color:#444; line-height:1.6;">
                        We have received your message and one of our specialists will reach out to you shortly.
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
            attachments: [  // ✅ Added comma before this
                {
                    filename: 'logo.png',
                    path: path.join(__dirname, '../../assets/logo.png'), // make sure logo exists here
                    cid: 'companylogo' // must match src="cid:companylogo"
                }
            ]
        };


        // Send to user
        await transporter.sendMail(userMailOptions);

        res.status(201).json({
            success: true,
            message: "Contact saved successfully",
            data: newContact,
        });


    } catch (error) {
        console.error('❌ Error saving contact:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact submissions (with pagination, search, and filtering)
 *     tags: [Contact]
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
 *           enum: 
 *             - Hire Developer(s)
 *             - Web Development
 *             - Mobile App Development
 *             - UI/UX Design
 *             - QA Service
 *             - Digital Marketing
 *             - Other Services
 *         description: Filter contacts by subject (category)
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Search term for firstname, lastname, email, or subject
 *     responses:
 *       200:
 *         description: List of contacts with pagination metadata
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
 *                     $ref: '#/components/schemas/Contact'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                     total:
 *                       type: integer
 *                       example: 42
 *       500:
 *         description: Server error
 */


router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category = '', value = '' } = req.query;
        let query = {};
        if (category) {
            query = {
                ...query,
                subject: category
            }
        }

        if (value) {
            const regex = new RegExp(value, 'i');
            query = {
                ...query,
                $or: [
                    { firstname: regex },
                    { lastname: regex },
                    { email: regex },
                    { subject: regex },
                ]
            }
        }

        const skip = (page - 1) * limit;
        const [contact, total] = await Promise.all([
            Contact.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Contact.countDocuments(query),
        ])
        res.json({
            success: true,
            data: contact,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error("Get contact user error: ", error);
        res.status(500).json({ Success: false, message: "Server Error" });
    }
})

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact submission by ID
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message: 
 *                   type: string
 *                   example: Contact deleted successfully
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const id = req.params.id;

        //check record is or not
        const contact = await Contact.findById(id);
        if (!contact) {
            return res.status(404).json({
                success: false, message: "Contact not found"
            });
        }
        if (contact.fileUrl) {
            const absolutePath = path.isAbsolute(contact.fileUrl)
                ? contact.fileUrl
                : path.join(process.cwd(), contact.fileUrl);

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
        const contactD = await Contact.findByIdAndDelete(id);
        if (!contactD) {
            return res.status(404).json({
                success: false, message: "Contact not found"
            });
        }


        res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error) {
        console.error("Delete contact user error: ", error);
        res.status(500).json({ Success: false, message: "Server Error" });
    }
})




module.exports = router;


/*


      ${fileUrl
                    ? `<p><b>Attached File:</b> <a href="${process.env.SERVER_URL}/${fileUrl}" target="_blank">Download</a></p>`
                    : ""
                }
*/