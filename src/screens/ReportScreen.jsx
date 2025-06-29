import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Image,
  Dimensions,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { PermissionUtils } from '../utils/permissions';
import { safeImageUri, createImageSource, createImageErrorHandler, filterValidImageUris } from '../utils/imageUtils';
import { reportsAPI, authAPI } from '../services/api';

const ReportScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('MEDIUM');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isDarkMode = useColorScheme() === 'dark';
  
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };
  
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const cardBgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const borderColor = isDarkMode ? '#333333' : '#e1e8ed';

  const categories = [
    { id: 'INFRASTRUCTURE', name: 'Infrastructure', icon: '🏗️', color: '#ff4757' },
    { id: 'SAFETY', name: 'Safety', icon: '🚨', color: '#ff6b6b' },
    { id: 'ENVIRONMENT', name: 'Environment', icon: '🌱', color: '#2ed573' },
    { id: 'TRANSPORT', name: 'Transport', icon: '🚗', color: '#ffa502' },
    { id: 'CLEANLINESS', name: 'Cleanliness', icon: '🧹', color: '#3742fa' },
    { id: 'GOVERNANCE', name: 'Governance', icon: '🏛️', color: '#5f27cd' },
    { id: 'OTHER', name: 'Other', icon: '📝', color: '#747d8c' },
  ];

  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  // Handle image selection
  const handleImagePicker = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Open camera
  const openCamera = async () => {
    // Check and request camera permission using our utility
    const hasPermission = await PermissionUtils.checkCameraPermission();
    
    if (!hasPermission) {
      // Request permission
      const granted = await PermissionUtils.requestCameraPermission();
      if (!granted) {
        PermissionUtils.showPermissionDialog('Camera');
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
      saveToPhotos: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }
      
      if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Camera Error', 'Unable to take photo. Please check camera permissions in Settings.');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const imageUri = safeImageUri(asset);
        
        if (imageUri) {
          const newImage = {
            uri: imageUri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          };
          setSelectedImages([...selectedImages, newImage]);
          Alert.alert('Photo Added', 'Photo has been added to your report');
        } else {
          console.warn('Invalid camera image URI:', asset);
          Alert.alert('Error', 'Failed to capture image. Please try again.');
        }
      }
    });
  };

  // Open image library
  const openImageLibrary = async () => {
    // Check if we have media permissions for Android
    if (Platform.OS === 'android') {
      const hasPermission = await PermissionUtils.checkCameraPermission(); // This also checks media permissions
      
      if (!hasPermission) {
        const granted = await PermissionUtils.requestCameraPermission(); // This also requests media permissions
        if (!granted) {
          PermissionUtils.showPermissionDialog('Storage/Media');
          return;
        }
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 5 - selectedImages.length, // Max 5 images total
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Photo Library Error', 'Unable to access photo library. Please check your permissions in Settings.');
        return;
      }

      if (response.assets) {
        const newImages = response.assets
          .map(asset => {
            const imageUri = safeImageUri(asset);
            
            if (imageUri) {
              return {
                uri: imageUri,
                type: asset.type || 'image/jpeg',
                fileName: asset.fileName || `image_${Date.now()}.jpg`,
              };
            }
            
            console.warn('Invalid library image URI:', asset);
            return null;
          })
          .filter(Boolean); // Remove any null entries
          
        if (newImages.length > 0) {
          setSelectedImages([...selectedImages, ...newImages]);
          const count = newImages.length;
          Alert.alert('Photos Added', `${count} photo${count > 1 ? 's' : ''} added to your report`);
        } else {
          Alert.alert('Error', 'Failed to select images. Please try again.');
        }
      }
    });
  };

  // Remove selected image
  const removeImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  // Request location permission and get GPS coordinates
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'CivicEye needs access to your location to help identify issue locations accurately',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
    return true;
  };

  // Get current GPS location
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required to use GPS');
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Store coordinates for API submission
        setCoordinates({ lat: latitude, lng: longitude });
        
        // Display GPS location to user
        const gpsLocation = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setLocation(gpsLocation);
        Alert.alert('Location Added', 'GPS coordinates have been added to your report');
      },
      (error) => {
        console.log('Location error:', error);
        Alert.alert('Location Error', 'Unable to get your current location. Please enter manually.');
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !selectedCategory) {
      Alert.alert('Missing Information', 'Please fill in title, description, and category.');
      return;
    }

    // Check if user is logged in
    const isLoggedIn = await authAPI.isLoggedIn();
    if (!isLoggedIn) {
      Alert.alert(
        'Login Required',
        'Please log in to submit a report.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate that we have valid coordinates
      if (!coordinates || !coordinates.lat || !coordinates.lng || 
          isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
        Alert.alert(
          'Location Required',
          'Please add your location using GPS or enter it manually before submitting.',
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }

      const reportData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        priority: selectedPriority,
        location: { 
          latitude: coordinates.lat, 
          longitude: coordinates.lng 
        },
        address: location.trim(),
        visibility: 'PUBLIC',
        tags: []
      };

      // Prepare images for upload
      const imagesToUpload = selectedImages
        .map(image => {
          const imageUri = String(image.uri || '');
          
          // Validate URI before upload
          if (!imageUri || imageUri === 'null' || imageUri === 'undefined') {
            console.warn('Invalid image URI for upload:', image);
            return null;
          }
          
          return {
            uri: imageUri,
            type: image.type || 'image/jpeg',
            name: image.fileName || `image_${Date.now()}.jpg`
          };
        })
        .filter(Boolean); // Remove any null entries

      const response = await reportsAPI.submitReport(reportData, imagesToUpload);

      if (response.success) {
        const imageCount = selectedImages.length;
        const imageText = imageCount > 0 ? `\n📷 ${imageCount} photo(s) attached` : '';

        Alert.alert(
          'Report Submitted!',
          `Your ${selectedCategory.toLowerCase()} report has been submitted successfully.${imageText}\n\nYou will receive updates on its status.`,
          [
            {
              text: 'View Status',
              onPress: () => navigation.navigate('Status')
            },
            {
              text: 'Go to Feed',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );

        // Reset form
        setTitle('');
        setDescription('');
        setSelectedCategory('');
        setSelectedPriority('MEDIUM');
        setLocation('');
        setCoordinates(null);
        setSelectedImages([]);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit report. Please try again.',
        [
          { text: 'Retry', onPress: () => handleSubmit() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Report an Issue</Text>
          <Text style={[styles.headerSubtitle, { color: textColor }]}>
            Help improve your community by reporting civic issues
          </Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Category *</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: cardBgColor, borderColor },
                  selectedCategory === category.id && { borderColor: category.color, borderWidth: 2 }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryName, { color: textColor }]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Title *</Text>
          <TextInput
            style={[styles.textInput, { color: textColor, borderColor }]}
            placeholder="Brief description of the issue"
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { color: textColor, borderColor }]}
            placeholder="Provide detailed information about the issue..."
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: textColor }]}>
            {description.length}/500 characters
          </Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Location *</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor, flex: 1 }]}
              placeholder="Enter address or landmark"
              placeholderTextColor={isDarkMode ? '#888' : '#666'}
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={getCurrentLocation}
            >
              <Text style={styles.locationButtonText}>📍 Use GPS</Text>
            </TouchableOpacity>
          </View>
          {location.startsWith('GPS:') && (
            <Text style={[styles.gpsNote, { color: textColor }]}>
              📍 GPS coordinates captured. You can also add a description above.
            </Text>
          )}
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Priority Level</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  { borderColor },
                  selectedPriority === priority && styles.priorityButtonSelected
                ]}
                onPress={() => setSelectedPriority(priority)}
              >
                <Text style={[
                  styles.priorityText,
                  { color: textColor },
                  selectedPriority === priority && styles.priorityTextSelected
                ]}>
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Photo Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Add Photos (Optional) {selectedImages.length > 0 && `(${selectedImages.length}/5)`}
          </Text>
          
          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedImagesContainer}>
              {selectedImages.map((image, index) => {
                return (
                  <View key={index} style={styles.selectedImageWrapper}>
                    <Image 
                      source={createImageSource(image?.uri || image)} 
                      style={styles.selectedImage}
                      resizeMode="cover"
                      onError={createImageErrorHandler(`Selected image ${index + 1}`)}
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              }).filter(Boolean)}
            </ScrollView>
          )}

          {/* Add Photo Button */}
          {selectedImages.length < 5 && (
            <TouchableOpacity 
              style={[styles.photoButton, { borderColor }]}
              onPress={handleImagePicker}
            >
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={[styles.photoText, { color: textColor }]}>
                {selectedImages.length === 0 ? 'Add Photos' : 'Add More Photos'}
              </Text>
              <Text style={[styles.photoSubtext, { color: textColor }]}>
                Help others understand the issue better
              </Text>
            </TouchableOpacity>
          )}

          {selectedImages.length >= 5 && (
            <View style={[styles.maxPhotosContainer, { backgroundColor: cardBgColor, borderColor }]}>
              <Text style={[styles.maxPhotosText, { color: textColor }]}>
                📷 Maximum 5 photos reached
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                Submitting...
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  gpsNote: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  priorityButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  priorityTextSelected: {
    color: '#ffffff',
  },
  photoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  photoSubtext: {
    fontSize: 14,
    opacity: 0.6,
  },
  selectedImagesContainer: {
    marginBottom: 16,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4757',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  maxPhotosContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  maxPhotosText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ReportScreen;
