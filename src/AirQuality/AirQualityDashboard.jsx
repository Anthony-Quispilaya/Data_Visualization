import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './AirQualityDashboard.css';

const AirQualityDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
      <p>Data points loaded: {data.length}</p>
    </div>
  );
};

export default AirQualityDashboard;