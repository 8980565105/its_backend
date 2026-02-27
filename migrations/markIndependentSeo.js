const mongoose = require('mongoose');
const SeoManager = require('../models/seo/seo-manager');
const Service = require('../models/ourServices/ourServies');
const HirePageData = require('../models/hire/hirePageData');

const markIndependentSeo = async () => {
    try {
        console.log('🚀 Starting SEO data migration...');

        // 1. Define independent pages (protected)
        const independentSlugs = [
            'home', 'about-us', 'our-services', 'hire', 'our-portfolio',
            'career', 'training', 'blog', 'contact'
        ];

        // 2. Mark independent pages
        const independentResult = await SeoManager.updateMany(
            { slug: { $in: independentSlugs } },
            {
                isAutoManaged: false,
                linkedType: 'independent',
                linkedService: null,
                linkedHirePage: null
            }
        );
        console.log(`✅ Marked ${independentResult.modifiedCount} independent pages`);

        // 3. Get all services and mark their SEO as auto-managed
        const services = await Service.find({});
        let serviceUpdates = 0;

        for (const service of services) {
            const seoEntry = await SeoManager.findOne({ slug: service.slug });
            if (seoEntry) {
                await SeoManager.updateOne(
                    { _id: seoEntry._id },
                    {
                        isAutoManaged: true,
                        linkedType: 'service',
                        linkedService: service._id,
                        linkedHirePage: null
                    }
                );
                serviceUpdates++;
                console.log(`🔗 Linked SEO "${seoEntry.title}" to service "${service.subCategory}"`);
            }
        }
        console.log(`✅ Linked ${serviceUpdates} SEO entries to services`);

        // 4. Get all hire pages and mark their SEO as auto-managed
        const hirePages = await HirePageData.find({});
        let hireUpdates = 0;

        for (const hirePage of hirePages) {
            const seoEntry = await SeoManager.findOne({ slug: hirePage.slug });
            if (seoEntry) {
                await SeoManager.updateOne(
                    { _id: seoEntry._id },
                    {
                        isAutoManaged: true,
                        linkedType: 'hire',
                        linkedService: null,
                        linkedHirePage: hirePage._id
                    }
                );
                hireUpdates++;
                console.log(`🔗 Linked SEO "${seoEntry.title}" to hire page "${hirePage.subCategory}"`);
            }
        }
        console.log(`✅ Linked ${hireUpdates} SEO entries to hire pages`);

        // 5. Mark any remaining SEO entries as independent
        const remainingResult = await SeoManager.updateMany(
            {
                isAutoManaged: { $exists: false },
                linkedType: { $exists: false }
            },
            {
                isAutoManaged: false,
                linkedType: 'independent'
            }
        );
        console.log(`✅ Marked ${remainingResult.modifiedCount} remaining entries as independent`);

        console.log('🎉 SEO data migration completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Independent pages: ${independentResult.modifiedCount}`);
        console.log(`   - Service-linked SEO: ${serviceUpdates}`);
        console.log(`   - Hire-linked SEO: ${hireUpdates}`);
        console.log(`   - Remaining independent: ${remainingResult.modifiedCount}`);

    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Connect to MongoDB and run migration
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ITS');
        console.log('📦 Connected to MongoDB');
        await markIndependentSeo();
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

connectDB();