import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

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
    return <div>Loading data...</div>;
  }

  return (
    <div>
      <h2>Air Quality Dashboard</h2>
      <p>Data points loaded: {data.length}</p>
    </div>
  );
};

export default AirQualityDashboard;