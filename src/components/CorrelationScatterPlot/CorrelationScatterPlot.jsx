import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as d3 from 'd3';
import './CorrelationScatterPlot.css';

const CorrelationScatterPlot = () => {
  const [selectedYear, setSelectedYear] = useState(2022); // Default to most recent year
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [availableYears] = useState([2016, 2017, 2018, 2019, 2020, 2021, 2022]);
  const [availablePollutants, setAvailablePollutants] = useState(['PM2.5']);
  const [airQualityData, setAirQualityData] = useState([]);
  const [respiratoryData, setRespiratoryData] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [correlationCoefficient, setCorrelationCoefficient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef(null);

  // Load the data files
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load air quality data
        const aqResponse = await fetch('/aq-map-data.csv');
        const aqText = await aqResponse.text();
        const aqParsed = Papa.parse(aqText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Load respiratory data
        const respResponse = await fetch('/data.csv');
        const respText = await respResponse.text();
        const respParsed = Papa.parse(respText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Process air quality data
        const aqProcessed = aqParsed.data.map(row => ({
          state: row.State,
          pollutant: row.Pollutant,
          year: row.Year,
          value: row.Value
        }));
        setAirQualityData(aqProcessed);
        
        // Find unique pollutants in the data
        const uniquePollutants = [...new Set(aqProcessed.map(row => row.pollutant))];
        setAvailablePollutants(uniquePollutants);
        
        // Process respiratory data
        const respProcessed = respParsed.data.map(row => {
          // Convert state names to state codes
          const stateCode = getStateCodeFromName(row.STATE);
          return {
            state: stateCode,
            stateName: row.STATE,
            year: row.YEAR,
            level: row.LEVEL
          };
        });
        setRespiratoryData(respProcessed);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Helper to convert state name to code
  const getStateCodeFromName = (stateName) => {
    // If it's already a state code, return it
    if (/^[A-Z]{2}$/.test(stateName)) {
      return stateName;
    }
    
    // Map full state names to codes
    const stateNameToCode = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    
    return stateNameToCode[stateName];
  };

  // Helper to get state name from code
  const getStateNameFromCode = (stateCode) => {
    const stateCodeToName = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
      'DC': 'District of Columbia'
    };
    
    return stateCodeToName[stateCode] || stateCode;
  };

  // Prepare correlation data when year, pollutant, or base data changes
  useEffect(() => {
    if (airQualityData.length === 0 || respiratoryData.length === 0 || isLoading) {
      return;
    }
    
    // Filter air quality data for the selected pollutant and year
    const aqFiltered = airQualityData.filter(
      item => item.pollutant === selectedPollutant && item.year === selectedYear
    );
    
    // Filter respiratory data for the selected year
    const respFiltered = respiratoryData.filter(
      item => item.year === selectedYear
    );
    
    // Build correlation data points - only include states that have both metrics
    const dataPoints = [];
    
    // Create a map for faster lookups
    const aqByState = {};
    aqFiltered.forEach(item => {
      aqByState[item.state] = item.value;
    });
    
    // Find matching respiratory data
    respFiltered.forEach(respItem => {
      if (aqByState[respItem.state]) {
        dataPoints.push({
          state: respItem.state,
          stateName: respItem.stateName || getStateNameFromCode(respItem.state),
          airQualityValue: aqByState[respItem.state],
          respiratoryIndex: respItem.level
        });
      }
    });
    
    console.log(`Found ${dataPoints.length} states with both ${selectedPollutant} and respiratory data for ${selectedYear}`);
    if (dataPoints.length > 0) {
      console.log("States with data:", dataPoints.map(d => d.state).join(", "));
    }
    
    setCorrelationData(dataPoints);
    
    // Calculate Pearson correlation coefficient if we have enough data points
    if (dataPoints.length > 1) {
      const correlation = calculateCorrelation(
        dataPoints.map(d => d.airQualityValue),
        dataPoints.map(d => d.respiratoryIndex)
      );
      setCorrelationCoefficient(correlation);
      console.log(`Correlation coefficient for ${selectedPollutant} (${selectedYear}): ${correlation.toFixed(3)}`);
    } else {
      setCorrelationCoefficient(null);
    }
  }, [airQualityData, respiratoryData, selectedYear, selectedPollutant, isLoading]);

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (x, y) => {
    const n = x.length;
    
    // Mean of x and y
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    // Calculate numerator and denominators
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    // Calculate correlation coefficient
    const denominator = Math.sqrt(xDenominator * yDenominator);
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Helper to describe correlation strength
  const getCorrelationDescription = (r) => {
    const absR = Math.abs(r);
    if (absR < 0.2) return "very weak";
    if (absR < 0.4) return "weak";
    if (absR < 0.6) return "moderate";
    if (absR < 0.8) return "strong";
    return "very strong";
  };
  
  // Get correlation type (positive or negative)
  const getCorrelationType = (r) => {
    if (r === 0) return "no";
    return r > 0 ? "positive" : "negative";
  };

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };
  
  const handlePollutantChange = (e) => {
    setSelectedPollutant(e.target.value);
  };

  // Get the appropriate units for the selected pollutant
  const getPollutantUnits = (pollutant) => {
    if (pollutant === 'PM2.5' || pollutant === 'PM10') return 'μg/m³';
    if (pollutant === 'O3' || pollutant === 'CO') return 'ppm';
    return 'ppb';
  };
  
  // Draw scatter plot using D3
  useEffect(() => {
    if (correlationData.length <= 1 || !svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Set dimensions and margins
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("font-family", "'Poppins', sans-serif")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set scales
    const xExtent = d3.extent(correlationData, d => d.airQualityValue);
    const yExtent = d3.extent(correlationData, d => d.respiratoryIndex);
    
    // Add some padding to the extents
    const xPadding = Math.max(0.1, (xExtent[1] - xExtent[0]) * 0.1);
    const yPadding = Math.max(0.1, (yExtent[1] - yExtent[0]) * 0.1);
    
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([height, 0]);
    
    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("y", 40)
      .attr("x", width / 2)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text(`${selectedPollutant} Level ${selectedPollutant === 'PM2.5' || selectedPollutant === 'PM10' ? '(μg/m³)' : 
                 selectedPollutant === 'O3' || selectedPollutant === 'CO' ? '(ppm)' : '(ppb)'}`);
    
    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text("Respiratory Index (0-8)");
    
    // Calculate regression line data - we need at least 2 points for a line
    if (correlationData.length >= 2) {
      const x = correlationData.map(d => d.airQualityValue);
      const y = correlationData.map(d => d.respiratoryIndex);
      
      const n = x.length;
      const xMean = x.reduce((a, b) => a + b, 0) / n;
      const yMean = y.reduce((a, b) => a + b, 0) / n;
      
      // Calculate slope and intercept for least squares regression line
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (x[i] - xMean) * (y[i] - yMean);
        denominator += (x[i] - xMean) * (x[i] - xMean);
      }
      
      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = yMean - slope * xMean;
      
      console.log(`Regression line for ${selectedPollutant} (${selectedYear}): y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`);
      
      // Add regression line
      const lineData = [
        { x: xExtent[0] - xPadding, y: slope * (xExtent[0] - xPadding) + intercept },
        { x: xExtent[1] + xPadding, y: slope * (xExtent[1] + xPadding) + intercept }
      ];
      
      // Draw the regression line without filtering - adjust Y scale if needed
      const yDomain = yScale.domain();
      if (lineData[0].y < yDomain[0] || lineData[1].y < yDomain[0] ||
          lineData[0].y > yDomain[1] || lineData[1].y > yDomain[1]) {
        
        // If line goes outside Y domain, adjust the Y domain to include it
        const newYMin = Math.min(yDomain[0], lineData[0].y, lineData[1].y);
        const newYMax = Math.max(yDomain[1], lineData[0].y, lineData[1].y);
        
        yScale.domain([newYMin, newYMax]);
        
        // Redraw Y axis with new domain
        svg.select("g").call(d3.axisLeft(yScale));
      }
      
      const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));
      
      svg.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "#ff6b6b") 
        .attr("stroke-width", 2)
        .attr("d", line);
    }
    
    // Add data points
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "scatter-tooltip")
      .style("opacity", 0);
    
    svg.selectAll(".dot")
      .data(correlationData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.airQualityValue))
      .attr("cy", d => yScale(d.respiratoryIndex))
      .attr("r", 6)
      .style("fill", "#4285F4")
      .style("opacity", 0.8)
      .style("stroke", "#fff")
      .style("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("fill", "#DB4437")
          .style("r", 8);
        
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        
        tooltip.html(`
          <strong>${d.stateName} (${d.state})</strong><br/>
          ${selectedPollutant}: ${d.airQualityValue.toFixed(2)}<br/>
          Respiratory Index: ${d.respiratoryIndex.toFixed(2)}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("fill", "#4285F4")
          .style("r", 6);
        
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
    
    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Correlation Between ${selectedPollutant} and Respiratory Health (${selectedYear})`);
    
    // Clean up
    return () => {
      tooltip.remove();
    };
  }, [correlationData, selectedPollutant, selectedYear]);

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
      
      {isLoading ? (
        <div className="loading-indicator">Loading data...</div>
      ) : (
        <>
          {correlationData.length > 1 && correlationCoefficient !== null ? (
            <div className="correlation-stats">
              <p>
                <strong>Number of States with Data:</strong> {correlationData.length}
              </p>
              <p>
                <strong>Correlation Coefficient (r):</strong> {correlationCoefficient.toFixed(3)}
              </p>
              <p>
                <strong>Interpretation:</strong> Data shows a {getCorrelationDescription(correlationCoefficient)} {getCorrelationType(correlationCoefficient)} correlation 
                between {selectedPollutant} levels and respiratory illness rates.
              </p>
              <p>
                <strong>Relationship:</strong> {correlationCoefficient > 0 
                  ? "As air pollution increases, respiratory health issues tend to increase." 
                  : "As air pollution increases, respiratory health issues tend to decrease."}
              </p>
              <p className="correlation-note">
                <em>Note: Correlation does not necessarily imply causation. Other factors may influence these relationships.</em>
              </p>
            </div>
          ) : (
            <div className="correlation-stats">
              <p>
                <strong>Insufficient Data:</strong> Not enough states have both {selectedPollutant} and respiratory data for {selectedYear} to calculate a meaningful correlation.
              </p>
              <p>
                Try selecting a different pollutant or year.
              </p>
            </div>
          )}
          
          <div className="chart-container">
            {correlationData.length > 1 ? (
              <svg ref={svgRef}></svg>
            ) : (
              <div className="no-data-message">
                <p>Insufficient data to display the scatter plot for {selectedPollutant} in {selectedYear}.</p>
                <p>Please select a different pollutant or year.</p>
              </div>
            )}
          </div>

          <div className="correlation-explanation">
            <h3>Understanding This Chart</h3>
            <p>
              Each point represents a U.S. state, showing the relationship between {selectedPollutant} levels ({getPollutantUnits(selectedPollutant)}) and respiratory illness indices (0-8 scale).
              The red line represents the trend line based on this data. A steeper slope indicates a stronger relationship.
            </p>
            <p>
              <strong>Hover over any point</strong> to see detailed information for that state.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CorrelationScatterPlot;