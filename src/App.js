import React from 'react';
/* import RespiratoryChart from './RespiratoryChart/RespiratoryChart'; */
import InfluenzaChart from './InfluenzaChart/InfluenzaChart';
import AirQualityDashboard from './AirQuality/AirQualityDashboard';

function App() {
  return (
    <div className="App">
      <InfluenzaChart />
      <AirQualityDashboard />
    </div>
  );
}

export default App;
