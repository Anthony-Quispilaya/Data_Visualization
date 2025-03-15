# The Health Impact of Air Pollution in the U.S.

## Presentation
[View the presentation slides (PDF)](./presentation/IT219%20Midterm%20Project.pdf)

## Project Overview
This interactive dashboard visualizes the relationship between air pollution and respiratory health across the United States from 2016-2022. By analyzing data from the EPA Air Quality System and CDC Environmental Public Health Tracking Network, this project reveals geographical patterns and temporal trends in how air quality impacts public health.

## Demo
[View the web application demo](https://youtu.be/2k7Wdi-ugSg)

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

## Technology Stack

### Frontend Framework
- **React** (v19.0.0): Core UI framework
- **React DOM** (v19.0.0): DOM manipulation for React
- **React Scripts** (v5.0.1): Create React App configuration

### Data Visualization Libraries
- **D3.js** (v7.9.0): Advanced data visualization and DOM manipulation
- **Recharts** (v2.15.1): Responsive React charts for dashboard components
- **Google Maps API**: Interactive map visualization

### Data Processing
- **PapaParse** (v5.5.2): CSV parsing and data transformation
- **DataContext API**: Custom React Context system for centralized data management

### Development Tools
- **ESLint**: Code quality and style checking
- **npm/Node.js**: Package management and development server
- **Web Vitals** (v4.2.4): Performance monitoring

## Key UI/UX Elements

### Interactive Controls
- **Time Slider**: Animate data changes from 2016-2022
- **Play/Pause Button**: Control time-series animation
- **Tab Navigation**: Switch between different visualization components
- **Pollutant Selector**: Filter data by specific air quality measure
- **State Selection**: Drill down into specific state data
- **Correlation Controls**: Select variables and years for correlation analysis

### Data Visualization Components
- **Color-Coded US Map**: Geographical data representation with legend
- **Multi-Line Charts**: Time-series visualization of trends
- **Bar Charts**: Comparative state-by-state metrics
- **Scatter Plots**: Statistical correlation visualization
- **Statistical Indicators**: Pearson correlation coefficients
- **Interactive Tooltips**: Detailed data on hover
- **Responsive Design**: Adaptable to different screen sizes

## Data Architecture

### Data Loading & Processing
- CSV files loaded via PapaParse in the DataContext provider
- Data normalization and transformation for visualization
- State code/name mapping and metric categorization
- Time-series data aligned across multiple datasets
- Statistical calculations for correlation analysis

### Data Flow
1. Raw CSV data loaded from public directory
2. Processed in DataContext.js to create standardized dataset
3. Distributed to visualization components via Context API
4. Further processed by individual components for specific visualizations
5. Interactive elements trigger filtered data views

## Visualizations

### 1. Interactive US Map
- Geographic distribution of health impacts and pollution levels
- Time-based comparison with drill-down state data
- Color scale representing severity levels
- State selection with detailed metrics panel

### 2. Air Quality Dashboard
- National trend line chart for all pollutants (2016-2022)
- Bar chart showing top 10 states by selected pollutant
- Pollutant selector for metric comparison

### 3. Influenza Trends
- D3-powered line chart showing weekly influenza rates
- Separate tracking for Influenza A, B, and Total cases
- COVID-19 pandemic period highlight
- Interactive tooltip with precise values

### 4. Respiratory Illness Tracking
- Multi-line chart showing respiratory illness rates for top 10 states
- Interactive legend with state toggles
- Color-coded state comparison

### 5. Correlation Analysis
- Scatter plot with regression line
- Pearson correlation coefficient calculation
- Year and pollutant selection controls
- Historical correlation trend analysis
- Top correlations data table

## Project Structure
```
data-dashboard/
├── public/
│   ├── InfluenzaChart.csv      # Weekly influenza data
│   ├── aq-map-data.csv         # Reformatted air quality data for map
│   ├── data.csv                # State respiratory illness data
│   ├── data3.csv               # Air quality metrics by state
│   ├── favicon.ico             # Site favicon
│   ├── index.html              # Main HTML template
│   ├── logo192.png             # React logo image
│   ├── logo512.png             # React logo image (larger)
│   ├── manifest.json           # Web app manifest
│   └── robots.txt              # Robots crawl instructions
├── src/
│   ├── AirQuality/             # Air quality visualization components
│   │   ├── AirQualityDashboard.css
│   │   └── AirQualityDashboard.jsx  # Line & bar charts for pollutants
│   ├── InfluenzaChart/         # Influenza trend visualization
│   │   ├── InfluenzaChart.css
│   │   └── InfluenzaChart.jsx  # D3 chart for flu trends
│   ├── RespiratoryChart/       # Respiratory illness visualization
│   │   ├── RespiratoryChart.css
│   │   └── RespiratoryChart.jsx # D3 multi-line chart for states
│   ├── components/
│   │   ├── CorrelationScatterPlot/ # Statistical correlation analysis
│   │   │   ├── CorrelationScatterPlot.css
│   │   │   └── CorrelationScatterPlot.jsx # Scatter plot with regression
│   │   └── USMap/              # Interactive US map visualization
│   │       ├── EnhancedUSMap.css
│   │       └── EnhancedUSMap.jsx # Google Maps with data overlay
│   ├── App.css                 # Main application styles
│   ├── App.js                  # Main component with tab navigation
│   ├── App.test.js             # Test file for App component
│   ├── D3TimeSeriesChart.jsx   # Reusable D3 time series component
│   ├── DataContext.js          # Central data management system
│   ├── index.css               # Global styles
│   ├── index.js                # Entry point
│   ├── logo.svg                # React logo
│   ├── reportWebVitals.js      # Performance measurement
│   └── setupTests.js           # Test configuration
├── package-lock.json           # Dependency lock file
├── package.json                # Project configuration and dependencies
├── README.md                   # This file
└── Instructions.md             # Project instructions
```

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

## Key Findings & Insights
- **Statistical Correlation**: Significant correlations observed between air quality pollutant levels (particularly PM2.5 and Ozone) and respiratory illness rates across urban areas
- **Regional Patterns**: Industrial regions show stronger relationship between pollutants and respiratory health issues
- **Seasonal Variation**: Health impacts increase during summer months with elevated ozone levels
- **Long-term Trends**: Overall improvement in air quality from 2016-2022, with corresponding decrease in respiratory illness rates
- **COVID-19 Impact**: Noticeable disruption in data patterns during 2020 pandemic period

## Future Enhancements
- Integration of real-time air quality data from EPA API
- Addition of weather pattern data to analyze climate factors
- Mobile-responsive design optimization
- County-level data granularity
- Predictive modeling based on historical correlation patterns
