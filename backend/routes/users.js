const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Issue = require('../models/Issue');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const userStats = await Issue.aggregate([
      { $match: { reportedBy: req.user._id } },
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          resolvedIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          totalUpvotes: { $sum: { $size: '$upvotes' } }
        }
      }
    ]);

    const stats = userStats[0] || {
      totalIssues: 0,
      resolvedIssues: 0,
      totalUpvotes: 0
    };

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          stats
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      address,
      city,
      state,
      pincode,
      preferences
    } = req.body;

    const updateData = {};

    // Only update provided fields
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (preferences !== undefined) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get user's issue statistics
    const userIssues = await Issue.aggregate([
      { $match: { reportedBy: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent issues by user
    const recentIssues = await Issue.find({ reportedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status category createdAt upvotes');

    // Get issues user has upvoted
    const upvotedIssues = await Issue.find({ upvotes: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'name')
      .select('title status category createdAt upvotes reportedBy');

    // Format statistics
    const statusStats = userIssues.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {
      PENDING: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    });

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalIssues: userIssues.reduce((sum, item) => sum + item.count, 0),
          statusBreakdown: statusStats
        },
        recentIssues: recentIssues.map(issue => ({
          ...issue.toObject(),
          upvoteCount: issue.upvotes.length
        })),
        upvotedIssues: upvotedIssues.map(issue => ({
          ...issue.toObject(),
          upvoteCount: issue.upvotes.length
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Verify password
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete user's issues
    await Issue.deleteMany({ reportedBy: req.user._id });

    // Remove user from upvotes and comments
    await Issue.updateMany(
      { upvotes: req.user._id },
      { $pull: { upvotes: req.user._id } }
    );

    await Issue.updateMany(
      { 'comments.author': req.user._id },
      { $pull: { comments: { author: req.user._id } } }
    );

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

module.exports = router;
