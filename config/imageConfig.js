// config/imageConfig.js
module.exports = {
  // ✅ Testimonials
  Testimonial: ["image"],

  // ✅ ExpertiseIndustries
  ExpertiseIndustry: ["image"],

  // ✅ EngagementModel
  EngagementModel: ["modelImage"],

  // ✅ seo-manager 
  SeoManager: ["cover_image"],

  // ✅ CreativeWork
  CreativeWork: ["image"],

  // ✅ ServiceTechnologyList
  ServiceTechnologyList: ["image"],

  // ✅ OurServicesMain
  OurServicesMain: [
    "heroSections.image",
    "heroSections.points[].image",
    "technologyDetails.image",
    "technologyDetails.technologyDetail[].image",
    "technologyDetails.developmentDetail[].image"
  ],

  // ✅ Service (complex one)
  Service: [
    "contentBlocks[].image",
    "WhyWorkWithThis.image",
    "whyCompanyPerfersThis.content[].image",
  ],

  // ✅ HomeChooseIts
  HomeChooseIts: ["image"],

  // ✅ HirePageData
  HirePageData: [
    "successSpeacks.image",
    "hireDadiated.image",
    "unloackPower.image",
  ],

  // ✅ OpenningPosition
  OpenningPosition: ["image"],

  // ✅ CareerContent
  CareerContent: [
    "heroSection.image",
    "careerAtIts.image",
    "whyJoinIts.points[].image",
  ],

  // ✅ Blog
  Blog: ["image", "cover_image"],

  // ✅ AboutUs
  AboutUs: [
    "heroSection.points[].image",
    "whoWeAre.image",
    "goals.missionImage",
    "goals.visionImage",
    "goals.valuesImage",
  ],

  // ✅ NavbarGroupTabImageManage
  NavbarGroupTabImageManage: ["image"],

  // ✅ User
  User: ["profile_picture"],

  // ✅ HireMainPageData
  HireMainPageData: [
    "developmentTeamSection.image",
    "dedicatedDeveloperSection.services[].serviceItemBox[].image",
    "whyHireDeveloperforYourProject.detailBox[].image",
    "whyChooseItsForDedicatedResources.detailBox[].image"
  ],

  // ✅ PortfolioContent
  PortfolioContent: [
    "heroSection.image",
    "heroSection.points[].image"
  ],

  // ✅ TrainingMainPageData
  TrainingMainPageData: [
    "heroSection.image",
    "aboutusSection.image",
    "itsInstituteFacilitiesSection.points[].image",
    "rightCoursePickSection.cardBox[].image",
    "rightCoursePickSection.detailbox[].image"
  ],

  // ✅ HomePageData
  HomePageData: [
    "heroSecton.image",
    "heroSecton.technologySection[].image",
    "reasonsToChoose.deatailBox[].image",
    "aboutOurCompany.deatailBox[].image",
    "aboutOurCompany.image",
    "aboutOurCompany.buttonContent.image",
    "overseasWebAgencies.image"
  ]
};