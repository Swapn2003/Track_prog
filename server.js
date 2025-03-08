const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const GoogleSheetsService = require('./utils/googleSheets');

const app = express();

// CORS configuration
const corsOptions = {
    origin: ['https://track-prog-frontend.onrender.com', 'http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Google Sheets service
let googleSheetsService;
try {
    console.log('Loading Google credentials...');
    const credentials = require('./google-credentials.json');
    googleSheetsService = new GoogleSheetsService(credentials);
    console.log('Google Sheets service initialized successfully');
} catch (error) {
    console.error('Error loading Google credentials:', error);
    console.error('Make sure google-credentials.json exists in the root directory');
}

// MongoDB Connection with better error handling
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Successfully connected to MongoDB Atlas');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Call the connect function
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    folderId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password, folderId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            folderId
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id, folderId: user.folderId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                folderId: user.folderId
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id, folderId: user.folderId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                folderId: user.folderId
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Middleware to protect routes
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Protected route example
app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// DSA Entry Schema
const dsaEntrySchema = new mongoose.Schema({
    topic: String,
    title: String,
    description: String,
    problemLink: String,
    approach: String,
    code: String,
    timeComplexity: String,
    spaceComplexity: String,
    isStarred: { type: Boolean, default: false },
    isBasic: { type: Boolean, default: false },
    sheetRowIndex: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Add a method to get unique topics
dsaEntrySchema.statics.getTopics = function(userId) {
    return this.distinct('topic', { userId });
};

const DSAEntry = mongoose.model('DSAEntry', dsaEntrySchema);

// Routes
// Get all unique topics
app.get('/api/topics', authMiddleware, async (req, res) => {
    try {
        const topics = await DSAEntry.getTopics(req.user.userId);
        res.json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get entries by topic
app.get('/api/entries/topic/:topic', authMiddleware, async (req, res) => {
    try {
        const entries = await DSAEntry.find({ 
            topic: req.params.topic,
            userId: req.user.userId 
        }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        console.error('Error fetching entries by topic:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add global search endpoint
app.get('/api/entries/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json([]);
        }

        const entries = await DSAEntry.find({
            userId: req.user.userId,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { topic: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.json(entries);
    } catch (error) {
        console.error('Error searching entries:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/entries', authMiddleware, async (req, res) => {
    try {
        console.log('Creating new entry...');
        const entry = new DSAEntry({
            ...req.body,
            userId: req.user.userId
        });
        
        // Add to Google Sheets if service is available
        if (googleSheetsService) {
            try {
                console.log('Adding entry to Google Sheets...');
                const rowIndex = await googleSheetsService.addEntry(entry, req.user.folderId);
                entry.sheetRowIndex = rowIndex;
                console.log('Entry added to Google Sheets at row:', rowIndex);
            } catch (error) {
                console.error('Error adding to Google Sheets:', error);
                if (error.response) {
                    console.error('Google Sheets API response:', error.response.data);
                }
                // Don't fail the request if Google Sheets fails
            }
        } else {
            console.log('Google Sheets service not available, skipping sheet update');
        }

        console.log('Saving entry to MongoDB...');
        const newEntry = await entry.save();
        console.log('Entry saved successfully');
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error creating entry:', error);
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/entries/:id', authMiddleware, async (req, res) => {
    try {
        console.log('Deleting entry:', req.params.id);
        const entry = await DSAEntry.findOne({ 
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Delete from Google Sheets if service is available
        if (googleSheetsService && entry.sheetRowIndex) {
            try {
                console.log('Deleting entry from Google Sheets row:', entry.sheetRowIndex);
                await googleSheetsService.deleteEntry(entry.sheetRowIndex, req.user.folderId);
                console.log('Entry deleted from Google Sheets');
            } catch (error) {
                console.error('Error deleting from Google Sheets:', error);
                if (error.response) {
                    console.error('Google Sheets API response:', error.response.data);
                }
                // Don't fail the request if Google Sheets fails
            }
        }

        await entry.deleteOne();
        console.log('Entry deleted from MongoDB');
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update entry (star/basic status)
app.patch('/api/entries/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};
        
        // Only allow updating isStarred and isBasic fields
        if ('isStarred' in req.body) update.isStarred = req.body.isStarred;
        if ('isBasic' in req.body) update.isBasic = req.body.isBasic;

        const entry = await DSAEntry.findOneAndUpdate(
            { _id: id, userId: req.user.userId },
            update,
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add update folder ID endpoint
app.patch('/api/auth/update-folder', authMiddleware, async (req, res) => {
    try {
        const { folderId } = req.body;
        if (!folderId) {
            return res.status(400).json({ message: 'Folder ID is required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { folderId },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update token with new folder ID
        const token = jwt.sign(
            { userId: user._id, folderId: user.folderId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                folderId: user.folderId
            }
        });
    } catch (error) {
        console.error('Error updating folder ID:', error);
        res.status(500).json({ message: 'Error updating folder ID' });
    }
});

// Add new topic endpoint
app.post('/api/topics', authMiddleware, async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ message: 'Topic name is required' });
        }

        // Create a new DSA entry as a placeholder for the topic
        const entry = new DSAEntry({
            topic,
            title: 'Topic Created',
            description: 'Initial topic creation',
            userId: req.user.userId,
            problemLink: '',
            approach: '',
            code: '',
            timeComplexity: '',
            spaceComplexity: ''
        });

        await entry.save();
        res.status(201).json({ topic });
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ message: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server with dynamic port
const startServer = async () => {
    try {
        const port = process.env.PORT || 3001;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`API URL: http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 