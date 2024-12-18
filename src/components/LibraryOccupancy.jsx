import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const LibraryOccupancy = () => {
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [currentHour, setCurrentHour] = useState(''); // Current hour in "HH:MM" format

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

        // Get the current hour in "HH:00" format
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0'); // Ensure two digits
        const formattedHour = `${hour}:00`;
        setCurrentHour(formattedHour);

        // Find the occupancy for the current hour
        const currentData = parsedData.find((entry) => entry.time === formattedHour);
        if (currentData) {
          setCurrentOccupancy(currentData.occupancy);
        }

        // Debug logs
        console.log('Occupancy Data:', parsedData);
        console.log('Current Hour:', formattedHour);
        console.log('Current Occupancy:', currentData ? currentData.occupancy : 'N/A');
      } catch (err) {
        setError(`Error loading data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {/* Card Container */}
      <div className="bg-white shadow-lg rounded-lg w-[90%] max-w-[800px] p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-700">Newton</h3>
          <div className="text-xl font-semibold text-gray-500">
            Current occupancy: <span className="text-yellow-500">{currentOccupancy}%</span>
          </div>
        </div>

        {/* Chart Section */}
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Occupancy']}
              />
              <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                {occupancyData.map((entry) => (
                  <Cell
                    key={`cell-${entry.time}`}
                    fill={entry.time === currentHour ? '#ef4444' : '#93c5fd'} // Highlight current time in red
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
