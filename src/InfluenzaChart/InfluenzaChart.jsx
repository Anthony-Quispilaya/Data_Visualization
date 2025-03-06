import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import './InfluenzaChart.css';

const InfluenzaChart = () => {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    return (
        <div className="influenza-chart" ref={containerRef}>
            <div className="influenza-chart-wrapper">
                <h2 className="chart-title">Influenza Trend (2016-2022)</h2>
                <svg ref={svgRef}></svg>
            </div>
        </div>
    );
};

export default InfluenzaChart;