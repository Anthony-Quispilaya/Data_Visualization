import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const D3TimeSeriesChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);

  // Load CSV data using d3.csv.
  useEffect(() => {
    d3.csv('/data.csv', (d) => {
      return {
        date: new Date(d.date),
        value: +d.value,
        event: d.event ? d.event.trim() : ''
      };
    })
      .then((loadedData) => {
        // Optionally, filter out any rows with invalid data.
        const filteredData = loadedData.filter(
          (d) => d.date instanceof Date && !isNaN(d.value)
        );
        setData(filteredData);
      })
      .catch((error) => {
        console.error('Error loading CSV:', error);
      });
  }, []);

  // Render the chart using D3 when data is loaded.
  useEffect(() => {
    if (!data) return;

    // Set dimensions and margins.
    const margin = { top: 50, right: 60, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Select the SVG and clear previous content.
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Append group element with margin transform.
    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set scales.
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, width]);

    const yMin = d3.min(data, (d) => d.value);
    const yMax = d3.max(data, (d) => d.value);
    const yScale = d3
      .scaleLinear()
      .domain([yMin * 0.9, yMax * 1.1])
      .range([height, 0]);

    // Create line generator.
    const line = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw gridlines.
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickSize(-width)
          .tickFormat('')
      )
      .selectAll('line')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '3,3');

    // Append the line path.
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#8884d8')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add axes.
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat(d3.timeFormat('%m/%d/%Y'));
    const yAxis = d3.axisLeft(yScale).ticks(6);

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '12px');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '12px');

    // Annotate events: filter for rows that have an event.
    const events = data.filter((d) => d.event !== '');

    events.forEach((d, i) => {
      // Draw a red circle at the event point.
      g.append('circle')
        .attr('cx', xScale(d.date))
        .attr('cy', yScale(d.value))
        .attr('r', 5)
        .attr('fill', 'red');

      // Stagger labels: alternate vertical offset.
      const labelOffset = i % 2 === 0 ? -15 : 20;

      // Optionally, draw a connecting dashed line.
      g.append('line')
        .attr('x1', xScale(d.date))
        .attr('y1', yScale(d.value))
        .attr('x2', xScale(d.date))
        .attr('y2', yScale(d.value) + labelOffset + (i % 2 === 0 ? 5 : -5))
        .attr('stroke', 'red')
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 1);

      // Draw the event label.
      g.append('text')
        .attr('x', xScale(d.date))
        .attr('y', yScale(d.value) + labelOffset)
        .attr('text-anchor', 'middle')
        .attr('fill', 'red')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(d.event);
    });
  }, [data]);

  return (
    <div>
      <h1>Beautiful Time Series Chart with D3</h1>
      {data ? (
        <svg ref={svgRef} style={{ border: '1px solid #ccc', background: '#fafafa' }} />
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default D3TimeSeriesChart;
