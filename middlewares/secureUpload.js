// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const ALLOWED_MIME_TYPES = [
//   "application/pdf",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// ];

// const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

// const MAGIC_BYTES = {
//   pdf: [0x25, 0x50, 0x44, 0x46],
//   doc: [0xd0, 0xcf, 0x11, 0xe0],
//   docx: [0x50, 0x4b, 0x03, 0x04],
// };

// /**
//  * Read first N bytes of a file to check magic bytes
//  */
// function readMagicBytes(filePath, numBytes = 8) {
//   return new Promise((resolve, reject) => {
//     const buffer = Buffer.alloc(numBytes);
//     const fd = fs.openSync(filePath, "r");
//     try {
//       fs.readSync(fd, buffer, 0, numBytes, 0);
//       resolve(buffer);
//     } catch (err) {
//       reject(err);
//     } finally {
//       fs.closeSync(fd);
//     }
//   });
// }

// /**
//  * Validate magic bytes against known file signatures
//  */
// function validateMagicBytes(buffer, ext) {
//   const bytes = [...buffer];

//   if (ext === ".pdf") {
//     return MAGIC_BYTES.pdf.every((b, i) => bytes[i] === b);
//   }

//   if (ext === ".doc") {
//     return MAGIC_BYTES.doc.every((b, i) => bytes[i] === b);
//   }

//   if (ext === ".docx") {
//     return MAGIC_BYTES.docx.every((b, i) => bytes[i] === b);
//   }

//   return false;
// }

// /**
//  * Check for double extension attacks like: malware.php.pdf, script.exe.docx
//  */
// function hasDoubleExtension(filename) {
//   const parts = filename.split(".");
//   if (parts.length <= 2) return false; // Normal: "resume.pdf"

//   // Dangerous extensions jo middle ma hoy to attack chhe
//   const dangerousExts = [
//     "php",
//     "php3",
//     "php4",
//     "php5",
//     "phtml",
//     "asp",
//     "aspx",
//     "jsp",
//     "exe",
//     "sh",
//     "bat",
//     "cmd",
//     "ps1",
//     "py",
//     "rb",
//     "js",
//     "ts",
//     "html",
//     "htm",
//     "svg",
//     "xml",
//     "json",
//     "sql",
//   ];

//   // Check all parts except the last (real extension)
//   const middleParts = parts.slice(1, -1);
//   return middleParts.some((part) => dangerousExts.includes(part.toLowerCase()));
// }

// // ✅ Upload directory setup
// const UPLOAD_DIR = path.resolve("uploads");
// if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// // ✅ Multer storage config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, UPLOAD_DIR);
//   },
//   filename: (req, file, cb) => {
//     const d = new Date();
//     const pad = (n) => String(n).padStart(2, "0");
//     const datePrefix = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

//     const ext = path.extname(file.originalname).toLowerCase();
//     const base = path.basename(file.originalname, ext);

//     const safeBase = base
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/(^-|-$)/g, "")
//       .substring(0, 50);

//     const filename = `${datePrefix}-${safeBase}-${Date.now()}${ext}`;
//     cb(null, filename);
//   },
// });

// // ✅ Multer fileFilter — First line of defense (MIME type + extension check)
// const fileFilter = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase();

//   // 1. Double extension attack check
//   if (hasDoubleExtension(file.originalname)) {
//     return cb(
//       new Error(
//         "Invalid file: double extension detected (e.g. file.php.pdf is not allowed)",
//       ),
//       false,
//     );
//   }

//   // 2. Extension check
//   if (!ALLOWED_EXTENSIONS.includes(ext)) {
//     return cb(
//       new Error(
//         `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed`,
//       ),
//       false,
//     );
//   }

//   // 3. MIME type check
//   if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
//     return cb(
//       new Error(
//         "Invalid file content type. Only PDF and Word documents are allowed",
//       ),
//       false,
//     );
//   }

//   cb(null, true);
// };

// // ✅ Multer instance
// const multerUpload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB max
//     files: 1, // Only 1 file allowed
//   },
// }).single("file");

// /**
//  * ✅ Main secure upload middleware
//  * Usage: router.post("/", secureUpload, async (req, res) => { ... })
//  */
// const secureUpload = (req, res, next) => {
//   multerUpload(req, res, async function (err) {
//     if (err instanceof multer.MulterError) {
//       if (err.code === "LIMIT_FILE_SIZE") {
//         return res.status(400).json({
//           success: false,
//           message: "File too large. Maximum size is 5MB.",
//         });
//       }
//       if (err.code === "LIMIT_FILE_COUNT") {
//         return res.status(400).json({
//           success: false,
//           message: "Only one file can be uploaded at a time.",
//         });
//       }
//       return res.status(400).json({ success: false, message: err.message });
//     }

//     if (err) {
//       return res.status(400).json({
//         success: false,
//         message: err.message || "File upload error",
//       });
//     }

//     // File upload thayi gayu chhe, hu actual bytes check karu chhu
//     if (req.file) {
//       try {
//         const filePath = req.file.path;
//         const ext = path.extname(req.file.originalname).toLowerCase();

//         const magicBuffer = await readMagicBytes(filePath, 8);
//         const isValid = validateMagicBytes(magicBuffer, ext);

