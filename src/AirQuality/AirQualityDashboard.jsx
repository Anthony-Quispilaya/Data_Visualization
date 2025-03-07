import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './AirQualityDashboard.css';

const AirQualityDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [selectedView, setSelectedView] = useState('trends');
  
  const pollutantColors = {
    'PM2.5': '#8884d8',
    'O3': '#82ca9d',
    'CO': '#ffc658',
    'PM10': '#ff8042',
    'SO2': '#0088FE',
    'NO2': '#FF8042'
  };
  
  const pollutantUnits = {
    'PM2.5': 'μg/m³',
    'O3': 'ppm',
    'CO': 'ppm',
    'PM10': 'μg/m³',
    'SO2': 'ppb',
    'NO2': 'ppb'
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data3.csv');
        const fileContent = await response.text();
        
        Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error reading file:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading air quality data...</div>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">U.S. Air Quality Dashboard (2016-2022)</h2>
      <p>Explore air pollution trends across the United States. This dashboard provides insights into various pollutant levels.</p>
      
      <div className="controls-container">
        <div className="control-group">
          <label>Select Pollutant:</label>
          <select 
            value={selectedPollutant} 
            onChange={(e) => setSelectedPollutant(e.target.value)}
          >
            <option value="PM2.5">PM2.5</option>
            <option value="O3">Ozone (O3)</option>
            <option value="CO">Carbon Monoxide (CO)</option>
            <option value="PM10">PM10</option>
            <option value="SO2">Sulfur Dioxide (SO2)</option>
            <option value="NO2">Nitrogen Dioxide (NO2)</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>View:</label>
          <select 
            value={selectedView} 
            onChange={(e) => setSelectedView(e.target.value)}
          >
            <option value="trends">National Trends</option>
            <option value="states">State Comparison</option>
          </select>
        </div>
      </div>
      
      <div className="data-display">
        <p>Selected pollutant: {selectedPollutant} ({pollutantUnits[selectedPollutant]})</p>
        <p>Selected view: {selectedView}</p>
        <p>Data points loaded: {data.length}</p>
      </div>
    </div>
  );
};

export default AirQualityDashboard;