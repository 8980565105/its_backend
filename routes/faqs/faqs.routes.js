const express = require("express");
const FaqModel = require("../../models/faqs/faqs.model");
const { protect } = require("../../middlewares/auth");

const router = express.Router();

//create route
router.post("/", protect, async (req, res) => {
  try {
    const { categories, title, answer } = req.body;

    if (!categories || !title || !answer) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existingFaq = await FaqModel.findOne({ title });
    if (existingFaq) {
      return res.status(400).json({
        success: false,
        message: "Title already exists",
      });
    }

    const faq = new FaqModel({
      categories,
      title,
      answer,
    });

    await faq.save();
    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

//category fetch route
router.get("/categories", async (req, res) => {
  try {
    // અહીં 'faqs' ને બદલે 'FaqModel' વાપરવું કારણ કે તમે ઉપર એ જ નામ આપ્યું છે
    const rawCategories = await FaqModel.distinct("categories");

    // જો ડેટાબેઝ ખાલી હોય અથવા કેટેગરીઝ ન મળે
    if (!rawCategories || rawCategories.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // ડેટા ક્લીનઅપ: null કાઢવા, સ્પેસ કાઢવી અને યુનિક વેલ્યુ રાખવી
    const cleanCategories = [
      ...new Set(
        rawCategories
          .filter(Boolean)
          .map((item) => item.toString().trim())
          .filter((item) => item.length > 0),
      ),
    ];

    // સોર્ટિંગ (A to Z)
    cleanCategories.sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );

    res.status(200).json({
      success: true,
      data: cleanCategories,
    });
  } catch (error) {
    console.error("❌ Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
      error: error.message,
    });
  }
});

//admin gaet route
router.get("/admin", async (req, res) => {
  try {
    const { page = 1, limit = 10, category = "" } = req.query;

    const query = {};
    if (category) query.categories = category;
    const skip = (page - 1) * limit;

    // અહીં રિઝલ્ટ વેરીએબલનું નામ 'faqData' રાખ્યું છે
    const [faqData, total] = await Promise.all([
      FaqModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      FaqModel.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: faqData,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("❌ Error getting faqs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//fronted get route
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category = "" } = req.query;

    const query = {};
    if (category) query.categories = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [faqData, total] = await Promise.all([
      FaqModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      FaqModel.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: faqData,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("❌ Error getting faqs:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// edit route
router.put("/:id", protect, async (req, res) => {
  try {
    const { categories, title, answer } = req.body;

    const existingFaq = await FaqModel.findOne({
      title,
      _id: { $ne: req.params.id },
    });

    if (existingFaq) {
      return res.status(400).json({
        success: false,
        message: "આ Title સાથે FAQ પહેલેથી અસ્તિત્વમાં છે",
      });
    }

    const updateData = {
      categories,
      title,
      answer,
    };

    const updatedFaq = await FaqModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedFaq) {
      return res.status(404).json({
        success: false,
        message: "FAQS not found",
      });
    }

    res.json({
      success: true,
      message: "FAQ updeted successfully",
      data: updatedFaq,
    });
  } catch (error) {
    console.error("❌ Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

//delete route
router.delete("/:id", protect, async (req, res) => {
  try {
    const faq = await FaqModel.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ મળ્યો નથી (FAQ not found)",
      });
    }

    res.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "(Server error)",
      error: error.message,
    });
  }
});

module.exports = router;
