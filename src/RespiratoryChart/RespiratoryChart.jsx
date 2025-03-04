// RespiratoryChart.jsx - updated with state lines
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import _ from 'lodash';
import './RespiratoryChart.css';

const color = [
  '#B8B1E5', '#98DBA5', '#FFE0A2', '#FFA07A', '#FF9E9E',
  '#DA70D6', '#9370DB', '#7B68EE', '#87CEEB', '#90EE90'
];

const RespiratoryChart = () => {
  const svgRef = useRef(null);
  const legendRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        
        // Process to get top 10 states
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
        const filteredData = parsed.data.filter(d => top10States.includes(d.STATE));
        
        // Set up chart
        const margin = { top: 20, right: 30, bottom: 60, left: 50 };
        const width = 1000 - margin.left - margin.right;
        const height = 450 - margin.top - margin.bottom;
        
        // Clear existing content
        d3.select(svgRef.current).selectAll("*").remove();
        
        // Create SVG
        const svg = d3.select(svgRef.current)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Set up scales
        const xScale = d3.scaleLinear()
          .domain([2016, 2022])
          .range([0, width]);
        
        const yScale = d3.scaleLinear()
          .domain([0, 8])
          .range([height, 0]);
          
        // Define color scale
        const colorScale = d3.scaleOrdinal()
          .domain(top10States)
          .range(color);

        // Define line generator
        const line = d3.line()
          .x(d => xScale(d.YEAR))
          .y(d => yScale(d.LEVEL))
          .curve(d3.curveMonotoneX);
        
        // Add axes
        svg.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(xScale).ticks(7).tickFormat(d3.format('d')));
        
        svg.append('g')
          .call(d3.axisLeft(yScale));
        
        // Add grid
        svg.append('g')
          .attr('class', 'grid')
          .attr('opacity', 0.1)
          .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat(''));
        
        // Add axis labels
        svg.append('text')
          .attr('class', 'axis-label')
          .attr('x', width / 2)
          .attr('y', height + 40)
          .style('text-anchor', 'middle')
          .text('Year');
        
        svg.append('text')
          .attr('class', 'axis-label')
          .attr('transform', 'rotate(-90)')
          .attr('x', -height / 2)
          .attr('y', -40)
          .style('text-anchor', 'middle')
          .text('Levels');
        
        // Add a line for each state
        top10States.forEach(state => {
          const stateData = filteredData.filter(d => d.STATE === state);
          stateData.sort((a, b) => a.YEAR - b.YEAR);
          
          svg.append('path')
            .datum(stateData)
            .attr('fill', 'none')
            .attr('stroke', colorScale(state))
            .attr('stroke-width', 1.5)
            .attr('d', line);
        });
        
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
    <div className="chart-container" style={{ width: '100%', minWidth: '1200px', padding: '20px' }}>
      <h2 className="chart-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
        Top 10 States - Respiratory Illness Rates (2016-2022)
      </h2>
      <div className="chart-content" style={{ display: 'flex', justifyContent: 'center' }}>
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <>
            <svg ref={svgRef} className="main-chart"></svg>
            <svg ref={legendRef} className="chart-legend"></svg>
          </>
        )}
      </div>
    </div>
  );
};

export default RespiratoryChart;