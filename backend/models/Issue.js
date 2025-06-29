const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Issue category is required'],
    enum: [
      'INFRASTRUCTURE',
      'SANITATION',
      'TRAFFIC',
      'ENVIRONMENT',
      'UTILITIES',
      'SAFETY',
      'TRANSPORT',
      'CLEANLINESS',
      'GOVERNANCE',
      'OTHER'
    ]
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required']
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    }
  },
  images: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    upvotedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    commentedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PUBLIC'
  },
  tags: [{
    type: String,
    trim: true
  }],
  adminNotes: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  },
  estimatedResolutionDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Index for efficient querying
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ createdAt: -1 });

// Virtual for upvote count
issueSchema.virtual('upvoteCount').get(function() {
  return this.upvotes ? this.upvotes.length : 0;
});

// Virtual for comment count
issueSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Method to check if user has upvoted
issueSchema.methods.hasUserUpvoted = function(userId) {
  return this.upvotes.some(upvote => upvote.user.toString() === userId.toString());
};

// Method to add upvote
issueSchema.methods.addUpvote = function(userId) {
  if (!this.hasUserUpvoted(userId)) {
    this.upvotes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove upvote
issueSchema.methods.removeUpvote = function(userId) {
  this.upvotes = this.upvotes.filter(upvote => upvote.user.toString() !== userId.toString());
  return this.save();
};

// Pre-save middleware to update resolvedAt when status changes to resolved
issueSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'RESOLVED' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status !== 'RESOLVED') {
      this.resolvedAt = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
