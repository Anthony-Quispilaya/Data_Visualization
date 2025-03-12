import React, { useEffect, useState, useRef } from 'react';
import { useHealthData } from '../../DataContext';
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
  
  // Use the health data context
  const { timeSeriesData, availableYears, isLoading } = useHealthData();

  // Fetch air quality data from CSV
  useEffect(() => {
    const fetchAirQualityData = async () => {
      try {
        console.log("Attempting to fetch aq-map-data.csv");
        let response;
        
        try {
          // Try with fetch API first
          const fetchResponse = await fetch('/aq-map-data.csv');
          if (!fetchResponse.ok) {
            throw new Error(`HTTP error! status: ${fetchResponse.status}`);
          }
          response = await fetchResponse.text();
          console.log("Successfully read file using fetch API, length:", response.length);
        } catch (fetchErr) {
          console.log("Fetch API failed, trying window.fs as fallback");
          
          try {
            // Try window.fs as fallback
            response = await window.fs.readFile('aq-map-data.csv', { encoding: 'utf8' });
            console.log("Successfully read with window.fs, length:", response.length);
          } catch (fsError) {
            console.error("All methods to read aq-map-data.csv failed");
            return;
          }
        }
        
        // Parse CSV with Papa Parse
        const Papa = await import('papaparse');
        const parsedData = Papa.default.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
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
        
      } catch (error) {
        console.error('Error fetching air quality data:', error);
      }
    };
    
    fetchAirQualityData();
  }, []);

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

  // Handle animation play/pause
  useEffect(() => {
    if (!isPaused && availableYears && availableYears.length > 0) {
      console.log("Play animation - setting up interval");
      
      // Clear any existing interval first
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      
      // Set new interval for animation
      const interval = setInterval(() => {
        setSelectedYear(prevYear => {
          const currIndex = availableYears.indexOf(prevYear);
          // If current year isn't found in availableYears, start from the first year
          if (currIndex === -1) {
            console.log("Current year not found in available years, starting from first year");
            return availableYears[0];
          }
          const nextIndex = (currIndex + 1) % availableYears.length;
          console.log(`Advancing year from ${prevYear} to ${availableYears[nextIndex]}`);
          return availableYears[nextIndex];
        });
      }, 1000); // Change year every 1 second
      
      setAnimationInterval(interval);
      console.log("Animation interval set", interval);
    } else if (animationInterval) {
      // Clear interval if animation is paused
      console.log("Pausing animation - clearing interval");
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
    
    // Clean up on unmount
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isPaused, availableYears]);

  // Load the Google Maps script
  useEffect(() => {
    const googleMapScript = document.createElement('script');
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
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
      
      // Style the states
      updateMapStyling(newMap, data);
      
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

  const updateMapStyling = (currentMap = map, data = geoJsonData) => {
    if (!currentMap || !data || !currentData) {
      console.log("Cannot update map styling - missing map, data, or currentData");
      return;
    }

    console.log(`Updating map styling for year ${selectedYear}, mode ${visualizationMode}`);

    // Set styling based on visualization mode
    currentMap.data.setStyle(feature => {
      const stateName = feature.getProperty('name');
      const stateCode = getStateCodeFromName(stateName);
      
      if (stateCode && currentData[stateCode]) {
        let fillColor;
        
        if (visualizationMode === 'respiratory') {
          const respIndex = currentData[stateCode].respiratoryIndex;
          fillColor = getColorByHealthMetric(respIndex);
        } else if (visualizationMode === 'airQuality' && isAqDataLoaded) {
          // Get pollutant data for this state and year
          const value = getPollutantValue(stateCode, selectedPollutant, selectedYear);
          if (value !== null) {
            fillColor = getColorByPollutantValue(value, selectedPollutant);
          } else {
            // Default if no data
            fillColor = '#CCCCCC';
          }
        } else {
          fillColor = '#CCCCCC';
        }
        
        return {
          fillColor: fillColor,
          fillOpacity: 0.7,
          strokeColor: '#FFFFFF',
          strokeWeight: 1.2,
        };
      }
      
      return {
        fillColor: '#CCCCCC',
        fillOpacity: 0.5,
        strokeColor: '#FFFFFF',
        strokeWeight: 1,
      };
    });
    
    // Re-apply highlighting for selected state if there is one
    if (selectedState) {
      currentMap.data.forEach(feature => {
        const stateName = feature.getProperty('name');
        const stateCode = getStateCodeFromName(stateName);
        
        if (stateCode === selectedState) {
          currentMap.data.overrideStyle(feature, {
            strokeColor: '#1976D2',
            strokeWeight: 2,
          });
        }
      });
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

  // Initialize the map once script is loaded and data is ready
  useEffect(() => {
    if (scriptLoaded && mapRef.current && !isLoading && currentData) {
      initMap();
    }
  }, [scriptLoaded, isLoading, currentData]);

  // Update map styling when visualization mode, selected year, or pollutant changes
  useEffect(() => {
    if (map && geoJsonData && currentData) {
      updateMapStyling();
    }
  }, [visualizationMode, selectedYear, selectedPollutant, map, geoJsonData, currentData, isAqDataLoaded]);

  // Color scale function to visualize respiratory index on a 0-8 scale
  const getColorByHealthMetric = (value) => {
    // For respiratory index on a 0-8 scale where:
    // 0-2: Very Good (blue)
    // 2-3.5: Good (light blue)
    // 3.5-5: Moderate (yellow)
    // 5-6.5: Poor (orange)
    // 6.5-8+: Very Poor (red)
    
    if (value >= 6.5) return '#d73027'; // Very Poor - red
    if (value >= 5) return '#fc8d59';   // Poor - orange
    if (value >= 3.5) return '#fee090'; // Moderate - yellow
    if (value >= 2) return '#e0f3f8';   // Good - light blue
    return '#91bfdb';                   // Very Good - blue
  };
  
  // Get color based on pollutant value
  const getColorByPollutantValue = (value, pollutant) => {
    // Thresholds by pollutant (based on EPA standards)
    const thresholds = {
      'PM2.5': { good: 12, moderate: 35 },   // μg/m³
      'O3': { good: 0.054, moderate: 0.070 }, // ppm
      'CO': { good: 4.4, moderate: 9.4 },    // ppm
      'PM10': { good: 80, moderate: 150 },   // μg/m³
      'SO2': { good: 35, moderate: 75 },     // ppb
      'NO2': { good: 53, moderate: 100 }     // ppb
    };
    
    // Get color scale for the pollutant
    const colorScale = pollutantColorScales[pollutant] || pollutantColorScales['PM2.5'];
    
    // Get thresholds for this pollutant
    const pollutantThresholds = thresholds[pollutant] || thresholds['PM2.5'];
    
    if (value <= pollutantThresholds.good) {
      return colorScale.good;
    } else if (value <= pollutantThresholds.moderate) {
      return colorScale.moderate;
    } else {
      return colorScale.unhealthy;
    }
  };
  
  // Get status text based on pollutant value
  const getAirQualityStatus = (value, pollutant) => {
    // Use the same thresholds as color function
    const thresholds = {
      'PM2.5': { good: 12, moderate: 35 },   // μg/m³
      'O3': { good: 0.054, moderate: 0.070 }, // ppm
      'CO': { good: 4.4, moderate: 9.4 },    // ppm
      'PM10': { good: 80, moderate: 150 },   // μg/m³
      'SO2': { good: 35, moderate: 75 },     // ppb
      'NO2': { good: 53, moderate: 100 }     // ppb
    };
    
    // Get thresholds for this pollutant
    const pollutantThresholds = thresholds[pollutant] || thresholds['PM2.5'];
    
    if (value <= pollutantThresholds.good) {
      return "Good";
    } else if (value <= pollutantThresholds.moderate) {
      return "Moderate";
    } else {
      return "Unhealthy";
    }
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
    console.log("Toggle play/pause from", isPaused, "to", !isPaused);
    
    // If we're about to play and we're at the last year, loop back to the first year
    if (isPaused && selectedYear === availableYears[availableYears.length - 1]) {
      console.log("Resetting to first year before playing");
      setSelectedYear(availableYears[0]);
    }
    
    // Toggle the pause state
    setIsPaused(!isPaused);
    
    // Force map update
    if (map && geoJsonData && currentData) {
      setTimeout(() => {
        updateMapStyling();
      }, 50);
    }
  };
  
  // Function to get pollutant value for the selected state and year
  const getPollutantValue = (stateCode, pollutant, year) => {
    if (!airQualityData || airQualityData.length === 0) {
      console.log("Air quality data is not loaded yet");
      return null;
    }
    
    // Find the matching row in the data
    const matchingRow = airQualityData.find(row => 
      row.State === stateCode && 
      row.Pollutant === pollutant && 
      row.Year === year
    );
    
    if (!matchingRow) {
      console.log(`No data for ${stateCode} ${pollutant} in year ${year}`);
      return null;
    }
    
    return matchingRow.Value;
  };
  
  // Function to get all years of data for a state and pollutant
  const getStateYearlyData = (stateCode, pollutant) => {
    if (!airQualityData || airQualityData.length === 0) return [];
    
    return airQualityData
      .filter(row => row.State === stateCode && row.Pollutant === pollutant)
      .sort((a, b) => a.Year - b.Year);
  };
  
  // Function to get percent change for a state's pollutant compared to 2016
  const getPercentChange = (stateCode, pollutant, currentYear) => {
    if (!airQualityData || airQualityData.length === 0) return null;
    
    const baseYear = 2016;
    const baseYearValue = getPollutantValue(stateCode, pollutant, baseYear);
    const currentYearValue = getPollutantValue(stateCode, pollutant, currentYear);
    
    if (baseYearValue === null || currentYearValue === null || baseYearValue === 0) return null;
    
    return ((currentYearValue - baseYearValue) / baseYearValue) * 100;
  };
  
  // Function to render the time series chart for selected state
  const renderTimeSeriesChart = () => {
    if (!selectedState) return null;
    
    let chartData = [];
    let years = availableYears;
    
    // For air quality mode, get data from aqmapdata.csv
    if (visualizationMode === 'airQuality') {
      const stateData = getStateYearlyData(selectedState, selectedPollutant);
      if (stateData.length > 0) {
        chartData = stateData;
        years = chartData.map(d => d.Year);
      }
    } else if (visualizationMode === 'respiratory' && stateTimeSeries) {
      // For respiratory mode, use the existing time series data
      years = Object.keys(stateTimeSeries).map(Number).sort();
    }
    
    const chartHeight = 200;
    const chartWidth = 400;
    const padding = { top: 20, right: 30, bottom: 30, left: 40 };
    
    // Get metric values based on visualization mode
    const getMetricValue = (data, year) => {
      if (visualizationMode === 'respiratory') {
        return stateTimeSeries[year]?.respiratoryIndex;
      } else if (visualizationMode === 'airQuality') {
        const matchingData = chartData.find(d => d.Year === year);
        return matchingData ? matchingData.Value : null;
      }
    };
    
    // Get metric label based on visualization mode
    const getMetricLabel = () => {
      if (visualizationMode === 'respiratory') {
        return 'Respiratory Index (0-8)';
      } else if (visualizationMode === 'airQuality') {
        const units = {
          'PM2.5': 'μg/m³',
          'O3': 'ppm',
          'CO': 'ppm',
          'PM10': 'μg/m³',
          'SO2': 'ppb',
          'NO2': 'ppb'
        };
        return `${selectedPollutant} (${units[selectedPollutant] || ''})`;
      }
    };
    
    // For air quality mode, we need to get values from pollutant data
    let values = [];
    if (visualizationMode === 'respiratory' && stateTimeSeries) {
      values = years.map(year => stateTimeSeries[year]?.respiratoryIndex || 0);
    } else if (visualizationMode === 'airQuality') {
      values = chartData.map(d => d.Value);
    }
    
    // Check if we have valid values before proceeding
    if (values.length === 0 || values.every(v => v === 0 || v === null || v === undefined)) {
      return (
        <div className="state-time-series-chart">
          <h3>{selectedState} - No {getMetricLabel()} data available</h3>
        </div>
      );
    }
    
    // Calculate min and max values for the y-axis
    const validValues = values.filter(v => v !== null && v !== undefined);
    const minValue = Math.max(0, Math.min(...validValues) - (Math.min(...validValues) * 0.1));
    const maxValue = Math.max(...validValues) + (Math.max(...validValues) * 0.1);
    
    // Calculate scales
    const xScale = index => (index / (years.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
    const yScale = value => chartHeight - padding.bottom - ((value - minValue) / (maxValue - minValue)) * (chartHeight - padding.top - padding.bottom);
    
    // Generate points for the line
    const points = [];
    if (visualizationMode === 'respiratory') {
      years.forEach((year, index) => {
        const value = getMetricValue(stateTimeSeries?.[year] || {}, year);
        if (value !== null && value !== undefined) {
          points.push(`${xScale(index)},${yScale(value)}`);
        }
      });
    } else {
      chartData.forEach((d, index) => {
        if (d.Value !== null && d.Value !== undefined) {
          points.push(`${xScale(index)},${yScale(d.Value)}`);
        }
      });
    }
    
    // Calculate path for a smooth curve
    const path = points.length > 0 ? `M ${points.join(' L ')}` : '';
    
    return (
      <div className="state-time-series-chart">
        <h3>{selectedState} - {getMetricLabel()} (2016-2022)</h3>
        <svg width={chartWidth} height={chartHeight} style={{fontFamily: "'Roboto', sans-serif"}}>
          {/* X and Y axes */}
          <line 
            x1={padding.left} 
            y1={chartHeight - padding.bottom} 
            x2={chartWidth - padding.right} 
            y2={chartHeight - padding.bottom} 
            stroke="#333" 
            strokeWidth="1" 
          />
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight - padding.bottom} 
            stroke="#333" 
            strokeWidth="1" 
          />
          
          {/* X-axis labels (years) */}
          {years.map((year, index) => (
            <text 
              key={year} 
              x={xScale(index)} 
              y={chartHeight - padding.bottom + 20} 
              textAnchor="middle" 
              fontSize="12"
            >
              {year}
            </text>
          ))}
          
          {/* Y-axis labels */}
          <text 
            x={padding.left - 30} 
            y={padding.top} 
            textAnchor="middle" 
            fontSize="12"
          >
            {Math.round(maxValue)}
          </text>
          <text 
            x={padding.left - 30} 
            y={(chartHeight - padding.bottom + padding.top) / 2} 
            textAnchor="middle" 
            fontSize="12"
          >
            {Math.round((maxValue + minValue) / 2)}
          </text>
          <text 
            x={padding.left - 30} 
            y={chartHeight - padding.bottom} 
            textAnchor="middle" 
            fontSize="12"
          >
            {Math.round(minValue)}
          </text>
          
          {/* Line chart */}
          {path && (
            <path 
              d={path} 
              fill="none" 
              stroke={
                visualizationMode === 'respiratory' 
                  ? '#4299e1' 
                  : pollutantColorScales[selectedPollutant]?.moderate || '#4CAF50'
              } 
              strokeWidth="2" 
            />
          )}
          
          {/* Data points */}
          {visualizationMode === 'respiratory' ? (
            years.map((year, index) => {
              const value = getMetricValue(stateTimeSeries?.[year] || {}, year);
              if (value === null || value === undefined) return null;
              
              return (
                <circle 
                  key={year} 
                  cx={xScale(index)} 
                  cy={yScale(value)} 
                  r="4" 
                  fill={year === selectedYear ? '#FF0000' : '#FFF'} 
                  stroke="#4299e1"
                  strokeWidth="2" 
                />
              );
            })
          ) : (
            chartData.map((d, index) => {
              if (d.Value === null || d.Value === undefined) return null;
              
              return (
                <circle 
                  key={d.Year} 
                  cx={xScale(index)} 
                  cy={yScale(d.Value)} 
                  r="4" 
                  fill={d.Year === selectedYear ? '#FF0000' : '#FFF'} 
                  stroke={pollutantColorScales[selectedPollutant]?.moderate || '#4CAF50'}
                  strokeWidth="2" 
                />
              );
            })
          )}
        </svg>
      </div>
    );
  };
  
  // Get pollutant-specific thresholds for legend
  const getPollutantThresholds = (pollutant) => {
    const thresholds = {
      'PM2.5': { good: '0-12', moderate: '12.1-35', unhealthy: '35.1+' },
      'O3': { good: '0-0.054', moderate: '0.055-0.070', unhealthy: '0.071+' },
      'CO': { good: '0-4.4', moderate: '4.5-9.4', unhealthy: '9.5+' },
      'PM10': { good: '0-80', moderate: '81-150', unhealthy: '151+' },
      'SO2': { good: '0-35', moderate: '36-75', unhealthy: '76+' },
      'NO2': { good: '0-53', moderate: '54-100', unhealthy: '101+' }
    };
    
    return thresholds[pollutant] || thresholds['PM2.5'];
  };

  return (
    <div className="enhanced-us-map-container">
      {isLoading ? (
        <div className="loading-indicator">Loading map data...</div>
      ) : (
        <>
          <div className="map-controls">
            <button 
              onClick={() => {
                changeVisualizationMode('respiratory');
                console.log("Changed to respiratory mode");
              }}
              className={`viz-toggle-btn ${visualizationMode === 'respiratory' ? 'active' : ''}`}
            >
              Respiratory Index
            </button>
            <button 
              onClick={() => {
                changeVisualizationMode('airQuality');
                console.log("Changed to air quality mode");
              }}
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
            style={{ width: '100%', height: '500px', marginBottom: '20px' }}
          />
          
          <div className="dashboard-row">
            {selectedState && currentData && currentData[selectedState] && (
              <div className="state-info-panel">
                <h2>{selectedState} - {currentData[selectedState].description}</h2>
                <div className="state-details">
                  {visualizationMode === 'respiratory' ? (
                    <p>
                      <strong>Respiratory Health Index:</strong> {
                        currentData[selectedState].respiratoryIndex !== undefined ? 
                          currentData[selectedState].respiratoryIndex.toFixed(2) : '0'
                      }/8
                      {currentData[selectedState].respiratoryCategory && 
                        ` (${currentData[selectedState].respiratoryCategory})`}
                    </p>
                  ) : (
                    <div>
                      <p>
                        <strong>{selectedPollutant} Level:</strong> <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{
                          getPollutantValue(selectedState, selectedPollutant, selectedYear) !== null ? 
                            getPollutantValue(selectedState, selectedPollutant, selectedYear).toFixed(3) : 'No data'
                        }</span> {
                          selectedPollutant === 'PM2.5' || selectedPollutant === 'PM10' ? 'μg/m³' :
                          selectedPollutant === 'O3' || selectedPollutant === 'CO' ? 'ppm' : 'ppb'
                        }
                      </p>
                      <p>
                        <strong>Status:</strong> {
                          getPollutantValue(selectedState, selectedPollutant, selectedYear) !== null ?
                            getAirQualityStatus(getPollutantValue(selectedState, selectedPollutant, selectedYear), selectedPollutant) :
                            'Unknown'
                        }
                      </p>
                      {getPollutantValue(selectedState, selectedPollutant, selectedYear) !== null && (
                        <p>
                          <strong>Change since 2016:</strong> {
                            getPercentChange(selectedState, selectedPollutant, selectedYear) !== null ?
                              getPercentChange(selectedState, selectedPollutant, selectedYear).toFixed(1) + '%' :
                              'Unknown'
                          }
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="state-description">
                    <p>
                      Data for {selectedState} in {selectedYear}. Use the time slider to view changes over time.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedState && (
              <div className="time-series-container">
                {renderTimeSeriesChart()}
              </div>
            )}
          </div>
          
          <div className="map-legend">
            <h3>
              {visualizationMode === 'respiratory' ? 'Respiratory Index' : 
               `${selectedPollutant} Levels`}
            </h3>
            
            {visualizationMode === 'respiratory' && (
              <>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: '#d73027'}}></div>
                  <span>6.5-8.0 (Very Poor)</span>
                </div>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: '#fc8d59'}}></div>
                  <span>5.0-6.5 (Poor)</span>
                </div>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: '#fee090'}}></div>
                  <span>3.5-5.0 (Moderate)</span>
                </div>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: '#e0f3f8'}}></div>
                  <span>2.0-3.5 (Good)</span>
                </div>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: '#91bfdb'}}></div>
                  <span>0.0-2.0 (Very Good)</span>
                </div>
              </>
            )}
            
            {visualizationMode === 'airQuality' && (
              <>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: pollutantColorScales[selectedPollutant].unhealthy}}></div>
                  <span>Unhealthy ({getPollutantThresholds(selectedPollutant).unhealthy})</span>
                </div>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: pollutantColorScales[selectedPollutant].moderate}}></div>
                  <span>Moderate ({getPollutantThresholds(selectedPollutant).moderate})</span>
                </div>
                <div className="legend-item">
                  <div className="color-box" style={{backgroundColor: pollutantColorScales[selectedPollutant].good}}></div>
                  <span>Good ({getPollutantThresholds(selectedPollutant).good})</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedUSMap;