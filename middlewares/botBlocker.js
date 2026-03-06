// middlewares/botBlocker.js
const botBlocker = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    
    // Je bots tamne pareshan kare chhe emna list
    const forbiddenBots = ['GPTBot', 'OAI-SearchBot', 'Opera/9.95', 'Firefox/3.8'];

    const isBot = forbiddenBots.some(bot => userAgent.includes(bot));

    if (isBot) {
        console.log(`[PMTO-Blocked]: Request from ${userAgent} blocked for path ${req.originalUrl}`);
        return res.status(403).send('SEO data not found for this slug'); 
    }

    next();
};

module.exports = botBlocker;