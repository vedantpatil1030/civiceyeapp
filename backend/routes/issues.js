const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Issue = require('../models/Issue');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/issues';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      location,
      address,
      city,
      state,
      pincode,
      visibility,
      tags
    } = req.body;

    // Parse location coordinates
    const locationData = typeof location === 'string' ? JSON.parse(location) : location;
    
    // Validate coordinates - ensure they are valid numbers
    const longitude = parseFloat(locationData.longitude);
    const latitude = parseFloat(locationData.latitude);
    
    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided. Please ensure location data is valid.'
      });
    }
    
    // Validate coordinate ranges
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range. Longitude must be between -180 and 180, latitude between -90 and 90.'
      });
    }
    
    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    // Create new issue
    const issue = new Issue({
      title,
      description,
      category,
      priority: priority || 'MEDIUM',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
        address,
        city,
        state,
        pincode
      },
      images,
      reportedBy: req.user.id,
      visibility: visibility || 'PUBLIC',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await issue.save();
    
    // Populate user info
    await issue.populate('reportedBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: issue
    });

  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create issue',
      error: error.message
    });
  }
});

// @route   GET /api/issues/feed
// @desc    Get personalized feed of issues for user
// @access  Private
router.get('/feed', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      latitude,
      longitude,
      radius = 50, // km - larger radius for feed
      category,
      includeResolved = false
    } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Build filter query
    let filter = {};

    // Filter by status (default: exclude resolved issues unless requested)
    if (!includeResolved) {
      filter.status = { $ne: 'RESOLVED' };
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Location-based filtering for feed
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusInt = parseInt(radius);

      filter.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInt / 6378.1]
        }
      };
    }

    // Get total count for pagination
    const total = await Issue.countDocuments(filter);

    // Get issues with user upvote information
    const issues = await Issue.aggregate([
      { $match: filter },
      {
        $addFields: {
          upvoteCount: { $size: '$upvotes' },
          commentCount: { $size: '$comments' },
          userHasUpvoted: {
            $in: [req.user._id, '$upvotes']
          },
          isUserIssue: {
            $eq: ['$reportedBy', req.user._id]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'reportedBy',
          foreignField: '_id',
          as: 'reporter',
          pipeline: [
            {
              $project: {
                name: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      { $unwind: '$reporter' },
      {
        $sort: {
          createdAt: -1,
          upvoteCount: -1
        }
      },
      { $skip: skip },
      { $limit: limitInt }
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitInt);
    const hasNextPage = pageInt < totalPages;
    const hasPrevPage = pageInt > 1;

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        feedInfo: {
          radius: radius,
          location: latitude && longitude ? { latitude, longitude } : null,
          category: category || 'all',
          includeResolved
        }
      }
    });

  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed',
      error: error.message
    });
  }
});

// @route   GET /api/issues
// @desc    Get all issues with filters and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      priority,
      latitude,
      longitude,
      radius = 10, // km
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      myIssues
    } = req.query;

    // Build query
    const query = { visibility: 'PUBLIC' };

    // Filter by category
    if (category && category !== 'ALL') {
      query.category = category;
    }

    // Filter by status
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }

    // Filter by user's issues
    if (myIssues === 'true') {
      query.reportedBy = req.user.id;
      delete query.visibility; // Show both public and private for user's own issues
    }

    // Location-based filtering
    if (latitude && longitude) {
      const radiusInRadians = radius / 6371; // Convert km to radians
      query.location = {
        $geoWithin: {
          $centerSphere: [[parseFloat(longitude), parseFloat(latitude)], radiusInRadians]
        }
      };
    }

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Issue.countDocuments(query);

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error.message
    });
  }
});

// @route   GET /api/issues/my
// @desc    Get current user's issues
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Build filter for user's issues
    let filter = { reportedBy: req.user._id };

    // Filter by status if provided
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const total = await Issue.countDocuments(filter);

    // Get user's issues with additional computed fields
    const issues = await Issue.aggregate([
      { $match: filter },
      {
        $addFields: {
          upvoteCount: { $size: '$upvotes' },
          commentCount: { $size: '$comments' }
        }
      },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limitInt }
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitInt);
    const hasNextPage = pageInt < totalPages;
    const hasPrevPage = pageInt > 1;

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your issues',
      error: error.message
    });
  }
});

// @route   GET /api/issues/:id
// @desc    Get issue by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email avatar')
      .populate('upvotes.user', 'name email');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user can view this issue
    if (issue.visibility === 'PRIVATE' && 
        issue.reportedBy._id.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this issue'
      });
    }

    res.json({
      success: true,
      data: issue
    });

  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue',
      error: error.message
    });
  }
});

// @route   PUT /api/issues/:id
// @desc    Update issue
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user can update this issue
    if (issue.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this issue'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'category', 'priority', 'visibility', 'tags'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle tags
    if (req.body.tags) {
      updates.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email avatar');

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: updatedIssue
    });

  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue',
      error: error.message
    });
  }
});

// @route   POST /api/issues/:id/upvote
// @desc    Toggle upvote on issue
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const hasUpvoted = issue.hasUserUpvoted(req.user.id);

    if (hasUpvoted) {
      await issue.removeUpvote(req.user.id);
      res.json({
        success: true,
        message: 'Upvote removed',
        data: { upvoted: false, upvoteCount: issue.upvoteCount }
      });
    } else {
      await issue.addUpvote(req.user.id);
      res.json({
        success: true,
        message: 'Issue upvoted',
        data: { upvoted: true, upvoteCount: issue.upvoteCount }
      });
    }

  } catch (error) {
    console.error('Error toggling upvote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle upvote',
      error: error.message
    });
  }
});

// @route   POST /api/issues/:id/comment
// @desc    Add comment to issue
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    issue.comments.push({
      user: req.user.id,
      comment: comment.trim()
    });

    await issue.save();
    await issue.populate('comments.user', 'name email avatar');

    // Get the last comment (the one we just added)
    const lastComment = issue.comments[issue.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: lastComment
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// @route   DELETE /api/issues/:id
// @desc    Delete issue
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user can delete this issue
    if (issue.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this issue'
      });
    }

    // Delete associated image files
    if (issue.images && issue.images.length > 0) {
      issue.images.forEach(image => {
        const filePath = path.join('uploads/issues', image.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue',
      error: error.message
    });
  }
});

// @route   GET /api/issues/stats/summary
// @desc    Get issue statistics
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
        categories: categoryStats
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;
