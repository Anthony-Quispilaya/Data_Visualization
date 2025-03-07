import React from 'react';
import RespiratoryChart from './RespiratoryChart/RespiratoryChart';
import InfluenzaChart from './InfluenzaChart/InfluenzaChart';
import AirQualityDashboard from './AirQuality/AirQualityDashboard';
import EnhancedUSMap from './components/USMap/EnhancedUSMap';
import CorrelationScatterPlot from './components/CorrelationScatterPlot/CorrelationScatterPlot';
import { DataProvider } from './DataContext';

function App() {
  return (
    <DataProvider>
      <div className="App">
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Health and Environmental Data Visualization
        </h1>
        <EnhancedUSMap />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '40px' }}>
          <RespiratoryChart />
          <InfluenzaChart />
          <AirQualityDashboard />
          <CorrelationScatterPlot />
        </div>
      </div>
    </DataProvider>
  );
}

export default App;
