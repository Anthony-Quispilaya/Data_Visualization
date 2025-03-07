# The Health Impact of Air Pollution in the U.S.

### **Project Overview**  
This project investigates how air pollution impacts respiratory health in U.S. cities, focusing on trends over time and geographic differences. Using data from the **EPA Air Quality System (AQS)** and **CDC Environmental Public Health Tracking Network**, this project aims to identify the most affected regions and explore how changes in air quality correlate with respiratory health outcomes.  

---

### **Essential Question**  
**"Is there a correlation between diminished air quality and respiratory illness rates across U.S. urban areas?"**  

---

### **Data Sources**  
- **EPA Air Quality System (AQS)** – [Annual AQI and Pollutant Data (PM2.5, Ozone)](https://www.epa.gov/aqs) (CSV)  
- **CDC Environmental Public Health Tracking Network** – [Respiratory Illness and Hospitalization Rates](https://ephtracking.cdc.gov/DataExplorer/) (JSON)  

---

### **Visualizations Implemented**  
1. **Interactive US Map:**  
   - A geographic visualization showing respiratory health indices and air quality metrics across the United States
   - Time-based animation from 2016-2022
   - Toggle between respiratory and air quality data views
   - Multiple pollutant selections (PM2.5, O3, CO, PM10, SO2, NO2)
   
2. **Air Quality Dashboard:**  
   - National trends of multiple pollutants over time (2016-2022)
   - State-by-state comparison of pollutant levels
   - Interactive charts with detailed tooltips
   
3. **Influenza Rate Visualization:**  
   - Time series visualization of influenza rates across the US
   - Detailed state-level data available on selection

---

### **Setup Instructions**

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Create a `.env` file in the root directory with your Google Maps API key:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```
4. Start the development server:
```
npm start
```

### **Technologies Used**
- React for UI components
- D3.js for custom data visualizations
- Google Maps API for geographic mapping
- Recharts for responsive charting
- Papa Parse for CSV data processing

---

### **Project Structure**
- `/src`: Source code
  - `/components`: Reusable UI components
    - `/USMap`: US Map visualization component
  - `/AirQuality`: Air quality dashboard component
  - `/InfluenzaChart`: Influenza rate visualization
  - `/RespiratoryChart`: Respiratory illness visualization
- `/public`: Static assets and data files

### **Objective**  
The goal of this project is to provide an insightful analysis of air quality and its health impact in the U.S., using interactive visualizations to reveal patterns and trends that might otherwise go unnoticed.  

---