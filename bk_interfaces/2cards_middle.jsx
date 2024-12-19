import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const LibraryOccupancy = () => {
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [currentHour, setCurrentHour] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://huggingface.co/datasets/davnas/library-occupancy/raw/main/data.csv'
        );
        const text = await response.text();
        const rows = text.split('\n').slice(1);

        const parsedData = rows
          .filter((row) => row.trim() !== '')
          .map((row) => {
            const [time, occupancy] = row.split(',');
            return {
              time: time.trim(),
              occupancy: parseInt(occupancy.trim(), 10),
            };
          });

        setOccupancyData(parsedData);

        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const formattedHour = `${hour}:00`;
        setCurrentHour(formattedHour);

        const currentData = parsedData.find((entry) => entry.time === formattedHour);
        if (currentData) {
          setCurrentOccupancy(currentData.occupancy);
        }
      } catch (err) {
        setError(`Error loading data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getColorFromOccupancy = (occupancy) => {
    if (occupancy <= 50) {
      return '#22c55e'; // More readable green
    } else if (occupancy <= 80) {
      return '#f97316'; // More readable orange
    } else {
      return '#dc2626'; // More readable red
    }
  };

  const getBarColor = (time) => {
    const timeHour = parseInt(time.split(':')[0], 10);
    const currentTimeHour = parseInt(currentHour.split(':')[0], 10);

    if (time === currentHour) {
      return getColorFromOccupancy(currentOccupancy);
    } else if (timeHour < currentTimeHour) {
      return '#93c5fd'; // Darker blue for past hours
    } else {
      return '#bfdbfe'; // Lighter blue for future hours
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-gray-100 p-4">
      {/* First Chart */}
      <div className="bg-white shadow-lg rounded-lg w-full max-w-[800px] p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-gray-700">Newton</h3>
          <div className="text-lg font-semibold text-gray-500">
            Current occupancy:{' '}
            <span
              className="text-2xl font-bold"
              style={{ color: getColorFromOccupancy(currentOccupancy) }}
            >
              {currentOccupancy}%
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
              <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                {occupancyData.map((entry) => (
                  <Cell
                    key={`cell-${entry.time}`}
                    fill={getBarColor(entry.time)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Chart */}
      <div className="bg-white shadow-lg rounded-lg w-full max-w-[800px] p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-gray-700">Newton (Weekly View)</h3>
          <div className="text-lg font-semibold text-gray-500">
            Average occupancy:{' '}
            <span
              className="text-2xl font-bold"
              style={{ color: getColorFromOccupancy(Math.round(currentOccupancy * 0.9)) }}
            >
              {Math.round(currentOccupancy * 0.9)}%
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
              <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                {occupancyData.map((entry) => (
                  <Cell
                    key={`cell-${entry.time}`}
                    fill={getBarColor(entry.time)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LibraryOccupancy;