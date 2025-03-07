import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';

const EnhancedUSMap = () => {
  const [selectedState, setSelectedState] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [map, setMap] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('respiratory'); // respiratory, airQuality
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5'); // Default pollutant
  const [selectedYear, setSelectedYear] = useState(2022); // Default to most recent year
  const [currentData, setCurrentData] = useState(null);
  const [airQualityData, setAirQualityData] = useState([]);
  const [isPaused, setIsPaused] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isAqDataLoaded, setIsAqDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);
  
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
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching air quality data:', error);
        setIsLoading(false);
      }
    };
    
    fetchAirQualityData();
  }, []);

  // Load the Google Maps script with the API key from environment variables
  useEffect(() => {
    const googleMapScript = document.createElement('script');
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
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

  if (isLoading) {
    return <div className="loading-indicator">Loading map data...</div>;
  }

  return (
    <div className="enhanced-us-map-container">
      <h2>U.S. Map Visualization</h2>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
      {airQualityData.length > 0 && (
        <p>Loaded {airQualityData.length} air quality data points</p>
      )}
    </div>
  );
};

export default EnhancedUSMap;