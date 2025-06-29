import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { issuesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MapScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [useWebMap, setUseWebMap] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.7749, // Default to San Francisco
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const { user } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';
  
  const { width, height } = Dimensions.get('window');
  
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };
  
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const cardBgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const borderColor = isDarkMode ? '#333333' : '#e1e8ed';

  // Calculate filter counts
  const getFilterCounts = () => {
    return {
      all: issues.length,
      infrastructure: issues.filter(i => i.category === 'Infrastructure').length,
      safety: issues.filter(i => i.category === 'Safety').length,
      environment: issues.filter(i => i.category === 'Environment').length,
      traffic: issues.filter(i => i.category === 'Traffic Safety').length,
    };
  };

  const filterCounts = getFilterCounts();

  const filters = [
    { id: 'all', name: 'All Issues', color: '#007AFF', count: filterCounts.all },
    { id: 'infrastructure', name: 'Infrastructure', color: '#ff4757', count: filterCounts.infrastructure },
    { id: 'safety', name: 'Safety', color: '#ff6b6b', count: filterCounts.safety },
    { id: 'environment', name: 'Environment', color: '#2ed573', count: filterCounts.environment },
    { id: 'traffic', name: 'Traffic', color: '#ffa502', count: filterCounts.traffic },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ff4757';
      case 'MEDIUM': return '#ffa502';
      case 'LOW': return '#2ed573';
      default: return '#747d8c';
    }
  };

  // Helper function to get status color for markers
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return '#ff4757'; // Red
      case 'IN_PROGRESS':
        return '#ffa502'; // Orange/Yellow
      case 'RESOLVED':
      case 'CLOSED':
        return '#2ed573'; // Green
      default:
        return '#ff4757'; // Default to red
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return '✅';
      case 'IN_PROGRESS':
        return '🔄';
      case 'OPEN':
      default:
        return '🔴';
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate OpenStreetMap HTML for WebView
  const generateOpenStreetMapHTML = () => {
    const filteredIssues = selectedFilter === 'all' 
      ? issues 
      : issues.filter(issue => {
          const categoryMap = {
            'infrastructure': 'Infrastructure',
            'safety': 'Safety',
            'environment': 'Environment',
            'traffic': 'Traffic Safety'
          };
          return issue.category === categoryMap[selectedFilter];
        });

    const markers = filteredIssues
      .filter(issue => issue.coordinates && issue.coordinates.latitude && issue.coordinates.longitude)
      .map(issue => {
        const color = getStatusColor(issue.status);
        return `
          L.circleMarker([${issue.coordinates.latitude}, ${issue.coordinates.longitude}], {
            color: '${color}',
            fillColor: '${color}',
            fillOpacity: 0.8,
            radius: 8,
            weight: 2
          }).addTo(map)
          .bindPopup(\`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #333;">${issue.title}</h3>
              <p style="margin: 4px 0; color: #666; font-size: 12px;">
                ${getStatusIcon(issue.status)} ${issue.category} • ${issue.priority}
              </p>
              <p style="margin: 4px 0; color: #333; font-size: 12px;">
                ${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 11px;">
                📍 ${issue.location}
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 11px;">
                📅 ${issue.submittedDate} • 👤 ${issue.reporter}
              </p>
            </div>
          \`);
        `;
      }).join('\n');

    const centerLat = mapRegion.latitude;
    const centerLng = mapRegion.longitude;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CivicEye Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-popup-content { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
          
          // Use free OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Add markers
          ${markers}

          // Add legend
          var legend = L.control({position: 'bottomright'});
          legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = \`
              <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                <h4 style="margin: 0 0 8px 0; font-size: 14px;">Issue Status</h4>
                <div style="margin: 2px 0;"><span style="color: #ff4757;">●</span> Open</div>
                <div style="margin: 2px 0;"><span style="color: #ffa502;">●</span> In Progress</div>
                <div style="margin: 2px 0;"><span style="color: #2ed573;">●</span> Resolved</div>
              </div>
            \`;
            return div;
          };
          legend.addTo(map);
        </script>
      </body>
      </html>
    `;
  };

  // Fetch all issues for map display
  const fetchMapIssues = async () => {
    try {
      setLoading(true);
      const response = await issuesAPI.getFeed({
        page: 1,
        limit: 100, // Get more issues for map
        includeResolved: true // Include all statuses
      });

      if (response.success) {
        const transformedIssues = response.data.issues.map(issue => ({
          id: issue._id,
          title: issue.title,
          category: issue.category,
          priority: issue.priority,
          status: issue.status || 'OPEN',
          submittedDate: formatDate(issue.createdAt),
          description: issue.description,
          location: `${issue.city || ''} ${issue.state || ''}`.trim() || issue.address || 'Unknown Location',
          coordinates: issue.coordinates,
          upvotes: issue.upvoteCount || 0,
          distance: '0.0 km', // We'll calculate this later if needed
          reporter: issue.reporter?.name || 'Anonymous'
        }));
        
        setIssues(transformedIssues);

        // Update map region to center on first issue with coordinates
        const firstIssueWithCoords = transformedIssues.find(issue => 
          issue.coordinates && issue.coordinates.latitude && issue.coordinates.longitude
        );
        
        if (firstIssueWithCoords) {
          setMapRegion({
            latitude: firstIssueWithCoords.coordinates.latitude,
            longitude: firstIssueWithCoords.coordinates.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching map issues:', error);
      Alert.alert('Error', 'Failed to load issues for map. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMapIssues();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMapIssues();
  }, []);

  // Open location in maps app
  const openInMaps = (issue) => {
    if (!issue.coordinates || !issue.coordinates.latitude || !issue.coordinates.longitude) {
      Alert.alert('Location Unavailable', 'GPS coordinates not available for this issue.');
      return;
    }

    const { latitude, longitude } = issue.coordinates;
    const label = encodeURIComponent(issue.title);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}(${label})`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      }
    });
  };

  // Filter issues based on selected category
  const filteredIssues = selectedFilter === 'all' 
    ? issues 
    : issues.filter(issue => {
        const categoryMap = {
          'infrastructure': 'Infrastructure',
          'safety': 'Safety',
          'environment': 'Environment',
          'traffic': 'Traffic Safety'
        };
        return issue.category === categoryMap[selectedFilter];
      });

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Issue Map (Free)</Text>
        <Text style={[styles.headerSubtitle, { color: textColor }]}>
          Issues from all users • OpenStreetMap
        </Text>
      </View>

      {/* Map Type Toggle */}
      <View style={styles.mapToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: !useWebMap ? '#007AFF' : cardBgColor, borderColor }
          ]}
          onPress={() => setUseWebMap(false)}
        >
          <Text style={[
            styles.toggleText,
            { color: !useWebMap ? '#ffffff' : textColor }
          ]}>
            Native Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: useWebMap ? '#007AFF' : cardBgColor, borderColor }
          ]}
          onPress={() => setUseWebMap(true)}
        >
          <Text style={[
            styles.toggleText,
            { color: useWebMap ? '#ffffff' : textColor }
          ]}>
            Web Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={[styles.mapPlaceholder, { backgroundColor: cardBgColor, borderColor }]}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, { color: textColor }]}>Loading map...</Text>
          </View>
        ) : useWebMap ? (
          // Free OpenStreetMap via WebView
          <WebView
            style={styles.map}
            source={{ html: generateOpenStreetMapHTML() }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[styles.mapPlaceholder, { backgroundColor: cardBgColor }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={[styles.loadingText, { color: textColor }]}>Loading OpenStreetMap...</Text>
              </View>
            )}
          />
        ) : mapError ? (
          <View style={[styles.mapPlaceholder, { backgroundColor: cardBgColor, borderColor }]}>
            <Text style={[styles.mapText, { color: textColor }]}>🗺️</Text>
            <Text style={[styles.mapErrorText, { color: textColor }]}>Map Unavailable</Text>
            <Text style={[styles.mapErrorSubtext, { color: textColor }]}>
              Try the Web Map option above or check network connection.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setMapError(false)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Native MapView with default provider (free)
          <MapView
            style={styles.map}
            provider={null} // Use device's default map provider, no Google dependency
            initialRegion={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onRegionChangeComplete={setMapRegion}
            onError={(error) => {
              console.log('MapView Error:', error);
              setMapError(true);
            }}
            onMapReady={() => {
              console.log('MapView is ready with default provider');
            }}
            mapType="standard"
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
          >
            {filteredIssues.map((issue) => {
              if (!issue.coordinates || !issue.coordinates.latitude || !issue.coordinates.longitude) {
                return null;
              }
              
              return (
                <Marker
                  key={issue.id}
                  coordinate={{
                    latitude: issue.coordinates.latitude,
                    longitude: issue.coordinates.longitude,
                  }}
                  pinColor={getStatusColor(issue.status)}
                  onPress={() => setSelectedIssue(issue)}
                >
                  <Callout tooltip={false} onPress={() => openInMaps(issue)}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{issue.title}</Text>
                      <Text style={styles.calloutCategory}>
                        {getStatusIcon(issue.status)} {issue.category} • {issue.priority}
                      </Text>
                      <Text style={styles.calloutDescription} numberOfLines={2}>
                        {issue.description}
                      </Text>
                      <Text style={styles.calloutLocation}>📍 {issue.location}</Text>
                      <Text style={styles.calloutDate}>📅 {issue.submittedDate}</Text>
                      <Text style={styles.calloutReporter}>👤 {issue.reporter}</Text>
                      <Text style={styles.calloutAction}>Tap to open in Maps</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                { borderColor },
                selectedFilter === filter.id && { backgroundColor: filter.color, borderColor: filter.color }
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterText,
                { color: textColor },
                selectedFilter === filter.id && { color: '#ffffff' }
              ]}>
                {filter.name} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map Legend */}
      <View style={[styles.legendSection, { backgroundColor: cardBgColor, borderColor }]}>
        <Text style={[styles.legendTitle, { color: textColor }]}>
          {useWebMap ? 'OpenStreetMap' : 'Default Map'} • 100% Free
        </Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff4757' }]} />
            <Text style={[styles.legendText, { color: textColor }]}>Open Issues</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ffa502' }]} />
            <Text style={[styles.legendText, { color: textColor }]}>In Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2ed573' }]} />
            <Text style={[styles.legendText, { color: textColor }]}>Resolved</Text>
          </View>
        </View>
      </View>

      {/* Issues Count */}
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: textColor }]}>
          Showing {filteredIssues.length} of {issues.length} issues
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    opacity: 0.7,
  },
  mapToggle: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 2,
  },
  toggleText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 350,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  mapText: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapErrorText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapErrorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  calloutContainer: {
    width: 250,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  calloutCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#333',
    marginBottom: 6,
  },
  calloutLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutReporter: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  calloutAction: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  filtersSection: {
    marginBottom: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legendSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  statsContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MapScreen;
