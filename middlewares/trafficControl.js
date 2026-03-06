// middlewares/trafficControl.js
const trafficControl = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    
    // Aa bots ane browsers je tame mention karya che tene block karva mate
    const blacklistedAgents = [
        'GPTBot', 
        'OAI-SearchBot', 
        'Firefox/3.8', 
        'Opera/9.95'
    ];

    const isBot = blacklistedAgents.some(agent => userAgent.includes(agent));

    // Jo bot hoy to tene ignore karo athva block karo
    if (isBot) {
        console.log(`[PMTO-BLOCKED] Request from: ${userAgent} for Path: ${req.originalUrl}`);
        return res.status(403).json({ message: "Access Denied for Crawlers" });
    }

    next();
};

module.exports = trafficControl;