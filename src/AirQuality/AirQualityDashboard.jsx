import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
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

  // Process data for national trends over time
  const getNationalTrends = () => {
    const yearColumns = ['2016', '2017', '2018', '2019', '2020', '2021', '2022'];
    const pollutants = [...new Set(data.map(row => row.Pollutant))];
    
    const nationalTrends = yearColumns.map(year => {
      const yearData = { year };
      
      pollutants.forEach(pollutant => {
        const pollutantData = data.filter(row => row.Pollutant === pollutant);
        const validData = pollutantData.filter(row => row[year] !== null);
        
        if (validData.length > 0) {
          const avg = validData.reduce((sum, row) => sum + row[year], 0) / validData.length;
          yearData[pollutant] = avg;
        }
      });
      
      return yearData;
    });
    
    return nationalTrends;
  };

  // Process data for pollutant comparison by state
  const getStateComparison = () => {
    if (selectedPollutant) {
      const pollutantData = data.filter(row => row.Pollutant === selectedPollutant && row['2022'] !== null);
      return pollutantData.map(row => ({
        state: row.State,
        value: row['2022']
      })).sort((a, b) => b.value - a.value);
    }
    return [];
  };

  if (loading) {
    return <div className="loading">Loading air quality data...</div>;
  }

  const nationalTrendsData = getNationalTrends();
  const stateComparisonData = getStateComparison().slice(0, 10); // Top 10 states

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
      
      {selectedView === 'trends' && (
        <div className="chart-container">
          <h3>National Air Quality Trends (2016-2022)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={nationalTrendsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value.toFixed(3)} ${pollutantUnits[name] || ''}`,
                    name
                  ]}
                />
                <Legend />
                {Object.keys(pollutantColors).map(pollutant => (
                  <Line
                    key={pollutant}
                    type="monotone"
                    dataKey={pollutant}
                    stroke={pollutantColors[pollutant]}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {selectedView === 'states' && (
        <div className="chart-container">
          <h3>Top 10 States by {selectedPollutant} Levels (2022)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={stateComparisonData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="state" type="category" />
                <Tooltip 
                  formatter={(value) => [`${value} ${pollutantUnits[selectedPollutant]}`, selectedPollutant]}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name={selectedPollutant} 
                  fill={pollutantColors[selectedPollutant]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirQualityDashboard;