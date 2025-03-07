import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import _ from 'lodash';
import './RespiratoryChart.css';

const color = [
  '#B8B1E5', // New Mexico
  '#98DBA5', // Georgia
  '#FFE0A2', // Virginia
  '#FFA07A', // New York City
  '#FF9E9E', // South Carolina
  '#DA70D6', // Louisiana
  '#9370DB', // Texas
  '#7B68EE', // New Jersey
  '#87CEEB', // Puerto Rico
  '#90EE90'  // Oklahoma
];

const RespiratoryChart = () => {
  const svgRef = useRef(null);
  const legendRef = useRef(null);
  const [visibleStates, setVisibleStates] = useState({});

  const createVisualization = (data, states) => {
    if (Object.keys(visibleStates).length === 0) {
      const initialVisibility = {};
      states.forEach(state => {
        initialVisibility[state] = true;
      });
      setVisibleStates(initialVisibility);
    }

    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(legendRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 860 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip');

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('font-family', "'Poppins', sans-serif")
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([2016, 2022])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 8])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(states)
      .range(color);

    const line = d3.line()
      .x(d => xScale(d.YEAR))
      .y(d => yScale(d.LEVEL))
      .curve(d3.curveMonotoneX);

    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(''));

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(7)
        .tickFormat(d3.format('d')));

    svg.append('g')
      .call(d3.axisLeft(yScale));

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

    states.forEach(state => {
      const stateData = data.filter(d => d.STATE === state);
      svg.append('path')
        .datum(stateData)
        .attr('fill', 'none')
        .attr('stroke', colorScale(state))
        .attr('stroke-width', 2.5)
        .attr('d', line)
        .attr('class', 'line')
        .style('opacity', visibleStates[state] ? 1 : 0)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .on('mouseover', function() {
          if (visibleStates[state]) {
            d3.select(this)
              .attr('stroke-width', 4)
              .style('filter', 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))');
            tooltip.style('opacity', 1);
          }
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('stroke-width', 2.5)
            .style('filter', 'none');
          tooltip.style('opacity', 0);
        })
        .on('mousemove', function(event) {
          if (!visibleStates[state]) return;
          const mouseX = d3.pointer(event)[0];
          const year = Math.round(xScale.invert(mouseX));
          const yearData = stateData.find(d => d.YEAR === year);
          
          if (yearData) {
            tooltip
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 10}px`)
              .html(`
                <strong>${state}</strong><br>
                Year: ${year}<br>
                Level: ${yearData.LEVEL.toFixed(2)}
              `);
          }
        });
    });

    const legend = d3.select(legendRef.current)
      .attr('width', 180)
      .attr('height', height + margin.top + margin.bottom);

    const legendItems = legend.selectAll('.legend-item')
      .data(states)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0,${i * 30 + 20})`);

    legendItems.append('foreignObject')
      .attr('width', 20)
      .attr('height', 20)
      .attr('y', -5)
      .append('xhtml:div')
      .style('margin-right', '5px')
      .html(state => `
        <input 
          type="checkbox" 
          ${visibleStates[state] ? 'checked' : ''} 
          style="cursor: pointer;"
          onchange="this.dispatchEvent(new CustomEvent('checkboxChange', {bubbles: true, detail: '${state}'}))"
        />
      `);

    legendItems.append('rect')
      .attr('x', 25)
      .attr('width', 15)
      .attr('height', 15)
      .style('fill', d => colorScale(d))
      .style('opacity', d => visibleStates[d] ? 1 : 0.3);

    legendItems.append('text')
      .attr('x', 45)
      .attr('y', 12)
      .text(d => d)
      .style('font-size', '14px')
      .style('font-family', "'Poppins', sans-serif")
      .style('opacity', d => visibleStates[d] ? 1 : 0.3);

    legendRef.current.addEventListener('checkboxChange', (event) => {
      const state = event.detail;
      setVisibleStates(prev => ({
        ...prev,
        [state]: !prev[state]
      }));
    });
  };

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
        createVisualization(filteredData, top10States);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();

    return () => {
      d3.selectAll('.tooltip').remove();
    };
  }, [visibleStates]);

  return (
    <div className="respiratory-section">
      <h2 className="chart-title">
        Top 10 States - Respiratory Illness Rates (2016-2022)
      </h2>
      <div className="respiratory-chart-container">
        <div className="chart-content">
          <svg ref={svgRef} className="main-chart"></svg>
          <svg ref={legendRef} className="chart-legend"></svg>
        </div>
      </div>
    </div>
  );
};

export default RespiratoryChart;