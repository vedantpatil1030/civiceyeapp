import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { authAPI, issuesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { safeImageUri, createImageSource, createImageErrorHandler } from '../utils/imageUtils';

const { width } = Dimensions.get('window');

// Sample posts data - this will later come from your backend
const samplePosts = [
  {
    id: 1,
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      verified: true,
      location: 'Downtown Main St'
    },
    content: 'URGENT: Large pothole on Main Street near the intersection with 5th Ave. Cars are swerving dangerously to avoid it. Already caused one flat tire this morning! 🚧',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    category: 'Infrastructure',
    priority: 'High',
    timestamp: '2 hours ago',
    likes: 47,
    comments: 12,
    reports: 23,
    status: 'Under Review'
  },
  {
    id: 2,
    user: {
      name: 'Michael Chen',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      verified: false,
      location: 'Riverside Park'
    },
    content: 'Third streetlight broken this week on the jogging path. It\'s getting dark earlier and this creates a real safety hazard for evening runners. Please fix ASAP! 🏃‍♂️💡',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    category: 'Safety',
    priority: 'High',
    timestamp: '4 hours ago',
    likes: 33,
    comments: 8,
    reports: 18,
    status: 'Escalated'
  },
  {
    id: 3,
    user: {
      name: 'City Council',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100',
      verified: true,
      location: 'City Hall'
    },
    content: '🎉 GREAT NEWS! The Central Park renovation has been completed 2 weeks ahead of schedule! New playground equipment, updated walking paths, and improved lighting are now ready. Thank you for your patience during construction. Enjoy your beautiful new park! 🌳',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    category: 'Achievement',
    priority: 'Low',
    timestamp: '1 day ago',
    likes: 284,
    comments: 45,
    reports: 0,
    status: 'Completed'
  },
  {
    id: 4,
    user: {
      name: 'Emma Rodriguez',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      verified: false,
      location: 'Community Center'
    },
    content: 'Disappointing to see fresh graffiti on our newly renovated community center. This building serves hundreds of families weekly. Let\'s take pride in our shared spaces! 😔',
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400',
    category: 'Vandalism',
    priority: 'Medium',
    timestamp: '6 hours ago',
    likes: 67,
    comments: 23,
    reports: 31,
    status: 'In Progress'
  },
  {
    id: 5,
    user: {
      name: 'David Park',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
      verified: false,
      location: 'Elm Street School Zone'
    },
    content: 'Cars are speeding through the school zone again! Posted speed limit is 25mph but I\'ve seen cars going 40+. We need speed bumps or better enforcement before someone gets hurt. Our kids deserve safe streets! 🚸',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    category: 'Traffic Safety',
    priority: 'High',
    timestamp: '8 hours ago',
    likes: 89,
    comments: 34,
    reports: 42,
    status: 'Under Review'
  },
  {
    id: 6,
    user: {
      name: 'Lisa Chang',
      avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
      verified: true,
      location: 'City Environmental Dept'
    },
    content: 'UPDATE: The new recycling program starts next Monday! 🌱♻️ Blue bins for recyclables, green for compost, black for regular waste. Pickup schedule remains the same. Together we can reduce our city\'s environmental impact!',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
    category: 'Environment',
    priority: 'Low',
    timestamp: '12 hours ago',
    likes: 156,
    comments: 28,
    reports: 0,
    status: 'Announcement'
  },
  {
    id: 7,
    user: {
      name: 'James Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
      verified: false,
      location: 'Market District'
    },
    content: 'The storm drain on Market Street has been clogged for weeks. Every time it rains, the whole intersection floods. Businesses are losing customers because people can\'t park. This affects our local economy! 🌧️💧',
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400',
    category: 'Infrastructure',
    priority: 'High',
    timestamp: '1 day ago',
    likes: 73,
    comments: 19,
    reports: 28,
    status: 'Escalated'
  },
  {
    id: 8,
    user: {
      name: 'Maria Santos',
      avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
      verified: false,
      location: 'Sunset Boulevard'
    },
    content: 'Amazing community cleanup event this weekend! 🧹✨ Over 200 volunteers showed up to clean Sunset Boulevard. Collected 50 bags of litter and planted 30 new trees. This is what community spirit looks like! Thank you everyone! 💚',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    category: 'Community',
    priority: 'Low',
    timestamp: '2 days ago',
    likes: 198,
    comments: 67,
    reports: 0,
    status: 'Celebration'
  }
];