//         if (!isValid) {
//           fs.unlink(filePath, () => {});

//           return res.status(400).json({
//             success: false,
//             message:
//               "Invalid file: file content does not match its extension. Upload rejected.",
//           });
//         }

//         console.log(`✅ File validated: ${req.file.filename} (${ext})`);
//       } catch (validationErr) {
//         if (req.file?.path) fs.unlink(req.file.path, () => {});

//         console.error("❌ Magic bytes validation error:", validationErr);
//         return res.status(500).json({
//           success: false,
//           message: "File validation failed. Please try again.",
//         });
//       }
//     }

//     next();
//   });
// };

// module.exports = secureUpload;



// middlewares/secureUpload.js
// ✅ Secure File Upload Middleware
// - Magic bytes (file signature) validation — MIME spoofing ne block kare chhe
// - Extension whitelist
// - File size limit: 5MB
// - Filename sanitization
// - Double extension attack protection
//
// ✅ Usage (default folder: uploads/):
//    const secureUpload = require('./secureUpload');
//    router.post('/', secureUpload(), async (req, res) => { ... })
//
// ✅ Usage (custom folder: uploads/position_apply):
//    const secureUpload = require('./secureUpload');
//    router.post('/', secureUpload('uploads/position_apply'), async (req, res) => { ... })

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const MAGIC_BYTES = {
    pdf:  [0x25, 0x50, 0x44, 0x46],
    doc:  [0xD0, 0xCF, 0x11, 0xE0],
    docx: [0x50, 0x4B, 0x03, 0x04],
};

function readMagicBytes(filePath, numBytes = 8) {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.alloc(numBytes);
        const fd = fs.openSync(filePath, "r");
        try {
            fs.readSync(fd, buffer, 0, numBytes, 0);
            resolve(buffer);
        } catch (err) {
            reject(err);
        } finally {
            fs.closeSync(fd);
        }
    });
}

function validateMagicBytes(buffer, ext) {
    const bytes = [...buffer];
    if (ext === ".pdf")  return MAGIC_BYTES.pdf.every((b, i)  => bytes[i] === b);
    if (ext === ".doc")  return MAGIC_BYTES.doc.every((b, i)  => bytes[i] === b);
    if (ext === ".docx") return MAGIC_BYTES.docx.every((b, i) => bytes[i] === b);
    return false;
}

function hasDoubleExtension(filename) {
    const parts = filename.split(".");
    if (parts.length <= 2) return false;
    const dangerousExts = [
        "php","php3","php4","php5","phtml","asp","aspx","jsp","exe","sh","bat",
        "cmd","ps1","py","rb","js","ts","html","htm","svg","xml","json","sql",
    ];
    return parts.slice(1, -1).some((p) => dangerousExts.includes(p.toLowerCase()));
}

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (hasDoubleExtension(file.originalname)) {
        return cb(new Error("Invalid file: double extension detected (e.g. file.php.pdf is not allowed)"), false);
    }
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Invalid file type. Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed`), false);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error("Invalid file content type. Only PDF and Word documents are allowed"), false);
    }
    cb(null, true);
};

/**
 * ✅ secureUpload — factory function
 * @param {string} subFolder — upload folder (default: "uploads")
 *
 * Usage:
 *   router.post('/', secureUpload(), ...)
 *   router.post('/', secureUpload('uploads/position_apply'), ...)
 */
function secureUpload(subFolder) {
    const uploadDir = path.resolve(subFolder || "uploads");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const datePrefix = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const ext = path.extname(file.originalname).toLowerCase();
            const base = path.basename(file.originalname, ext);
            const safeBase = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 50);
            cb(null, `${datePrefix}-${safeBase}-${Date.now()}${ext}`);
        },
    });

    const multerUpload = multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }).single("file");

    return (req, res, next) => {
        multerUpload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ success: false, message: "File too large. Maximum size is 5MB." });
                }
                if (err.code === "LIMIT_FILE_COUNT") {
                    return res.status(400).json({ success: false, message: "Only one file can be uploaded at a time." });
                }
                return res.status(400).json({ success: false, message: err.message });
            }
            if (err) {
                return res.status(400).json({ success: false, message: err.message || "File upload error" });
            }

            // ✅ Magic bytes validation
            if (req.file) {
                try {
                    const filePath = req.file.path;
                    const ext = path.extname(req.file.originalname).toLowerCase();
                    const magicBuffer = await readMagicBytes(filePath, 8);
                    const isValid = validateMagicBytes(magicBuffer, ext);

                    if (!isValid) {
                        fs.unlink(filePath, () => {});
                        return res.status(400).json({
                            success: false,
                            message: "Invalid file: file content does not match its extension. Upload rejected.",
                        });
                    }
                    console.log(`✅ File validated: ${req.file.filename} (${ext})`);
                } catch (validationErr) {
                    if (req.file?.path) fs.unlink(req.file.path, () => {});
                    console.error("❌ Magic bytes validation error:", validationErr);
                    return res.status(500).json({ success: false, message: "File validation failed. Please try again." });
                }
            }

            next();
        });
    };
}

module.exports = secureUpload;