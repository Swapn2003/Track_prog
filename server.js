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
    subtopics: [String], // Array of subtopic tags
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

// Target Company Schema
const targetCompanySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Planning', 'Preparing', 'Applied', 'Interviewing'],
        default: 'Planning'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    notes: {
        type: String,
        default: ''
    },
    tips: {
        type: String,
        default: ''
    },
    interviewExperiences: [{
        date: Date,
        round: String,
        notes: String,
        outcome: {
            type: String,
            enum: ['Passed', 'Failed', 'Waiting', 'Cancelled'],
            default: 'Waiting'
        }
    }],
    targetDate: {
        type: Date
    },
    questions: [{
        name: String,
        url: String,
        status: {
            type: String,
            enum: ['Not Started', 'In Progress', 'Completed'],
            default: 'Not Started'
        },
        notes: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

targetCompanySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add method to get unique topics
dsaEntrySchema.statics.getTopics = function(userId) {
    return this.distinct('topic', { userId });
};

// Add method to get unique subtopics for a topic
dsaEntrySchema.statics.getSubtopics = function(userId, topic) {
    return this.distinct('subtopics', { userId, topic });
};

// Reference Material Schema
const referenceMaterialSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    url: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

referenceMaterialSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const DSAEntry = mongoose.model('DSAEntry', dsaEntrySchema);
const TargetCompany = mongoose.model('TargetCompany', targetCompanySchema);
const ReferenceMaterial = mongoose.model('ReferenceMaterial', referenceMaterialSchema);

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

// Get entries by topic and subtopic
app.get('/api/entries/topic/:topic/subtopic/:subtopic', authMiddleware, async (req, res) => {
    try {
        const entries = await DSAEntry.find({ 
            topic: req.params.topic,
            subtopics: req.params.subtopic,
            userId: req.user.userId 
        }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        console.error('Error fetching entries by topic and subtopic:', error);
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

// Add debug endpoint for Google Sheets service
app.get('/api/debug/sheets-status', authMiddleware, async (req, res) => {
    try {
        if (!googleSheetsService) {
            return res.status(500).json({ 
                status: 'error',
                message: 'Google Sheets service is not initialized'
            });
        }

        // Test the service by trying to list files
        const testResponse = await googleSheetsService.testConnection(req.user.folderId);
        res.json({
            status: 'success',
            message: 'Google Sheets service is working',
            details: testResponse
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error testing Google Sheets service',
            error: error.message,
            details: error.response?.data
        });
    }
});

// Add DSA Entry endpoint
app.post('/api/entries', authMiddleware, async (req, res) => {
    try {
        const folderId = req.user.folderId;
        console.log('\n=== Starting new entry creation ===');
        console.log('User ID:', req.user.userId);
        console.log('Folder ID:', folderId);
        
        if (!folderId) {
            console.error('No folder ID provided');
            return res.status(400).json({ message: 'Folder ID is required. Please update your folder ID in settings.' });
        }

        if (!googleSheetsService) {
            console.error('Google Sheets service not initialized');
            return res.status(500).json({ message: 'Google Sheets service is not initialized' });
        }

        const {
            topic,
            subtopics,
            title,
            description,
            problemLink,
            approach,
            code,
            timeComplexity,
            spaceComplexity,
            isBasic
        } = req.body;

        console.log('Entry data received:', { topic, title, subtopics });

        // First, verify Google Sheets access
        console.log('Verifying Google Sheets access...');
        try {
            await googleSheetsService.testConnection(folderId);
            console.log('Google Sheets access verified');
        } catch (error) {
            console.error('Google Sheets access test failed:', error);
            return res.status(500).json({ 
                message: 'Failed to verify Google Sheets access',
                error: error.message
            });
        }

        console.log('Adding entry to Google Sheet...');
        // Add entry to Google Sheet
        const rowIndex = await googleSheetsService.addEntry({
            topic,
            description,
            problemLink,
            approach,
            code,
            timeComplexity,
            spaceComplexity
        }, folderId);

        console.log('Entry added to sheet at row:', rowIndex);

        // Create MongoDB entry
        const entry = new DSAEntry({
            topic,
            subtopics: subtopics || [],
            title,
            description,
            problemLink,
            approach,
            code,
            timeComplexity,
            spaceComplexity,
            isBasic,
            sheetRowIndex: rowIndex,
            userId: req.user.userId
        });

        console.log('Saving entry to MongoDB...');
        await entry.save();
        console.log('Entry saved successfully');
        console.log('=== Entry creation completed ===\n');

        res.status(201).json(entry);
    } catch (error) {
        console.error('\n=== Error in entry creation ===');
        console.error('Error details:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        console.error('=== End of error details ===\n');

        res.status(500).json({ 
            message: 'Error adding entry', 
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
});

// Update entry endpoint
app.patch('/api/entries/:id', authMiddleware, async (req, res) => {
    try {
        const entryId = req.params.id;
        const updates = req.body;
        
        // Find the entry and verify ownership
        const entry = await DSAEntry.findOne({ _id: entryId, userId: req.user.userId });
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Allow updating isStarred, isBasic, and subtopics fields
        if ('isStarred' in updates) {
            entry.isStarred = updates.isStarred;
        }
        if ('isBasic' in updates) {
            entry.isBasic = updates.isBasic;
        }
        if ('subtopics' in updates) {
            entry.subtopics = updates.subtopics;
        }

        // Update in Google Sheet if needed
        if (entry.sheetRowIndex) {
            await googleSheetsService.updateEntry(entry, req.user.folderId);
        }

        await entry.save();
        res.json(entry);
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ message: 'Error updating entry', error: error.message });
    }
});

// Delete entry endpoint
app.delete('/api/entries/:id', authMiddleware, async (req, res) => {
    try {
        const entryId = req.params.id;
        
        // Find the entry and verify ownership
        const entry = await DSAEntry.findOne({ _id: entryId, userId: req.user.userId });
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Delete from Google Sheet if row index exists
        if (entry.sheetRowIndex) {
            await googleSheetsService.deleteEntry(entry.sheetRowIndex, req.user.folderId);
        }

        await entry.deleteOne();
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ message: 'Error deleting entry', error: error.message });
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

// Target Companies Routes

// Get all target companies for the user
app.get('/api/target-companies', authMiddleware, async (req, res) => {
    try {
        const targetCompanies = await TargetCompany.find({ user: req.user.userId })
            .sort({ updatedAt: -1 });
        
        console.log('Found target companies:', targetCompanies.length);
        
        if (!targetCompanies || targetCompanies.length === 0) {
            return res.json([]);
        }
        
        res.json(targetCompanies);
    } catch (error) {
        console.error('Error fetching target companies:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get a single target company by ID
app.get('/api/target-companies/:id', authMiddleware, async (req, res) => {
    try {
        const targetCompany = await TargetCompany.findById(req.params.id);
        
        if (!targetCompany) {
            return res.status(404).json({ message: 'Target company not found' });
        }
        
        // Ensure the user has permission to view this company
        if (targetCompany.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to access this company' });
        }
        
        res.json(targetCompany);
    } catch (error) {
        console.error('Error fetching target company:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add a new target company
app.post('/api/target-companies', authMiddleware, async (req, res) => {
    try {
        console.log('Creating new target company. Request body:', req.body);
        const { name, status, priority, notes, targetDate, questions } = req.body;
        
        if (!name) {
            console.log('Company name is required');
            return res.status(400).json({ message: 'Company name is required' });
        }

        const targetCompany = new TargetCompany({
            user: req.user.userId,
            name,
            status: status || 'Planning',
            priority: priority || 'Medium',
            notes: notes || '',
            targetDate,
            questions: questions || []
        });

        console.log('Saving new target company:', targetCompany);
        const savedCompany = await targetCompany.save();
        console.log('Target company saved successfully:', savedCompany._id);
        
        res.status(201).json(savedCompany);
    } catch (err) {
        console.error('Error creating target company:', err);
        res.status(500).json({ 
            message: 'Failed to create target company',
            error: err.message 
        });
    }
});

// Update a target company
app.put('/api/target-companies/:id', authMiddleware, async (req, res) => {
    try {
        const { name, status, priority, notes, tips, targetDate, questions, interviewExperiences } = req.body;
        
        let targetCompany = await TargetCompany.findById(req.params.id);
        if (!targetCompany) return res.status(404).json({ msg: 'Target company not found' });
        
        // Make sure user owns the target company
        if (targetCompany.user.toString() !== req.user.userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Create an update object with only the fields that are provided
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (status !== undefined) updateFields.status = status;
        if (priority !== undefined) updateFields.priority = priority;
        if (notes !== undefined) updateFields.notes = notes;
        if (tips !== undefined) updateFields.tips = tips;
        if (targetDate !== undefined) updateFields.targetDate = targetDate;
        if (questions !== undefined) updateFields.questions = questions;
        if (interviewExperiences !== undefined) updateFields.interviewExperiences = interviewExperiences;
        updateFields.updatedAt = Date.now();

        targetCompany = await TargetCompany.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        res.json(targetCompany);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a target company
app.delete('/api/target-companies/:id', authMiddleware, async (req, res) => {
    try {
        const targetCompany = await TargetCompany.findById(req.params.id);
        if (!targetCompany) return res.status(404).json({ msg: 'Target company not found' });
        
        // Make sure user owns the target company
        if (targetCompany.user.toString() !== req.user.userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await targetCompany.deleteOne();
        res.json({ msg: 'Target company removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add/Update a question in a target company
app.post('/api/target-companies/:id/questions', authMiddleware, async (req, res) => {
    try {
        const { name, url, status, notes } = req.body;
        
        const targetCompany = await TargetCompany.findById(req.params.id);
        if (!targetCompany) return res.status(404).json({ msg: 'Target company not found' });
        
        // Make sure user owns the target company
        if (targetCompany.user.toString() !== req.user.userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        targetCompany.questions.push({ name, url, status, notes });
        await targetCompany.save();

        res.json(targetCompany);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get all unique subtopics for a topic
app.get('/api/topics/:topic/subtopics', authMiddleware, async (req, res) => {
    try {
        const topic = req.params.topic;
        const subtopics = await DSAEntry.getSubtopics(req.user.userId, topic);
        res.json(subtopics);
    } catch (error) {
        console.error('Error fetching subtopics:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get reference materials by topic
app.get('/api/reference/:topic', authMiddleware, async (req, res) => {
    try {
        const references = await ReferenceMaterial.find({ 
            topic: req.params.topic,
            user: req.user.userId 
        }).sort({ createdAt: -1 });
        
        res.json(references);
    } catch (error) {
        console.error('Error fetching reference materials:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add reference material
app.post('/api/reference', authMiddleware, async (req, res) => {
    try {
        const { topic, title, content, url } = req.body;
        
        if (!topic || !title || !content) {
            return res.status(400).json({ message: 'Topic, title, and content are required' });
        }
        
        const referenceMaterial = new ReferenceMaterial({
            user: req.user.userId,
            topic,
            title,
            content,
            url: url || ''
        });
        
        const savedMaterial = await referenceMaterial.save();
        res.status(201).json(savedMaterial);
    } catch (error) {
        console.error('Error adding reference material:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update reference material
app.put('/api/reference/:id', authMiddleware, async (req, res) => {
    try {
        const { title, content, url } = req.body;
        
        let reference = await ReferenceMaterial.findById(req.params.id);
        if (!reference) {
            return res.status(404).json({ message: 'Reference material not found' });
        }
        
        // Ensure the user has permission
        if (reference.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to update this reference material' });
        }
        
        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (content !== undefined) updateFields.content = content;
        if (url !== undefined) updateFields.url = url;
        updateFields.updatedAt = Date.now();
        
        reference = await ReferenceMaterial.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );
        
        res.json(reference);
    } catch (error) {
        console.error('Error updating reference material:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete reference material
app.delete('/api/reference/:id', authMiddleware, async (req, res) => {
    try {
        const reference = await ReferenceMaterial.findById(req.params.id);
        
        if (!reference) {
            return res.status(404).json({ message: 'Reference material not found' });
        }
        
        // Ensure the user has permission
        if (reference.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this reference material' });
        }
        
        await reference.deleteOne();
        res.json({ message: 'Reference material removed' });
    } catch (error) {
        console.error('Error deleting reference material:', error);
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