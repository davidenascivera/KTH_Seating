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

  const getBarColor = (time) => {
    const timeHour = parseInt(time.split(':')[0], 10);
    const currentTimeHour = parseInt(currentHour.split(':')[0], 10);

    if (time === currentHour) {
      return currentOccupancy > 80 ? '#ef4444' : // red-500
             currentOccupancy > 60 ? '#eab308' : // yellow-500
             '#22c55e'; // green-500
    } else if (timeHour < currentTimeHour) {
      return '#93c5fd'; // blue-400
    } else {
      return '#bfdbfe'; // blue-200
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
      {/* Header with library floor plans */}
      <div className="flex justify-center gap-4 mb-8">
        <div className="w-1/2 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <img 
            src="/api/placeholder/400/200"
            alt="Floor Plan 1"
            className="object-contain"
          />
        </div>
        <div className="w-1/2 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <img 
            src="/api/placeholder/400/200"
            alt="Floor Plan 2"
            className="object-contain"
          />
        </div>
      </div>

      {/* Room cards with occupancy graphs */}
      <div className="space-y-4">
        {['Newton', 'Newton (Weekly View)'].map((roomName, index) => (
          <div key={roomName} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{roomName}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-lg text-gray-600">
                    {index === 0 ? 'Current' : 'Average'} occupancy:
                  </span>
                  <span className={`text-3xl font-bold ${
                    currentOccupancy > 80 ? 'text-red-500' :
                    currentOccupancy > 60 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {index === 0 ? currentOccupancy : Math.round(currentOccupancy * 0.9)}%
                  </span>
                </div>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData}>
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Occupancy']}
                    />
                    <Bar 
                      dataKey="occupancy" 
                      radius={[4, 4, 0, 0]}
                    >
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
        ))}
      </div>
    </div>
  );
};

export default LibraryOccupancy;