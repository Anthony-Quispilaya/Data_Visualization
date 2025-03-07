import React from 'react';
/* import RespiratoryChart from './RespiratoryChart/RespiratoryChart'; */
import InfluenzaChart from './InfluenzaChart/InfluenzaChart';
import AirQualityDashboard from './AirQuality/AirQualityDashboard';
import EnhancedUSMap from './components/USMap/EnhancedUSMap';
import { DataProvider } from './DataContext';

function App() {
  return (
    <DataProvider>
      <div className="App">
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Health and Environmental Data Visualization
        </h1>
        <EnhancedUSMap />
        <InfluenzaChart />
        <AirQualityDashboard />
      </div>
    </DataProvider>
  );
}

export default App;
