# The Health Impact of Air Pollution in the U.S.

## Project Overview
This interactive dashboard visualizes the relationship between air pollution and respiratory health across the United States from 2016-2022. By analyzing data from the EPA Air Quality System and CDC Environmental Public Health Tracking Network, this project reveals geographical patterns and temporal trends in how air quality impacts public health.

## Live Demo
[View the live application](#) <!-- Replace with your deployed URL when available -->

## Essential Question
**"Is there a correlation between diminished air quality and respiratory illness rates across U.S. urban areas?"**

## Features
- **Interactive US Map**: Color-coded visualization of respiratory health and air quality by state with time slider (2016-2022)
- **Air Quality Dashboard**: Detailed monitoring of multiple pollutants with trend analysis
- **Influenza Trends**: Visualization of influenza patterns correlated with environmental factors
- **Respiratory Illness Tracking**: Time-series analysis of respiratory disease prevalence
- **Correlation Analysis**: Statistical examination of relationships between air quality metrics and health outcomes

## Data Sources
- **EPA Air Quality System (AQS)** – [Annual AQI and Pollutant Data (PM2.5, Ozone)](https://www.epa.gov/aqs)
- **CDC Environmental Public Health Tracking Network** – [Respiratory Illness and Hospitalization Rates](https://ephtracking.cdc.gov/DataExplorer/)

## Visualizations
1. **Interactive US Map**:
   - Geographic distribution of health impacts and pollution levels
   - Time-based comparison with drill-down state data

2. **Time-Series Graphs**:
   - Tracking pollution levels and respiratory illness trends over time
   - Seasonality analysis and long-term pattern recognition

3. **Correlation Scatter Plots**:
   - Statistical relationship between air quality metrics and illness rates
   - Regression analysis with confidence intervals

## Technologies Used
- React
- D3.js
- PapaParse (CSV parsing)
- Recharts
- Google Maps API

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd Data_Visualization

# Install dependencies
npm install

# Start the development server
npm start
```
The application will run at http://localhost:3000

## Project Structure
```
src/
├── AirQuality/          # Air quality visualization components
├── InfluenzaChart/      # Influenza trend visualization
├── RespiratoryChart/    # Respiratory illness visualization
├── components/
│   ├── CorrelationScatterPlot/  # Statistical correlation analysis
│   └── USMap/           # Interactive US map visualization
└── DataContext.js       # Central data management
```

## Findings & Insights
The visualizations reveal significant correlations between air quality pollutant levels and respiratory illness rates in urban areas, with particularly strong relationships in industrial regions. Seasonal patterns show increased health impacts during summer months with elevated ozone levels.