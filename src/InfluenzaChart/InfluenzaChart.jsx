import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import './InfluenzaChart.css';

const InfluenzaChart = () => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Function to get container dimensions
    const getContainerDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const calculatedWidth = Math.max(300, Math.min(1000, width - 40)); // ensure reasonable bounds
        setDimensions({
          width: calculatedWidth,
          height: calculatedWidth * 0.6 // maintain aspect ratio
        });
      }
    };

    // Initialize dimensions
    getContainerDimensions();

    // Add resize listener
    window.addEventListener('resize', getContainerDimensions);

    // Clean up
    return () => window.removeEventListener('resize', getContainerDimensions);
  }, []);

  useEffect(() => {
    // Only proceed if we have valid dimensions
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    const fetchData = async () => {
      try {
        console.log('Fetching influenza data...');
        const response = await fetch('/InfluenzaChart.csv');
        const csvText = await response.text();
        
        console.log('CSV data fetched, parsing...');
        const parsedData = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        console.log('Parsed data:', parsedData);

        const yearlyData = parsedData.data.reduce((acc, row) => {
          const year = row.ISO_YEAR;
          if (!acc[year]) {
            acc[year] = {
              year,
              INF_A: 0,
              INF_B: 0,
              INF_ALL: 0,
              count: 0
            };
          }
          
          if (row.INF_A != null && row.INF_B != null && row.INF_ALL != null) {
            acc[year].INF_A += row.INF_A;
            acc[year].INF_B += row.INF_B;
            acc[year].INF_ALL += row.INF_ALL;
            acc[year].count++;
          }
          return acc;
        }, {});

        const data = Object.values(yearlyData)
          .map(year => ({
            year: year.year,
            'Influenza A': Number((year.INF_A / year.count).toFixed(2)),
            'Influenza B': Number((year.INF_B / year.count).toFixed(2)),
            'Total Influenza': Number((year.INF_ALL / year.count).toFixed(2))
          }))
          .sort((a, b) => a.year - b.year);

        console.log('Processed data:', data);
        
        // Just verify data is loading correctly
        if (data && data.length > 0) {
          console.log('Data loaded successfully. First year:', data[0].year);
        } else {
          console.warn('No data processed from CSV');
        }
      } catch (error) {
        console.error('Error fetching or parsing data:', error);
      }
    };
    
    // Execute the fetch function
    fetchData();
    
  }, [dimensions]);
  
  return (
    <div className="influenza-chart-container" ref={containerRef}>
      <div className="influenza-chart-wrapper">
        <h2 className="chart-title">Influenza Trend (2016-2022)</h2>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default InfluenzaChart;