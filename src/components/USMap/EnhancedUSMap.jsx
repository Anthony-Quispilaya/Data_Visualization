import React, { useEffect, useState, useRef } from 'react';
import { useHealthData } from '../../DataContext';
import Papa from 'papaparse';
import './EnhancedUSMap.css';

const EnhancedUSMap = () => {
  const [selectedState, setSelectedState] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [map, setMap] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('respiratory'); // respiratory, airQuality
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5'); // Default pollutant
  const [selectedYear, setSelectedYear] = useState(2022); // Default to most recent year
  const [currentData, setCurrentData] = useState(null);
  const [stateTimeSeries, setStateTimeSeries] = useState(null);
  const [airQualityData, setAirQualityData] = useState([]);
  const [isPaused, setIsPaused] = useState(true);
  const [animationInterval, setAnimationInterval] = useState(null);
  const [isAqDataLoaded, setIsAqDataLoaded] = useState(false);
  const mapRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Use the health data context
  const { timeSeriesData, availableYears, isLoading: dataLoading, error } = useHealthData();

  // Update current data when year or visualization mode changes
  useEffect(() => {
    if (timeSeriesData && timeSeriesData[selectedYear]) {
      setCurrentData(timeSeriesData[selectedYear]);
    }
  }, [timeSeriesData, selectedYear, visualizationMode, selectedPollutant]);
  
  // Update state time series data when state or time series data changes
  useEffect(() => {
    if (selectedState && timeSeriesData) {
      const timeSeries = {};
      availableYears.forEach(year => {
        if (timeSeriesData[year] && timeSeriesData[year][selectedState]) {
          timeSeries[year] = timeSeriesData[year][selectedState];
        }
      });
      setStateTimeSeries(timeSeries);
    }
  }, [selectedState, timeSeriesData, availableYears, selectedPollutant]);
  
  // Available pollutants
  const pollutants = ['PM2.5', 'O3', 'CO', 'PM10', 'SO2', 'NO2'];
  
  // Pollutant color scales - different color scales for different pollutants
  const pollutantColorScales = {
    'PM2.5': {
      good: '#4CAF50',      // Green
      moderate: '#FFC107',  // Yellow
      unhealthy: '#F44336'  // Red
    },
    'O3': {
      good: '#82ca9d',      // Light green
      moderate: '#ffc658',  // Light orange
      unhealthy: '#d32f2f'  // Dark red
    },
    'CO': {
      good: '#81c784',      // Another green
      moderate: '#ffb74d',  // Another orange
      unhealthy: '#e53935'  // Another red
    },
    'PM10': {
      good: '#66bb6a',      // Another green
      moderate: '#ffa726',  // Another orange
      unhealthy: '#d50000'  // Another red
    },
    'SO2': {
      good: '#26a69a',      // Teal
      moderate: '#ff8f00',  // Amber
      unhealthy: '#c62828'  // Another red
    },
    'NO2': {
      good: '#00897b',      // Teal darker
      moderate: '#ef6c00',  // Orange darker
      unhealthy: '#b71c1c'  // Red darker
    }
  };

  // Fetch air quality data from CSV
  useEffect(() => {
    const fetchAirQualityData = async () => {
      try {
        console.log("Attempting to fetch aq-map-data.csv");
        
        const fetchResponse = await fetch('/aq-map-data.csv');
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        const response = await fetchResponse.text();
        console.log("Successfully read file using fetch API, length:", response.length);
        
        // Parse CSV with Papa Parse
        Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (parsedData) => {
            console.log("Parsed CSV data rows:", parsedData.data.length);
            console.log("CSV headers:", parsedData.meta.fields);
            
            // Process the data to ensure correct types
            const processedData = parsedData.data
              .filter(row => row.State && row.Pollutant && row.Year && row.Value)
              .map(row => ({
                State: String(row.State || ''),
                Pollutant: String(row.Pollutant || ''),
                Year: typeof row.Year === 'number' ? row.Year : parseInt(row.Year),
                Value: typeof row.Value === 'number' ? row.Value : parseFloat(row.Value)
              }))
              .filter(row => 
                row.State && 
                row.Pollutant && 
                !isNaN(row.Year) && 
                !isNaN(row.Value)
              );
            
            console.log(`Successfully processed ${processedData.length} rows from CSV`);
            
            setAirQualityData(processedData);
            setIsAqDataLoaded(true);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Error fetching air quality data:', error);
      }
    };
    
    fetchAirQualityData();
  }, []);

  // Load the Google Maps script with the API key from environment variables
  useEffect(() => {
    const googleMapScript = document.createElement('script');
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    // Check if API key is available and not the placeholder
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.error('Google Maps API key is missing or invalid. Please set REACT_APP_GOOGLE_MAPS_API_KEY in .env file.');
      return;
    }
    
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;
    window.document.body.appendChild(googleMapScript);
    
    googleMapScript.addEventListener('load', () => {
      setScriptLoaded(true);
    });

    return () => {
      googleMapScript.removeEventListener('load', () => {
        setScriptLoaded(true);
      });
    };
  }, []);

  // Initialize the map once script is loaded and data is ready
  useEffect(() => {
    if (scriptLoaded && mapRef.current && !dataLoading) {
      initMap();
    }
  }, [scriptLoaded, dataLoading]);

  // Initialize the Google Map
  const initMap = async () => {
    // Create a new map centered on the US
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 }, // Center of the US
      zoom: 4,
      mapTypeId: 'roadmap',
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: 'administrative.country',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#000000' }, { weight: 1 }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text',
          stylers: [{ fontFamily: 'Roboto' }]
        }
      ]
    });
    
    setMap(newMap);
    
    // Load the GeoJSON for US states
    try {
      const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json');
      const data = await response.json();
      
      // Process the data to associate state codes with features
      data.features.forEach(feature => {
        // Get state name from feature properties
        const stateName = feature.properties.name;
        // Find the state code (2-letter abbreviation)
        const stateCode = getStateCodeFromName(stateName);
        // Add the state code to the feature properties
        if (stateCode) {
          feature.properties.stateCode = stateCode;
        }
      });
      
      setGeoJsonData(data);
      
      // Add state boundaries to the map
      newMap.data.addGeoJson(data);
      
      // Add click listener for states
      newMap.data.addListener('click', (event) => {
        const stateName = event.feature.getProperty('name');
        const stateCode = getStateCodeFromName(stateName);
        
        if (stateCode) {
          // Highlight the selected state
          newMap.data.forEach(feature => {
            if (feature.getProperty('name') === stateName) {
              newMap.data.overrideStyle(feature, {
                fillColor: '#1976D2',
                fillOpacity: 0.7,
                strokeColor: '#1976D2',
                strokeWeight: 2,
              });
            } else {
              // Reset style for other states
              newMap.data.revertStyle(feature);
            }
          });
          
          setSelectedState(stateCode);
        }
      });
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
    }
  };

  // Helper function to get state code from state name
  const getStateCodeFromName = (stateName) => {
    const stateNameToCode = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
      'Puerto Rico': 'PR', 'District of Columbia': 'DC'
    };
    
    const stateCode = stateNameToCode[stateName];
    
    // For debugging
    if (!stateCode) {
      console.log(`Could not find state code for: "${stateName}"`);
    }
    
    return stateCode;
  };

  const changeVisualizationMode = (mode) => {
    setVisualizationMode(mode);
  };
  
  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };
  
  const handlePollutantChange = (e) => {
    setSelectedPollutant(e.target.value);
  };
  
  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  // Check if API key is available
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const isValidApiKey = apiKey && apiKey !== 'your_google_maps_api_key_here';

  if (!isValidApiKey) {
    return (
      <div className="enhanced-us-map-container">
        <div className="map-error-message" style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Google Maps API Key Missing</h3>
          <p>Please set a valid Google Maps API key in the .env file:</p>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px' }}>REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key</pre>
          <p>For local development, create a .env file in the project root.</p>
        </div>
      </div>
    );
  }

  if (dataLoading || isAqDataLoaded === false) {
    return <div className="loading-indicator">Loading map data...</div>;
  }

  return (
    <div className="enhanced-us-map-container">
      <h2>U.S. Map Visualization</h2>
      
      <div className="map-controls">
        <button 
          onClick={() => changeVisualizationMode('respiratory')}
          className={`viz-toggle-btn ${visualizationMode === 'respiratory' ? 'active' : ''}`}
        >
          Respiratory Index
        </button>
        <button 
          onClick={() => changeVisualizationMode('airQuality')}
          className={`viz-toggle-btn ${visualizationMode === 'airQuality' ? 'active' : ''}`}
        >
          Air Quality
        </button>
      </div>
      
      {visualizationMode === 'airQuality' && (
        <div className="pollutant-controls">
          <label htmlFor="pollutant-select">Select Pollutant:</label>
          <select 
            id="pollutant-select"
            value={selectedPollutant} 
            onChange={handlePollutantChange}
            className="pollutant-select"
          >
            {pollutants.map(pollutant => (
              <option key={pollutant} value={pollutant}>
                {pollutant === 'PM2.5' ? 'PM2.5 (μg/m³)' :
                 pollutant === 'PM10' ? 'PM10 (μg/m³)' :
                 pollutant === 'O3' ? 'Ozone (O3) (ppm)' :
                 pollutant === 'CO' ? 'Carbon Monoxide (CO) (ppm)' :
                 pollutant === 'SO2' ? 'Sulfur Dioxide (SO2) (ppb)' :
                 pollutant === 'NO2' ? 'Nitrogen Dioxide (NO2) (ppb)' :
                 pollutant}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="time-controls">
        <div className="year-display">
          <h3>Year: {selectedYear}</h3>
          <button 
            onClick={togglePlayPause}
            className="time-control-btn"
          >
            {isPaused ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <div className="year-slider-container">
          <input 
            type="range" 
            min={availableYears[0]} 
            max={availableYears[availableYears.length - 1]} 
            value={selectedYear} 
            onChange={handleYearChange}
            step="1"
            className="year-slider"
          />
          <div className="year-markers">
            {availableYears.map(year => (
              <span key={year} className="year-marker" style={{
                left: `${((year - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100}%`
              }}>
                {year}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="google-map" 
      />
      
      {selectedState && (
        <div className="state-info">
          <h3>Selected State: {selectedState}</h3>
          <p>Visualization Mode: {visualizationMode}</p>
          {visualizationMode === 'airQuality' && (
            <p>Selected Pollutant: {selectedPollutant}</p>
          )}
          <p>Year: {selectedYear}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedUSMap;