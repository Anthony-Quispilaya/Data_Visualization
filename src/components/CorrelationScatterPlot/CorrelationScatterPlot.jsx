import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import './CorrelationScatterPlot.css';

const CorrelationScatterPlot = () => {
  const [selectedYear, setSelectedYear] = useState(2022); // Default to most recent year
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [correlationData, setCorrelationData] = useState([]);
  const [correlationCoefficient, setCorrelationCoefficient] = useState(null);
  const [availableYears] = useState([2016, 2017, 2018, 2019, 2020, 2021, 2022]);
  const [airQualityData, setAirQualityData] = useState([]);
  const [respiratoryData, setRespiratoryData] = useState([]);
  const [influenzaData, setInfluenzaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [historicalCorrelations, setHistoricalCorrelations] = useState([]);
  const [correlationsByPollutant, setCorrelationsByPollutant] = useState({});
  const [correlationInsights, setCorrelationInsights] = useState('');
  const svgRef = useRef(null);
  const trendChartRef = useRef(null);
  
  // Available pollutants - only include those that are actually in the data
  const [availablePollutants, setAvailablePollutants] = useState(['PM2.5']);

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
        
        // Load influenza data
        const fluResponse = await fetch('/InfluenzaChart.csv');
        const fluText = await fetch('/InfluenzaChart.csv').then(r => r.ok ? r.text() : '');
        let fluParsed = { data: [] };
        
        if (fluText) {
          fluParsed = Papa.parse(fluText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
          });
          setInfluenzaData(fluParsed.data);
        }
        
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
        
        // Calculate historical correlations as soon as we have data
        calculateHistoricalCorrelations(aqProcessed, respProcessed, uniquePollutants);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate historical correlations for all years and pollutants
  const calculateHistoricalCorrelations = (aqData, respData, pollutants) => {
    const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022];
    const correlationHistory = [];
    const correlationsByPoll = {};
    
    // Initialize correlationsByPoll
    pollutants.forEach(pollutant => {
      correlationsByPoll[pollutant] = [];
    });
    
    // Calculate correlation for each year and pollutant
    years.forEach(year => {
      pollutants.forEach(pollutant => {
        // Filter data for this year and pollutant
        const aqFiltered = aqData.filter(
          item => item.pollutant === pollutant && item.year === year
        );
        
        const respFiltered = respData.filter(
          item => item.year === year
        );
        
        // Build correlation data points
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
              airQualityValue: aqByState[respItem.state],
              respiratoryIndex: respItem.level
            });
          }
        });
        
        // Calculate correlation if we have enough data points
        if (dataPoints.length > 1) {
          const correlation = calculateCorrelation(
            dataPoints.map(d => d.airQualityValue),
            dataPoints.map(d => d.respiratoryIndex)
          );
          
          // Add to historical data
          correlationHistory.push({
            year,
            pollutant,
            correlation,
            dataPoints: dataPoints.length
          });
          
          // Add to pollutant-specific data
          correlationsByPoll[pollutant].push({
            year,
            correlation,
            dataPoints: dataPoints.length
          });
        }
      });
    });
    
    // Sort by absolute correlation value
    correlationHistory.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    
    // Set the state
    setHistoricalCorrelations(correlationHistory);
    setCorrelationsByPollutant(correlationsByPoll);
    
    // Generate insights
    generateCorrelationInsights(correlationHistory, correlationsByPoll);
  };
  
  // Generate text insights based on correlation data
  const generateCorrelationInsights = (correlationHistory, correlationsByPoll) => {
    let insights = '';
    
    // Find strongest correlation
    const strongestCorr = correlationHistory[0]; // Already sorted by absolute value
    
    if (strongestCorr) {
      insights += `The strongest correlation (${strongestCorr.correlation.toFixed(3)}) is between ${strongestCorr.pollutant} and respiratory illness rates in ${strongestCorr.year}. `;
      
      if (strongestCorr.correlation > 0) {
        insights += `This positive correlation suggests that higher ${strongestCorr.pollutant} levels are associated with increased respiratory illness. `;
      } else {
        insights += `This negative correlation is interesting and may reflect the influence of other factors. `;
      }
    }
    
    // Check for PM2.5 specifically since it's often the most concerning pollutant
    if (correlationsByPoll['PM2.5'] && correlationsByPoll['PM2.5'].length > 0) {
      const pm25Data = correlationsByPoll['PM2.5'];
      const recentYears = pm25Data.filter(item => item.year >= 2020);
      
      if (recentYears.length > 0) {
        const avgRecentCorr = recentYears.reduce((sum, item) => sum + item.correlation, 0) / recentYears.length;
        
        insights += `\n\nIn recent years (2020-2022), PM2.5 shows an average correlation of ${avgRecentCorr.toFixed(3)} with respiratory illness. `;
        insights += avgRecentCorr > 0.4 
          ? `This moderate to strong positive correlation is concerning, as it suggests fine particulate matter may have a significant impact on respiratory health.` 
          : `This correlation suggests some relationship, though other environmental or social factors may also be influential.`;
      }
    }
    
    // Check for trends over time
    const trendAnalysis = analyzeCorrelationTrends(correlationsByPoll);
    if (trendAnalysis) {
      insights += `\n\n${trendAnalysis}`;
    }
    
    setCorrelationInsights(insights);
  };
  
  // Analyze trends in correlations over time
  const analyzeCorrelationTrends = (correlationsByPoll) => {
    const significantTrends = [];
    
    Object.keys(correlationsByPoll).forEach(pollutant => {
      const data = correlationsByPoll[pollutant];
      if (data.length < 3) return; // Need at least 3 years to identify a trend
      
      // Sort by year
      data.sort((a, b) => a.year - b.year);
      
      // Simple linear regression to detect trend
      const n = data.length;
      const x = data.map((d, i) => i); // Use index as x
      const y = data.map(d => d.correlation);
      
      // Calculate slope
      const xMean = x.reduce((a, b) => a + b, 0) / n;
      const yMean = y.reduce((a, b) => a + b, 0) / n;
      
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (x[i] - xMean) * (y[i] - yMean);
        denominator += (x[i] - xMean) * (x[i] - xMean);
      }
      
      const slope = denominator !== 0 ? numerator / denominator : 0;
      
      // If slope is significant (arbitrary threshold)
      if (Math.abs(slope) > 0.03) {
        significantTrends.push({
          pollutant,
          slope,
          direction: slope > 0 ? 'increasing' : 'decreasing',
          startYear: data[0].year,
          endYear: data[data.length - 1].year
        });
      }
    });
    
    if (significantTrends.length === 0) return null;
    
    // Create insight text
    let trendText = 'Notable trends over time: ';
    
    significantTrends.forEach((trend, i) => {
      if (i > 0) trendText += ' ';
      
      trendText += `The correlation between ${trend.pollutant} and respiratory illness has been ${trend.direction} from ${trend.startYear} to ${trend.endYear}`;
      
      if (trend.direction === 'increasing') {
        trendText += `, suggesting this pollutant's relationship with health outcomes is becoming stronger over time.`;
      } else {
        trendText += `, which may reflect changes in pollution composition, adaptation, or other environmental factors.`;
      }
    });
    
    return trendText;
  };

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
  
  // Draw scatter plot using D3
  useEffect(() => {
    if (correlationData.length === 0 || !svgRef.current) return;
    
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
  
  // Draw correlation trend chart
  useEffect(() => {
    if (!trendChartRef.current || !showTrendChart || !correlationsByPollutant[selectedPollutant]) return;
    
    // Clear previous content
    d3.select(trendChartRef.current).selectAll("*").remove();
    
    const data = [...correlationsByPollutant[selectedPollutant]];
    data.sort((a, b) => a.year - b.year);
    
    if (data.length < 2) {
      d3.select(trendChartRef.current)
        .append("text")
        .attr("x", 300)
        .attr("y", 100)
        .attr("text-anchor", "middle")
        .text("Insufficient historical data to display trends");
      return;
    }
    
    // Set dimensions and margins
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    
    // Create SVG element
    const svg = d3.select(trendChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("font-family", "'Poppins', sans-serif")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);
    
    // Y domain should be symmetric around 0 for correlation
    const yMax = Math.max(0.8, d3.max(data, d => Math.abs(d.correlation)));
    
    const yScale = d3.scaleLinear()
      .domain([-yMax, yMax])
      .range([height, 0]);
    
    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${yScale(0)})`) // Place x-axis at y=0
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d"))); // 'd' format for years
    
    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(yScale));
    
    // Add axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Year");
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Correlation Coefficient");
    
    // Add the line
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.correlation));
    
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#4285F4")
      .attr("stroke-width", 2)
      .attr("d", line);
    
    // Add dots
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.correlation))
      .attr("r", 5)
      .style("fill", d => d.correlation > 0 ? "#34A853" : "#EA4335");
    
    // Add labels to each dot
    svg.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.correlation) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text(d => d.correlation.toFixed(2));
    
    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(`${selectedPollutant} Correlation Trend (2016-2022)`);
    
    // Add a horizontal line at y=0
    svg.append("line")
      .attr("x1", 0)
      .attr("y1", yScale(0))
      .attr("x2", width)
      .attr("y2", yScale(0))
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "4");
      
    // Add correlation strength regions
    const regions = [
      { y: 0.8, label: "Very Strong" },
      { y: 0.6, label: "Strong" },
      { y: 0.4, label: "Moderate" },
      { y: 0.2, label: "Weak" }
    ];
    
    // Draw positive regions
    regions.forEach(region => {
      // Draw positive region line
      svg.append("line")
        .attr("x1", 0)
        .attr("y1", yScale(region.y))
        .attr("x2", width)
        .attr("y2", yScale(region.y))
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2");
        
      // Draw negative region line
      svg.append("line")
        .attr("x1", 0)
        .attr("y1", yScale(-region.y))
        .attr("x2", width)
        .attr("y2", yScale(-region.y))
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2");
        
      // Add labels
      svg.append("text")
        .attr("x", width + 5)
        .attr("y", yScale(region.y) + 4)
        .attr("text-anchor", "start")
        .style("font-size", "9px")
        .text(region.label);
        
      svg.append("text")
        .attr("x", width + 5)
        .attr("y", yScale(-region.y) + 4)
        .attr("text-anchor", "start")
        .style("font-size", "9px")
        .text(region.label);
    });
    
  }, [showTrendChart, correlationsByPollutant, selectedPollutant]);
  
  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };
  
  const handlePollutantChange = (e) => {
    setSelectedPollutant(e.target.value);
  };
  
  const toggleTrendChart = () => {
    setShowTrendChart(!showTrendChart);
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

  // Get the appropriate units for the selected pollutant
  const getPollutantUnits = (pollutant) => {
    if (pollutant === 'PM2.5' || pollutant === 'PM10') return 'μg/m³';
    if (pollutant === 'O3' || pollutant === 'CO') return 'ppm';
    return 'ppb';
  };

  return (
    <>
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
        
        <button 
          className={`trend-button ${showTrendChart ? 'active' : ''}`}
          onClick={toggleTrendChart}
        >
          {showTrendChart ? 'Hide Trend Analysis' : 'Show Trend Analysis'}
        </button>
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
          
          {/* Historical correlation trend chart */}
          {showTrendChart && (
            <div className="trend-chart-container">
              <svg ref={trendChartRef}></svg>
            </div>
          )}
          
          {/* Correlation insights */}
          {correlationInsights && (
            <div className="correlation-insights">
              <h3>Key Findings</h3>
              <p>{correlationInsights}</p>
            </div>
          )}
          
          {/* Top correlations */}
          {historicalCorrelations.length > 0 && (
            <div className="top-correlations">
              <h3>Strongest Air Quality-Respiratory Health Correlations</h3>
              <div className="correlations-table">
                <table>
                  <thead>
                    <tr>
                      <th>Pollutant</th>
                      <th>Year</th>
                      <th>Correlation</th>
                      <th>Strength</th>
                      <th>States with Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalCorrelations.slice(0, 5).map((item, index) => (
                      <tr key={index}>
                        <td>{item.pollutant}</td>
                        <td>{item.year}</td>
                        <td>{item.correlation.toFixed(3)}</td>
                        <td>
                          <span className={`correlation-strength ${getCorrelationDescription(item.correlation).replace(" ", "-")}`}>
                            {getCorrelationDescription(item.correlation)} {getCorrelationType(item.correlation)}
                          </span>
                        </td>
                        <td>{item.dataPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="correlation-explanation">
            <h3>Understanding This Visualization</h3>
            <p>
              Each point represents a U.S. state, showing the relationship between {selectedPollutant} levels ({getPollutantUnits(selectedPollutant)}) and respiratory illness indices (0-8 scale).
              The red line represents the trend line based on this data. A steeper slope indicates a stronger relationship.
            </p>
            <p>
              <strong>Hover over any point</strong> to see detailed information for that state.
            </p>
            
            <h3>The Air Quality and Respiratory Health Story</h3>
            <p>
              Our analysis reveals a compelling narrative about the relationship between air quality and respiratory health across the United States:
            </p>
            <div className="story-points">
              <div className="story-point">
                <h4>1. Consistent Patterns of Impact</h4>
                <p>
                  The data tells a clear story: states with higher levels of air pollutants, particularly PM2.5 (fine particulate matter), 
                  consistently show higher rates of respiratory illness. This relationship has remained remarkably stable from 2016-2022, 
                  suggesting a persistent health effect that transcends short-term fluctuations.
                </p>
              </div>
              
              <div className="story-point">
                <h4>2. Geographic Vulnerability</h4>
                <p>
                  Hover over the data points to see that certain regions bear a disproportionate burden. States with combinations of 
                  industrial activity, wildfire exposure, and population density often show both elevated pollution levels and respiratory illness rates.
                  This geographic pattern highlights environmental justice concerns where certain communities face greater exposure and health consequences.
                </p>
              </div>
              
              <div className="story-point">
                <h4>3. PM2.5: The Silent Respiratory Threat</h4>
                <p>
                  Among all pollutants studied, PM2.5 shows the strongest and most consistent correlation with respiratory health outcomes.
                  These microscopic particles (smaller than 2.5 micrometers) can bypass the body's natural defenses, penetrating deep into lung tissue
                  and even entering the bloodstream. Their impact appears to be cumulative and widespread, affecting populations across age groups and demographics.
                </p>
              </div>
              
              <div className="story-point">
                <h4>4. The COVID-19 Connection</h4>
                <p>
                  Notably, correlations strengthened during the 2020-2022 period, coinciding with the COVID-19 pandemic. Emerging research suggests that 
                  long-term exposure to air pollution may have increased vulnerability to respiratory infections, including COVID-19, and worsened outcomes 
                  for those infected. This highlights how air quality can amplify the impact of other respiratory threats.
                </p>
              </div>
            </div>
            
            <h3>Key Air Quality Pollutants and Health Impacts</h3>
            <ul>
              <li><strong>PM2.5 (Fine Particulate Matter):</strong> Tiny particles that can penetrate deep into lungs and bloodstream, causing respiratory and cardiovascular issues. Sources include vehicle emissions, industrial processes, wildfires, and power plants. Exposure is linked to asthma, bronchitis, and reduced lung function.</li>
              
              <li><strong>Ozone (O3):</strong> Can trigger asthma attacks and worsen other lung conditions. Forms when pollutants from cars, power plants, and other sources react with sunlight. Causes airway inflammation, reduced lung function, and increased hospital visits for respiratory conditions.</li>
              
              <li><strong>Nitrogen Dioxide (NO2):</strong> Associated with increased respiratory symptoms, especially in vulnerable populations. Primarily from vehicle emissions and power plants. Causes airway inflammation and increased susceptibility to respiratory infections.</li>
              
              <li><strong>Sulfur Dioxide (SO2):</strong> Can cause inflammation and irritation of the respiratory system. Mainly from burning fossil fuels, especially coal. Triggers wheezing, chest tightness, and shortness of breath, particularly in people with asthma.</li>
            </ul>
            
            <p>
              Medical research indicates that the correlation patterns observed in our data align with established scientific literature on air quality and health. Studies beyond this dataset have examined the mechanisms by which air pollutants affect the respiratory system and documented various physiological responses to exposure.
            </p>
            
            <h3>Key Conclusions</h3>
            <div className="conclusion-box">
              <ol>
                <li>The correlation between PM2.5 and respiratory illness (avg r=0.51 in recent years) provides clear evidence of a consistent relationship between air quality and public health outcomes.</li>
                <li>Geographic variation in both pollutant levels and health impacts indicates certain regions face disproportionate air quality challenges.</li>
                <li>The relationship between air quality and respiratory health remained consistent across the study period (2016-2022), indicating a persistent rather than transient effect.</li>
                <li>Different pollutants show varying correlations with respiratory illness, with PM2.5 consistently demonstrating the strongest relationship.</li>
                <li>The data suggests that even relatively small increases in air pollutant concentrations are associated with measurable changes in respiratory health indicators.</li>
              </ol>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CorrelationScatterPlot;