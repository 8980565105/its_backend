const { CronJob } = require("cron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const imageConfig = require("../config/imageConfig");

// Models
const models = {
    Testimonial: require("../models/testimonials"),
    ExpertiseIndustry: require("../models/expertiseIndustries"),
    EngagementModel: require("../models/engagementModel"),
    CreativeWork: require("../models/portfolio/creativeWork"),
    ServiceTechnologyList: require("../models/ourServices/tecnologySection"),
    OurServicesMain: require("../models/ourServices/ourServiesMain"),
    Service: require("../models/ourServices/ourServies"),
    HomeChooseIts: require("../models/home/choose_its_home"),
    HirePageData: require("../models/hire/hirePageData"),
};

async function downloadImage(url, dest) {
    const writer = fs.createWriteStream(dest);
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

function getNestedValue(obj, path) {
    if (!obj) return [];

    const parts = path.split(".");
    let current = [obj];

    for (const part of parts) {
        let newCurrent = [];
        for (const item of current) {
            if (!item) continue;
            if (part.endsWith("[]")) {
                const key = part.replace("[]", "");
                if (Array.isArray(item[key])) {
                    newCurrent.push(...item[key]);
                }
            } else {
                if (item[part]) {
                    newCurrent.push(item[part]);
                }
            }
        }
        current = newCurrent;
    }

    return current.filter(Boolean);
}

async function backupImages() {
    try {
        const now = new Date();
        const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

        const backupDir = path.join(
            __dirname,
            "..",
            "uploads",
            "image-backup",
            `${date}-${time}`
        );

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        for (const [modelName, fields] of Object.entries(imageConfig)) {
            const model = models[modelName];
            if (!model) {
                console.warn(`⚠️ Model ${modelName} not found`);
                continue;
            }

            const records = await model.find({});
            for (const rec of records) {
                for (const field of fields) {
                    const values = getNestedValue(rec.toObject(), field);
                    for (const url of values) {
                        if (typeof url === "string" && url.startsWith("http")) {
                            const fileName = `${modelName}-${rec._id}-${path.basename(url).split("?")[0]}`;
                            const filePath = path.join(backupDir, fileName);
                            await downloadImage(url, filePath);
                            console.log(`✅ Downloaded: ${fileName}`);
                        }
                    }
                }
            }
        }

        console.log("🎉 Image backup completed successfully.");
    } catch (err) {
        console.error("❌ Error in backupImages:", err);
    }
}

// Run every day at 12:00 PM (noon)
const job = new CronJob(
    "0 12 * * *",   // CRON: minute hour day month dayOfWeek
    backupImages,
    null,
    true,           // start immediately
    "Asia/Kolkata"  // set timezone
);

module.exports = job;
