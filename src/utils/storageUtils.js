import AsyncStorage from '@react-native-async-storage/async-storage';

// Utility functions for AsyncStorage management
export const StorageUtils = {
  // Clear all AsyncStorage data
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      return false;
    }
  },

  // Get all keys in AsyncStorage
  getAllKeys: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('AsyncStorage keys:', keys);
      return keys;
    } catch (error) {
      console.error('Error getting AsyncStorage keys:', error);
      return [];
    }
  },

  // Get storage info and usage
  getStorageInfo: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      const itemsInfo = items.map(([key, value]) => {
        const size = new Blob([value || '']).size;
        totalSize += size;
        return { key, size, value: value?.substring(0, 100) + '...' };
      });

      console.log('Storage Info:', {
        totalKeys: keys.length,
        totalSize: totalSize + ' bytes',
        items: itemsInfo
      });

      return { totalKeys: keys.length, totalSize, items: itemsInfo };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  },

  // Remove specific keys
  removeKeys: async (keys) => {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log('Removed keys:', keys);
      return true;
    } catch (error) {
      console.error('Error removing keys:', error);
      return false;
    }
  }
};
