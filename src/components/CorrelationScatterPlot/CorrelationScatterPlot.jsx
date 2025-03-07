import React, { useState } from 'react';
import './CorrelationScatterPlot.css';

const CorrelationScatterPlot = () => {
  const [selectedYear, setSelectedYear] = useState(2022); // Default to most recent year
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [availableYears] = useState([2016, 2017, 2018, 2019, 2020, 2021, 2022]);
  const [availablePollutants] = useState(['PM2.5', 'PM10', 'O3', 'CO', 'SO2', 'NO2']);

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
      
      <div className="chart-container">
        <p>Selected Year: {selectedYear}, Selected Pollutant: {selectedPollutant}</p>
        <p>Data visualization coming soon...</p>
      </div>
    </div>
  );
};

export default CorrelationScatterPlot;