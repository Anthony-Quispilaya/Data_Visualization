import React, { useState } from 'react';
import './App.css';
import RespiratoryChart from './RespiratoryChart/RespiratoryChart';
import InfluenzaChart from './InfluenzaChart/InfluenzaChart';
import AirQualityDashboard from './AirQuality/AirQualityDashboard';
import EnhancedUSMap from './components/USMap/EnhancedUSMap';
import CorrelationScatterPlot from './components/CorrelationScatterPlot/CorrelationScatterPlot';
import { DataProvider } from './DataContext';

function App() {
  const [activeTab, setActiveTab] = useState('all');
  
  return (
    <DataProvider>
      <div className="App">
        <header className="dashboard-header">
          <h1>Health & Environmental Dashboard (2016-2022)</h1>
          <p className="dashboard-subtitle">Exploring the relationship between air quality and respiratory health across the United States</p>
          <div className="dashboard-tabs">
            <button 
              className={activeTab === 'all' ? 'active' : ''} 
              onClick={() => setActiveTab('all')}
            >
              All Charts
            </button>
            <button 
              className={activeTab === 'air' ? 'active' : ''} 
              onClick={() => setActiveTab('air')}
            >
              Air Quality
            </button>
            <button 
              className={activeTab === 'influenza' ? 'active' : ''} 
              onClick={() => setActiveTab('influenza')}
            >
              Influenza Trends
            </button>
            <button 
              className={activeTab === 'respiratory' ? 'active' : ''} 
              onClick={() => setActiveTab('respiratory')}
            >
              Respiratory Illness
            </button>
            <button 
              className={activeTab === 'usmap' ? 'active' : ''} 
              onClick={() => setActiveTab('usmap')}
            >
              US State Map
            </button>
            <button 
              className={activeTab === 'correlation' ? 'active' : ''} 
              onClick={() => setActiveTab('correlation')}
            >
              Correlation Analysis
            </button>
          </div>
        </header>
        
        <div className="dashboard-content">
          {(activeTab === 'all' || activeTab === 'air') && (
            <div className="dashboard-section">
              <div className="section-intro">
                <h2>Air Quality Dashboard</h2>
                <p>
                  This dashboard displays air quality metrics across various U.S. states from 2016 to 2022.
                  It shows trends in pollutants like PM2.5, PM10, Ozone, and others that can impact public health.
                </p>
              </div>
              <AirQualityDashboard />
            </div>
          )}
          
          {(activeTab === 'all' || activeTab === 'influenza') && (
            <div className="dashboard-section">
              <div className="section-intro">
                <h2>Influenza Trends Analysis</h2>
                <p>
                  Track influenza patterns and seasonal fluctuations throughout the United States.
                  This visualization helps identify patterns in flu outbreaks and their correlation with 
                  other health and environmental factors.
                </p>
              </div>
              <InfluenzaChart />
            </div>
          )}
          
          {(activeTab === 'all' || activeTab === 'respiratory') && (
            <div className="dashboard-section">
              <div className="section-intro">
                <h2>Respiratory Illness Patterns</h2>
                <p>
                  This visualization tracks respiratory illness rates across different states from 2016 to 2022. 
                  The data reveals significant variations in illness rates, which may correlate with environmental factors.
                </p>
              </div>
              <RespiratoryChart />
            </div>
          )}
          
          {(activeTab === 'all' || activeTab === 'usmap') && (
            <div className="dashboard-section">
              <div className="section-intro">
                <h2>US State Interactive Map</h2>
                <p>Explore health and environmental metrics by clicking on any state. This interactive visualization allows you to examine detailed data across the entire United States.</p>
              </div>
              <EnhancedUSMap />
            </div>
          )}
          
          {(activeTab === 'all' || activeTab === 'correlation') && (
            <div className="dashboard-section">
              <div className="section-intro">
                <h2>Correlation Between Air Quality and Respiratory Health</h2>
                <p>
                  This analysis explores the essential question: "Is there a correlation between diminished air quality 
                  and respiratory illness rates across U.S. urban areas?" The scatter plot below displays each U.S. state 
                  positioned according to its air quality measurements (x-axis) and respiratory illness rates (y-axis).
                </p>
                <p>
                  You can adjust the year and pollutant type using the controls below to examine how the relationship 
                  between these factors changes over time and across different air quality measures.
                </p>
              </div>
              <CorrelationScatterPlot />
            </div>
          )}
        </div>

        <footer className="dashboard-footer">
          <p>© Anthony Quispilaya 2025</p>
          <p>Data sources: EPA Air Quality System, CDC Respiratory Illness Surveillance</p>
        </footer>
      </div>
    </DataProvider>
  );
}

export default App;