const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const isDarkMode = useColorScheme() === 'dark';
  const { user, logout } = useAuth();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };

  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const cardBgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const borderColor = isDarkMode ? '#333333' : '#e1e8ed';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Update userData when user changes in AuthContext
    setUserData(user);
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserData(),
        loadFeed()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const user = await authAPI.getUserData();
      setUserData(user);
    } catch (error) {
      console.log('No user data found');
    }
  };

  const loadFeed = async () => {
    try {
      const isLoggedIn = await authAPI.isLoggedIn();
      if (!isLoggedIn) {
        console.log('User not logged in, showing empty feed');
        setPosts([]);
        return;
      }

      const response = await issuesAPI.getFeed({
        page: 1,
        limit: 20,
        includeResolved: false
      });

      if (response.success) {
        // Transform backend data to match frontend format
        const transformedPosts = response.data.issues.map(issue => {
          // Safely construct image URL
          let imageUrl = null;
          if (issue.images && issue.images.length > 0 && issue.images[0].filename) {
            imageUrl = `http://10.0.2.2:3000/uploads/issues/${issue.images[0].filename}`;
          }

          // Safely handle avatar URL
          const avatarUrl = safeImageUri(issue.reporter?.avatar) || 'https://randomuser.me/api/portraits/lego/1.jpg';

          return {
            id: issue._id,
            user: {
              name: issue.reporter?.name || 'Anonymous',
              avatar: avatarUrl,
              verified: issue.reporter?.isVerified || false,
              location: `${issue.city || ''} ${issue.state || ''}`.trim() || issue.address || 'Unknown Location'
            },
            content: issue.description,
            image: safeImageUri(imageUrl),
            category: issue.category,
            priority: issue.priority,
            timestamp: formatTimestamp(issue.createdAt),
            likes: issue.upvoteCount || 0,
            comments: issue.commentCount || 0,
            reports: issue.upvoteCount || 0, // Using upvotes as reports for now
            status: issue.status,
            userHasUpvoted: issue.userHasUpvoted || false,
            isUserIssue: issue.isUserIssue || false,
            issueId: issue._id,
            title: issue.title
          };
        });

        setPosts(transformedPosts);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      // Show sample data if backend is not available
      Alert.alert(
        'Connection Error', 
        'Unable to load real-time data. Please check if the backend server is running.',
        [
          { text: 'OK', onPress: () => setPosts([]) }
        ]
      );
    }
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFeed();
    } catch (error) {
      console.error('Error refreshing feed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Optimistic update
      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              likes: p.userHasUpvoted ? p.likes - 1 : p.likes + 1,
              userHasUpvoted: !p.userHasUpvoted
            }
          : p
      ));

      // Make API call
      await issuesAPI.upvoteIssue(post.issueId);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              likes: p.userHasUpvoted ? p.likes + 1 : p.likes - 1,
              userHasUpvoted: !p.userHasUpvoted
            }
          : p
      ));
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const handleComment = (postId) => {
    Alert.alert('Comments', 'Comments feature coming soon!');
  };

  const handleShare = (post) => {
    Alert.alert(
      'Share Post', 
      `Share "${post.content.substring(0, 50)}..." with others?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => Alert.alert('Shared!', 'Post shared successfully') }
      ]
    );
  };

  const handlePostReport = (post) => {
    Alert.alert(
      'Support This Issue',
      `Add your voice to this ${post.category.toLowerCase()} issue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Support', 
          onPress: () => {
            setPosts(posts.map(p => 
              p.id === post.id 
                ? { ...p, reports: p.reports + 1 }
                : p
            ));
            Alert.alert('Added!', 'Your support has been added to this issue');
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigation is handled automatically by AuthContext
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ff4757';
      case 'MEDIUM': return '#ffa502';
      case 'LOW': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': 
      case 'CLOSED': 
        return '#2ed573';
      case 'IN_PROGRESS': 
        return '#3742fa';
      case 'OPEN': 
        return '#ff4757';
      default: 
        return '#747d8c';
    }
  };

  const renderPost = (post) => (
    <View key={post.id} style={[styles.postCard, { backgroundColor: cardBgColor, borderColor }]}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Image 
          source={createImageSource(post.user.avatar)} 
          style={styles.avatar}
          onError={createImageErrorHandler('Avatar')}
        />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, { color: textColor }]}>{post.user.name}</Text>
            {post.user.verified && <Text style={styles.verifiedBadge}>✓</Text>}
          </View>
          <Text style={styles.location}>📍 {post.user.location}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
        <View style={styles.categoryContainer}>
          <Text style={[styles.categoryText, { backgroundColor: getPriorityColor(post.priority) }]}>
            {post.category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={[styles.postContent, { color: textColor }]}>{post.content}</Text>

      {/* Image */}
      {safeImageUri(post.image) && (
        <Image 
          source={createImageSource(post.image)} 
          style={styles.postImage}
          onError={createImageErrorHandler('Post image')}
        />
      )}

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStatusColor(post.status) }]}>
          ● {post.status}
        </Text>
        <Text style={[styles.priorityText, { color: getPriorityColor(post.priority) }]}>
          {post.priority} Priority
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
        >
          <Text style={styles.actionIcon}>❤️</Text>
          <Text style={[styles.actionText, { color: textColor }]}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleComment(post.id)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionText, { color: textColor }]}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handlePostReport(post)}
        >
          <Text style={styles.actionIcon}>📢</Text>
          <Text style={[styles.actionText, { color: textColor }]}>{post.reports}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(post)}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={[styles.actionText, { color: textColor }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: textColor }]}>CivicEye Feed</Text>
          {userData && (
            <Text style={[styles.welcomeText, { color: textColor }]}>
              Welcome, {userData.name || userData.email}!
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {userData && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading community feed...
          </Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: textColor }]}>No Issues Yet</Text>
          <Text style={[styles.emptySubtitle, { color: textColor }]}>
            Be the first to report an issue in your community!
          </Text>
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => navigation.navigate('Report')}
          >
            <Text style={styles.reportButtonText}>Report an Issue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Feed */
        <ScrollView
          style={styles.feed}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {posts.map(renderPost)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: '#f8f9fa',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  feed: {
    flex: 1,
  },
  postCard: {
    marginHorizontal: 0,
    marginBottom: 1,
    padding: 16,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  verifiedBadge: {
    color: '#1DA1F2',
    fontSize: 16,
  },
  location: {
    fontSize: 14,
    color: '#657786',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 14,
    color: '#657786',
    marginTop: 2,
  },
  categoryContainer: {
    justifyContent: 'center',
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  reportButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
