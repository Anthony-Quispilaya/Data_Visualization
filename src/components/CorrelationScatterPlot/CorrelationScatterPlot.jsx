import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './CorrelationScatterPlot.css';

const CorrelationScatterPlot = () => {
  const [selectedYear, setSelectedYear] = useState(2022); // Default to most recent year
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [availableYears] = useState([2016, 2017, 2018, 2019, 2020, 2021, 2022]);
  const [availablePollutants, setAvailablePollutants] = useState(['PM2.5']);
  const [airQualityData, setAirQualityData] = useState([]);
  const [respiratoryData, setRespiratoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load the data files
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load air quality data
        const aqResponse = await fetch('/aq-map-data.csv');
        const aqText = await aqResponse.text();
        const aqParsed = Papa.parse(aqText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Load respiratory data
        const respResponse = await fetch('/data.csv');
        const respText = await respResponse.text();
        const respParsed = Papa.parse(respText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Process air quality data
        const aqProcessed = aqParsed.data.map(row => ({
          state: row.State,
          pollutant: row.Pollutant,
          year: row.Year,
          value: row.Value
        }));
        setAirQualityData(aqProcessed);
        
        // Find unique pollutants in the data
        const uniquePollutants = [...new Set(aqProcessed.map(row => row.pollutant))];
        setAvailablePollutants(uniquePollutants);
        
        // Process respiratory data
        const respProcessed = respParsed.data.map(row => {
          // Convert state names to state codes
          const stateCode = getStateCodeFromName(row.STATE);
          return {
            state: stateCode,
            stateName: row.STATE,
            year: row.YEAR,
            level: row.LEVEL
          };
        });
        setRespiratoryData(respProcessed);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Helper to convert state name to code
  const getStateCodeFromName = (stateName) => {
    // If it's already a state code, return it
    if (/^[A-Z]{2}$/.test(stateName)) {
      return stateName;
    }
    
    // Map full state names to codes
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
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    
    return stateNameToCode[stateName];
  };

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };
  
  const handlePollutantChange = (e) => {
    setSelectedPollutant(e.target.value);
  };

  return (
    <div className="correlation-scatter-plot-container">
      <h2>Correlation Analysis: Air Quality vs. Respiratory Health</h2>
      
      <div className="correlation-controls">
        <div className="control-group">
          <label htmlFor="pollutant-select">Pollutant:</label>
          <select 
            id="pollutant-select"
            value={selectedPollutant} 
            onChange={handlePollutantChange}
            className="pollutant-select"
          >
            {availablePollutants.map(pollutant => (
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
        
        <div className="control-group">
          <label htmlFor="year-select">Year:</label>
          <select 
            id="year-select"
            value={selectedYear} 
            onChange={handleYearChange}
            className="year-select"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">Loading data...</div>
      ) : (
        <div className="chart-container">
          <p>Selected Year: {selectedYear}, Selected Pollutant: {selectedPollutant}</p>
          <p>Air Quality Data: {airQualityData.length} records</p>
          <p>Respiratory Data: {respiratoryData.length} records</p>
          <p>Data visualization coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default CorrelationScatterPlot;