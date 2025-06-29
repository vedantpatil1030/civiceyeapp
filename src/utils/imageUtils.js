/**
 * Utility functions for safe image URI handling
 */

/**
 * Safely converts any value to a valid image URI string
 * @param {any} uri - The URI value (could be string, object, null, undefined)
 * @returns {string|null} - A valid URI string or null if invalid
 */
export const safeImageUri = (uri) => {
  if (!uri) {
    return null;
  }

  // If it's already a string, return it if it's not empty
  if (typeof uri === 'string') {
    const trimmedUri = uri.trim();
    return trimmedUri.length > 0 ? trimmedUri : null;
  }

  // If it's an object (like from react-native-image-picker), extract the uri property
  if (typeof uri === 'object' && uri.uri) {
    const trimmedUri = String(uri.uri).trim();
    return trimmedUri.length > 0 ? trimmedUri : null;
  }

  // Try to convert to string as a fallback
  try {
    const stringUri = String(uri).trim();
    return stringUri.length > 0 && stringUri !== 'null' && stringUri !== 'undefined' ? stringUri : null;
  } catch (error) {
    console.warn('Failed to convert URI to string:', error);
    return null;
  }
};

/**
 * Creates a safe Image source object
 * @param {any} uri - The URI value
 * @param {object} defaultSource - Optional default source to use if URI is invalid
 * @returns {object} - A source object safe for React Native Image component
 */
export const createImageSource = (uri, defaultSource = null) => {
  const safeUri = safeImageUri(uri);
  
  if (safeUri) {
    return { uri: safeUri };
  }
  
  return defaultSource || { uri: '' };
};

/**
 * Validates if an array of URIs are all valid
 * @param {array} uris - Array of URI values
 * @returns {array} - Array of valid URI strings
 */
export const filterValidImageUris = (uris) => {
  if (!Array.isArray(uris)) {
    return [];
  }
  
  return uris
    .map(safeImageUri)
    .filter(uri => uri !== null);
};

/**
 * Standard error handler for Image onError events
 * @param {string} context - Context description for logging
 * @returns {function} - Error handler function
 */
export const createImageErrorHandler = (context = 'Image') => {
  return (error) => {
    console.warn(`${context} load error:`, error?.nativeEvent?.error || error);
  };
};
