import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const PermissionUtils = {
  // Get the appropriate media permissions based on Android version
  getMediaPermissions: () => {
    const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];
    
    // For Android 13+ (API 33+), use the new media permissions
    if (Platform.Version >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else {
      // For Android 12 and below, use legacy storage permissions
      permissions.push(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
    }
    
    return permissions;
  },

  // Request all required permissions at app startup
  requestAllPermissions: async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const mediaPermissions = PermissionUtils.getMediaPermissions();
      const permissions = [
        ...mediaPermissions,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      console.log('Requesting permissions:', permissions);
      
      // Check which permissions are already granted
      const permissionStatus = await PermissionsAndroid.requestMultiple(permissions);
      
      console.log('Permission status:', permissionStatus);
      return permissionStatus;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  },

  // Check if camera and media permissions are granted
  checkCameraPermission: async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const cameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      
      let mediaGranted = false;
      if (Platform.Version >= 33) {
        mediaGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      } else {
        const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        const writeGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        mediaGranted = readGranted || writeGranted;
      }
      
      const result = cameraGranted && mediaGranted;
      console.log('Camera permission check:', { cameraGranted, mediaGranted, result });
      return result;
    } catch (error) {
      console.error('Camera permission check error:', error);
      return false;
    }
  },

  // Request camera and media permissions specifically
  requestCameraPermission: async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const mediaPermissions = PermissionUtils.getMediaPermissions();
      console.log('Requesting camera permissions:', mediaPermissions);
      
      const granted = await PermissionsAndroid.requestMultiple(mediaPermissions);
      
      // Check if camera permission is granted
      const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      
      // Check if media permission is granted (varies by Android version)
      let mediaGranted = false;
      if (Platform.Version >= 33) {
        mediaGranted = granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        mediaGranted = granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED ||
                      granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      }
      
      const result = cameraGranted && mediaGranted;
      console.log('Camera permission result:', result, { cameraGranted, mediaGranted });
      return result;
    } catch (error) {
      console.error('Camera permission request error:', error);
      return false;
    }
  },

  // Request location permission specifically
  requestLocationPermission: async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission Required',
          message: 'CivicEye needs location access to help identify where civic issues are located',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );
      
      const result = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log('Location permission result:', result);
      return result;
    } catch (error) {
      console.error('Location permission request error:', error);
      return false;
    }
  },

  // Show dialog when permissions are needed
  showPermissionDialog: (permissionType) => {
    Alert.alert(
      `${permissionType} Permission Required`,
      `To use this feature, please grant ${permissionType.toLowerCase()} permission in your device settings.\n\nSteps:\n1. Go to Settings > Apps > CivicEye\n2. Tap Permissions\n3. Enable ${permissionType}\n4. Return to the app and try again`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            // Try to open app settings directly
            import('react-native').then(({ Linking }) => {
              Linking.openSettings().catch(() => {
                Alert.alert(
                  'Manual Setup Required', 
                  `Please manually open:\nSettings > Apps > CivicEye > Permissions\nThen enable ${permissionType}`
                );
              });
            });
          }
        }
      ]
    );
  },

  // Force refresh permissions - useful after user grants them in settings
  refreshPermissions: async () => {
    console.log('Refreshing app permissions...');
    return await PermissionUtils.requestAllPermissions();
  }
};
