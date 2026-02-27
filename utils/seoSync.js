const SeoManager = require('../models/seo/seo-manager');
const Service = require('../models/ourServices/ourServies');
const HirePageData = require('../models/hire/hirePageData');

/**
 * Sync SEO data when service/hire pages are created or updated
 */
/**
 * Sync SEO data when service/hire pages are created or updated
 */
const syncSeoData = async (subCategory, slug, title = null, type = 'service', linkedId = null) => {
    try {
        const seoTitle = subCategory || title;

        // 🔥 FIX: Explicitly map the type to the correct schema field name.
        const linkFieldMap = {
            service: 'linkedService',
            hire: 'linkedHirePage'
        };
        const linkField = linkFieldMap[type];

        // If the type is invalid, we can't proceed.
        if (!linkField) {
            throw new Error(`Invalid linkedType provided: ${type}`);
        }

        // 1. First check by linked entity ID (this is the most reliable way)
        let existingSeo;
        if (linkedId) {
            existingSeo = await SeoManager.findOne({ [linkField]: linkedId });
        }

        // 2. If not found by ID (e.g., an old record), check by the slug being updated.
        if (!existingSeo) {
            // This will check for an independent SEO entry with a matching slug.
            existingSeo = await SeoManager.findOne({ slug });
        }


        if (existingSeo) {
            // Case 1: Convert an independent SEO entry to auto-managed.
            if (!existingSeo.isAutoManaged && existingSeo.linkedType === 'independent') {
                console.log(`🔄 Converting independent SEO to auto-managed for slug: ${slug}`);

                existingSeo.title = seoTitle;
                existingSeo.slug = slug;
                existingSeo.seo_title = seoTitle;
                existingSeo[linkField] = linkedId; // Use corrected field name
                existingSeo.linkedType = type;
                existingSeo.isAutoManaged = true;

                await existingSeo.save();
                return existingSeo;
            }

            // Case 2: Normal update for an existing auto-managed entry.
            if (existingSeo.isAutoManaged || existingSeo.linkedType === type) {
                console.log(`✅ Found existing auto-managed SEO. Updating for slug: ${slug}`);

                existingSeo.title = seoTitle;
                existingSeo.slug = slug;
                // existingSeo.seo_title = seoTitle;
                existingSeo[linkField] = linkedId; // Use corrected field name
                existingSeo.linkedType = type;
                existingSeo.isAutoManaged = true;
                await existingSeo.save();
            }
            return existingSeo;

        } else {
            // Case 3: Create a brand new auto-managed SEO entry.
            console.log(`🆕 No existing SEO found. Creating new entry for slug: ${slug}`);
            const newSeo = new SeoManager({
                title: seoTitle,
                slug: slug,
                seo_keyphrase: seoTitle,
                seo_title: seoTitle,
                meta_description: `Learn more about ${seoTitle} - professional services and solutions`,
                cover_image: '',
                [linkField]: linkedId, // Use corrected field name
                linkedType: type,
                isAutoManaged: true
            });
            await newSeo.save();
            return newSeo;
        }
    } catch (error) {
        console.error('Error syncing SEO data:', error);
        throw error;
    }
};

/**
 * Update linked service/hire when SEO is changed (only for auto-managed)
 */
const updateLinkedEntity = async (seoSlug, newSlug, newTitle) => {
    try {
        const seoEntry = await SeoManager.findOne({ slug: seoSlug });

        // Only update if it's auto-managed service/hire SEO
        if (!seoEntry || !seoEntry.isAutoManaged || seoEntry.linkedType === 'independent') {
            return null;
        }

        let updatedEntity = null;

        // Update the linked service
        if (seoEntry.linkedService) {
            updatedEntity = await Service.findByIdAndUpdate(
                seoEntry.linkedService,
                {
                    slug: newSlug,
                    ...(seoEntry.linkedType === 'service' && { subCategory: newTitle })
                },
                { new: true }
            );
        }
        // Update the linked hire page
        else if (seoEntry.linkedHirePage) {
            updatedEntity = await HirePageData.findByIdAndUpdate(
                seoEntry.linkedHirePage,
                {
                    slug: newSlug,
                    ...(seoEntry.linkedType === 'hire' && { subCategory: newTitle })
                },
                { new: true }
            );
        }

        return updatedEntity;
    } catch (error) {
        console.error('Error updating linked entity:', error);
        throw error;
    }
};

/**
 * Safe delete - only delete INDEPENDENT SEO entries
 * AUTO-MANAGED entries should NOT be deleted from SEO Manager
 */
const safeDeleteSeoData = async (slug) => {
    try {
        const seoEntry = await SeoManager.findOne({ slug });

        // 🆕 FIXED: Only delete if it's INDEPENDENT (not auto-managed)
        if (seoEntry && !seoEntry.isAutoManaged) {
            await SeoManager.findOneAndDelete({ slug });
            return true;
        }

        // 🆕 AUTO-MANAGED: Return false to indicate deletion was blocked
        if (seoEntry && seoEntry.isAutoManaged) {
            console.log(`🚫 Blocked deletion of auto-managed SEO: ${slug}`);
            return false;
        }

        return true; // Entry didn't exist anyway
    } catch (error) {
        console.error('Error deleting SEO data:', error);
        throw error;
    }
};

/**
 * Force delete - for service/hire page deletions (removes auto-managed SEO)
 */
const forceDeleteSeoData = async (slug) => {
    try {
        await SeoManager.findOneAndDelete({ slug });
        return true;
    } catch (error) {
        console.error('Error force deleting SEO data:', error);
        throw error;
    }
};

module.exports = {
    syncSeoData,
    deleteSeoData: safeDeleteSeoData, // For SEO Manager deletions
    forceDeleteSeoData, // For service/hire page deletions
    updateLinkedEntity
};