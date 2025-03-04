import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';

function TimeSeriesChart({ data }) {
  // Filter for rows that include an event description.
  const majorEvents = data.filter((d) => d.event && d.event.trim() !== '');

  if (data.length === 0) {
    return <p>No data available</p>;
  }

  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="date"
        type="number"
        scale="time"
        domain={['dataMin', 'dataMax']} // Use actual min and max from data
        tickFormatter={(timestamp) =>
          new Date(timestamp).toLocaleDateString()
        }
      />
      <YAxis />
      <Tooltip
        labelFormatter={(timestamp) =>
          new Date(timestamp).toLocaleDateString()
        }
      />
      <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />

      {majorEvents.map((eventData, index) => (
        <ReferenceDot
          key={index}
          x={eventData.date}
          y={eventData.value}
          r={5}
          fill="red"
          stroke="none"
          label={{
            value: eventData.event,
            position: 'top',
            fill: 'red',
            fontSize: 12,
          }}
        />
      ))}
    </LineChart>
  );
}

export default TimeSeriesChart;
