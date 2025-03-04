// RespiratoryChart.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import _ from 'lodash';
import './RespiratoryChart.css';

const RespiratoryChart = () => {
  const svgRef = useRef(null);
  const legendRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topStates, setTopStates] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.csv');
        const csvText = await response.text();
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Process to get top 10 states by average respiratory level
        const stateAverages = _.chain(parsed.data)
          .groupBy('STATE')
          .map((group, state) => ({
            state,
            avgLevel: _.meanBy(group, 'LEVEL')
          }))
          .orderBy(['avgLevel'], ['desc'])
          .take(10)
          .value();
        
        const top10States = stateAverages.map(s => s.state);
        const filtered = parsed.data.filter(d => top10States.includes(d.STATE));
        
        setTopStates(top10States);
        setFilteredData(filtered);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  return (
    <div className="chart-container">
      <h2 className="chart-title">
        Top 10 States - Respiratory Illness Rates (2016-2022)
      </h2>
      <div className="chart-content">
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <>
            <svg ref={svgRef} className="main-chart"></svg>
            <svg ref={legendRef} className="chart-legend"></svg>
            <div>
              <p>Top states: {topStates.join(', ')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RespiratoryChart;