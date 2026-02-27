require("dotenv").config();
const express = require("express");
require("./config/db");
const cors = require("cors");
const helmet = require("helmet");
const port = process.env.PORT || 3000;
const { logger, statusColor } = require("./config/logger");
const swaggerDocs = require("./swagger");
const sitemapRouter = require("./routes/sitemap.routes");
const path = require("path");
// cron jobs
require("./cron/cron_contactCleanup");

// require("./cron/cron_imageBackup");

// Routers
const userRouter = require("./routes/user.routes");
const HomeWhyChooseRouter = require("./routes/home/choose_its.routes");
const EngagementModelRouter = require("./routes/engagementModel.routes");
const TestimonialRouter = require("./routes/Testimonials.routes");
const OpenningPositionRouter = require("./routes/career/openningPosition.routes");
const ContactRouter = require("./routes/footer/contact_footer.routes");
const ServiceRouter = require("./routes/oueServices/service.routes");
const ApplyPositionRouter = require("./routes/career/applyForPosition.routes");
const CreativeWorkRouter = require("./routes/portfolio/creativeWork.routes");
const AboutUsRouter = require("./routes/aboutUs/about-us.routes");
const BlogRouter = require("./routes/blog/blog.routes");
const HireFormRouter = require("./routes/hire/hireForm.routes");
const HirePageRouter = require("./routes/hire/hirepage.routes");
const MasterCourseRouter = require("./routes/training/masterCourse.routes");
const ProgrammingLanguageAndDesignRouter = require("./routes/training/programingLanguageandDesign.routes");
const ServiceTechnologyRouter = require("./routes/oueServices/serviceTechnology.routes");
const ServiceMainRouter = require("./routes/oueServices/serviceMain.routes");
const ExpertiseIndustriesRouter = require("./routes/expertiseIndustries.routes");
const portfolioContentRouter = require("./routes/portfolio/portfolioContent.routes");
const careerContentRouter = require("./routes/career/careerContent.routes");
const seoManagerRouter = require("./routes/seo/seoManager.routes");
const TranningContactFooterRouter = require("./routes/footer/training_contact_footer.routes");
const TranningMainPageRouter = require("./routes/training/trainningMainPageData.routes");
const HomePageDataRouter = require("./routes/home/homePageData.routes");
const HireMainPageDataRoutes = require("./routes/hire/hireMainPageData.routes");
const NavbarGroupTabImageManageRoutes = require("./routes/navbarGroupTabHandel.routes")


const app = express();
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Winston middleware to log requests with colored status
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const coloredStatus = statusColor(res.statusCode);
    logger.info(
      `${req.method} ${req.originalUrl} ${coloredStatus} - ${duration}ms`
    );
  });
  next();
});

// Middleware to set no-cache headers globally
const setNoCache = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

// Apply the middleware globally to all routes
app.use(setNoCache);

// API routes

//  auth api
app.use("/api/auth-user", userRouter);

//  homepage & Global componet api
app.use("/api/homepage", HomePageDataRouter);
app.use("/api/choose_its_home", HomeWhyChooseRouter);
app.use("/api/engagement-model", EngagementModelRouter);
app.use("/api/testimonials", TestimonialRouter);
app.use("/api/expertise-industries", ExpertiseIndustriesRouter);

//  footer from api
app.use("/api/contact", ContactRouter);
app.use("/api/tranning-contact", TranningContactFooterRouter);

//  our-service api
app.use("/api/service", ServiceRouter);
app.use("/api/service-technology", ServiceTechnologyRouter);
app.use("/api/service-main", ServiceMainRouter);

//  career api
app.use("/api/opennig-position", OpenningPositionRouter);
app.use("/api/applyPosition", ApplyPositionRouter);

//  portfolio api
app.use("/api/career-content", careerContentRouter);
app.use("/api/creative-work", CreativeWorkRouter);
app.use("/api/portfolio-content", portfolioContentRouter);

//  aboutUs api
app.use("/api/about-us", AboutUsRouter);

//  blogs api
app.use("/api/blogs", BlogRouter);

//  hire api
app.use("/api/hire-form", HireFormRouter);
app.use("/api/hire-page", HirePageRouter);
app.use("/api/hire-main-page", HireMainPageDataRoutes);

//  training api
app.use("/api/master-courses", MasterCourseRouter);
app.use("/api/programming-language-design", ProgrammingLanguageAndDesignRouter);
app.use("/api/training-main-page", TranningMainPageRouter);

//  seo manager api
app.use("/api/seo-manager", seoManagerRouter);

// navbar 
app.use("/api/navbar-group-tab-image-manage", NavbarGroupTabImageManageRoutes)

app.use("/", sitemapRouter);

//  Swagger Docs
swaggerDocs(app);

// app.get('/', (req, res) => res.send('Server is running!'));

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(port, "0.0.0.0", () =>
  console.log(`Server started on http://localhost:${port}`)
);
