// MongoDB connection using Mongoose (CommonJS)
const mongoose = require('mongoose');
// const url = process.env.MONGO_URI || 'mongodb://localhost:27017/ITS';
const url = process.env.MONGO_URI || 'mongodb+srv://ITS:Dishant%4012345@cluster0.vyareyd.mongodb.net/ITS?retryWrites=true&w=majority';

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

    
    