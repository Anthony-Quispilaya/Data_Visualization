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
        const response = await fetch('/InfluenzaChart.csv');
        const csvText = await response.text();
        
        const parsedData = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

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

        createChart(data);
      } catch (error) {
        console.error('Error fetching or parsing data:', error);
      }
    };

    const createChart = (data) => {
      // Clear any existing SVG content
      d3.select(svgRef.current).selectAll("*").remove();

      // Set up dimensions
      const margin = { top: 40, right: 120, bottom: 60, left: 80 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom;

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .style('font-family', "'Poppins', sans-serif")
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Set up scales
      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d['Influenza A'], d['Influenza B'], d['Total Influenza'])) * 1.1])
        .range([height, 0]);

      // Create curved line generators using cardinal interpolation
      const lineGenerator = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(d3.curveCardinal.tension(0.4));

      // Add X axis
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format('d')))
        .style('font-size', '12px');

      // Add Y axis
      svg.append('g')
        .call(d3.axisLeft(y))
        .style('font-size', '12px');

      // Add X axis label
      svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Year');

      // Add Y axis label
      svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -(height / 2))
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Positivity Rate');

      // Add COVID-19 reference line
      svg.append('line')
        .attr('x1', x(2020))
        .attr('x2', x(2020))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      // Add COVID-19 label
      svg.append('text')
        .attr('x', x(2020))
        .attr('y', 0)
        .attr('dy', '-10')
        .attr('text-anchor', 'middle')
        .style('fill', 'red')
        .style('font-size', '16px')
        .text('COVID-19 Pandemic');

      // Define line colors and names
      const lines = [
        { name: 'Influenza A', color: '#8884d8' },
        { name: 'Influenza B', color: '#82ca9d' },
        { name: 'Total Influenza', color: '#ff7300' }
      ];

      // Create tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      // Create vertical line for hover effect
      const vertical = svg.append('line')
        .attr('class', 'vertical-line')
        .style('opacity', 0);

      // Create hover area
      const hoverArea = svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'none')
        .style('pointer-events', 'all');

      // Add lines and dots
      lines.forEach(line => {
        // Prepare data for curved line
        const lineData = data.map(d => ({
          year: d.year,
          value: d[line.name]
        }));

        // Add the curved line
        svg.append('path')
          .datum(lineData)
          .attr('fill', 'none')
          .attr('stroke', line.color)
          .attr('stroke-width', 3)
          .attr('d', lineGenerator);

        // Add dots
        svg.selectAll(`dot-${line.name}`)
          .data(lineData)
          .enter()
          .append('circle')
          .attr('cx', d => x(d.year))
          .attr('cy', d => y(d.value))
          .attr('r', 5)
          .attr('fill', line.color);
      });

      // Add hover effects
      hoverArea
        .on('mousemove', function(event) {
          const mouseX = d3.pointer(event)[0];
          const year = Math.round(x.invert(mouseX));
          
          // Find the closest data point
          const bisect = d3.bisector(d => d.year).left;
          const index = bisect(data, year);
          const d = data[index];

          if (d) {
            // Update vertical line
            vertical
              .attr('x1', x(d.year))
              .attr('x2', x(d.year))
              .attr('y1', 0)
              .attr('y2', height)
              .style('stroke', 'gray')
              .style('stroke-width', 1)
              .style('stroke-dasharray', '4,4')
              .style('opacity', 1);

            // Update tooltip
            let tooltipContent = `Year: ${d.year}<br/>`;
            lines.forEach(line => {
              tooltipContent += `${line.name}: ${d[line.name]}<br/>`;
            });

            tooltip
              .html(tooltipContent)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px')
              .style('opacity', 1);
          }
        })
        .on('mouseout', function() {
          vertical.style('opacity', 0);
          tooltip.style('opacity', 0);
        });

      // Add legend with updated position based on available space
      const legendX = width - 100;
      const legendY = 10;
      
      const legend = svg.append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 12)
        .attr('text-anchor', 'start')
        .selectAll('g')
        .data(lines)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${legendX},${legendY + i * 20})`);

      legend.append('rect')
        .attr('x', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d => d.color);

      legend.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(d => d.name);
    };

    fetchData();

    // Cleanup function
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };
  }, [dimensions]); // Re-render when dimensions change

  return (
    <>
      <div className="section-intro">
        <h2>Influenza Prevalence Trends (2016-2022)</h2>
        <p>
          Track the annual patterns of influenza transmission across the United States. The visualization shows how
          both Influenza A and B variants have changed over time, with a notable impact during the COVID-19 pandemic.
        </p>
      </div>
      <div className="influenza-chart-container" ref={containerRef}>
        <div className="influenza-chart-wrapper">
          <svg ref={svgRef}></svg>
        </div>
      </div>
    </>
  );
};

export default InfluenzaChart;