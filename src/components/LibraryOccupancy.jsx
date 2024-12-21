import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const LibraryOccupancy = () => {
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [currentHour, setCurrentHour] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null); // Track hovered card

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://huggingface.co/datasets/davnas/library-occupancy/raw/main/data.csv"
        );
        const text = await response.text();
        const rows = text.split("\n").slice(1);

        const parsedData = rows
          .filter((row) => row.trim() !== "")
          .map((row) => {
            const [time, occupancy] = row.split(",");
            return {
              time: time.trim(),
              occupancy: parseInt(occupancy.trim(), 10),
            };
          });

        setOccupancyData(parsedData);

        const now = new Date();
        const hour = now.getHours().toString().padStart(2, "0");
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
    if (occupancy <= 50) return "#22c55e";
    if (occupancy <= 80) return "#f97316";
    return "#dc2626";
  };

  const getBarColor = (time) => {
    const timeHour = parseInt(time.split(":")[0], 10);
    const currentTimeHour = parseInt(currentHour.split(":")[0], 10);

    if (time === currentHour) {
      return getColorFromOccupancy(currentOccupancy);
    } else if (timeHour < currentTimeHour) {
      return "#93c5fd"; // Darker blue for past hours
    } else {
      return "#bfdbfe"; // Lighter blue for future hours
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white shadow-lg rounded-lg p-2 border border-gray-200 absolute pointer-events-none"
          style={{
            transform: "translate(10px, 80px)",
            zIndex: 1000,
            minWidth: "160px"
          }}
        >
          <p className="font-semibold text-gray-900 text-sm">Time: {label}</p>
          <p
            className="font-medium text-sm"
            style={{ color: getColorFromOccupancy(payload[0].value) }}
          >
            Occupancy: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  const OccupancyCard = ({ title, occupancy, data, onHover }) => (
    <div
      className="w-[300px] h-[150px] bg-white rounded-lg shadow-lg overflow-visible hover:shadow-xl transition-all duration-300"
      onMouseEnter={onHover}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <div className="p-3 h-full flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-700">{title}</h3>
          <div
            className="text-2xl font-bold"
            style={{ color: getColorFromOccupancy(occupancy) }}
          >
            {occupancy}%
          </div>
        </div>
  
        <div style={{ width: "100%", height: "200px", marginBottom: "-15px", marginLeft: "-10px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 10, right: 25, top: 10, bottom: 5 }}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="occupancy"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.time}`} fill={getBarColor(entry.time)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
  
  
  

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const getImageSrc = () => {
    if (hoveredCard === "first") return "/2.png";
    if (hoveredCard === "second") return "/3.png";
    if (hoveredCard === "third") return "/4.png";
    if (hoveredCard === "fourth") return "/5.png";
    if (hoveredCard === "fifth") return "/6.png";
    if (hoveredCard === "sixth") return "/7.png";
    return "/1.png";
  };

  return (
    <div className="flex flex-row items-start justify-center min-h-screen bg-gray-100 p-4 gap-6">
      {/* Left Section: Cards Grid */}
      <div className="grid grid-cols-2 gap-2 auto-rows-max">
        <OccupancyCard
          title="Newton 1"
          occupancy={currentOccupancy}
          data={occupancyData}
          onHover={() => setHoveredCard("first")}
        />
        <OccupancyCard
          title="Newton 2"
          occupancy={Math.round(currentOccupancy * 0.9)}
          data={occupancyData}
          onHover={() => setHoveredCard("second")}
        />
        <OccupancyCard
          title="Newton 3"
          occupancy={Math.round(currentOccupancy * 0.8)}
          data={occupancyData}
          onHover={() => setHoveredCard("third")}
        />
        <OccupancyCard
          title="Newton 4"
          occupancy={Math.round(currentOccupancy * 0.7)}
          data={occupancyData}
          onHover={() => setHoveredCard("fourth")}
        />
        <OccupancyCard
          title="Newton 5"
          occupancy={Math.round(currentOccupancy * 0.6)}
          data={occupancyData}
          onHover={() => setHoveredCard("fifth")}
        />
        <OccupancyCard
          title="Newton 6"
          occupancy={Math.round(currentOccupancy * 0.5)}
          data={occupancyData}
          onHover={() => setHoveredCard("sixth")}
        />
      </div>

      {/* Right Section: Dynamic Image */}
      <div className="sticky top-4 w-[400px]">
        <img
          src={getImageSrc()}
          alt="Floor plan"
          className="w-full h-auto object-cover rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default LibraryOccupancy;
