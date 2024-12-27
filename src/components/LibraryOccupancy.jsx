// File: LibraryOccupancy.jsx

import React, { useState, useEffect } from "react";
import { WiDaySunny, WiCloudy, WiRain, WiSnow } from "react-icons/wi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

/**
 * If you're using Firebase (as your code suggests), make sure you have
 * a proper firebase.js that exports { database, ref, onValue } 
 * or comment out the Firebase parts if not needed.
 */
import { database, ref, onValue } from "./firebase";

// ─────────────────────────────────────────────────────────────────────────────
// 1) OccupancyCard 
// ─────────────────────────────────────────────────────────────────────────────
const OccupancyCard = React.memo(
  ({
    title,
    occupancy,
    data,
    onHover,
    onLeave,
    getBarColor,
    getColorFromOccupancy,
    isMobile
  }) => (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-visible hover:shadow-xl transition-all duration-300 ${
        isMobile ? "w-full mb-4" : "w-[300px] h-[150px]"
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className={`${isMobile ? "p-4" : "p-3"} h-full flex flex-col justify-between`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-gray-700`}>
            {title}
          </h3>
          <div
            className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}
            style={{ color: getColorFromOccupancy(occupancy) }}
          >
            {occupancy}%
          </div>
        </div>

        {/* Wrapper del grafico */}
        <div
          className={
            isMobile
              ? "h-[150px] w-full"
              : "w-full h-[200px] -mb-[15px] -ml-[10px]"
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={
                isMobile
                  ? { left: 0, right: 10, top: 10, bottom: 5 }
                  : { left: 10, right: 25, top: 10, bottom: 5 }
              }
            >
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
                width={isMobile ? 30 : 35}
              />
              {/* Tooltip con box overlay personalizzato */}
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload && payload.length ? (
                    <div
                      className="bg-white shadow-lg rounded-lg p-2 border border-gray-200 absolute pointer-events-none"
                      style={{
                        transform: "translate(10px, 80px)",
                        zIndex: 1000,
                        minWidth: "160px"
                      }}
                    >
                      <p className="font-semibold text-gray-900 text-sm">
                        Time: {label}
                      </p>
                      <p
                        className="font-medium text-sm"
                        style={{ color: getColorFromOccupancy(payload[0].value) }}
                      >
                        Occupancy: {payload[0].value}%
                      </p>
                    </div>
                  ) : null
                }
              />
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
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// 2) OccupancyComparison (updated to show Real vs Predicted from new CSV)
// ─────────────────────────────────────────────────────────────────────────────
const OccupancyComparison = () => {
  // Set 'main' to true to make it the default visible graph
  const [visibleLines, setVisibleLines] = useState({
    main: true,
    southEast: false,
    north: false,
    south: false,
    angdomen: false,
    newton: false
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [parsedData, setParsedData] = useState([]);

  // Colors for each area (real vs predicted).
  // If you want different colors for "real" and "predicted," define them separately here.
  const colors = {
    // MAIN
    Occupancy_main_real: "#8884d8",
    Occupancy_main_predicted: "#8884d8", // dashed
    // SOUTH-EAST
    Occupancy_southEast_real: "#82ca9d",
    Occupancy_southEast_predicted: "#82ca9d", // dashed
    // NORTH
    Occupancy_north_real: "#ffc658",
    Occupancy_north_predicted: "#ffc658",
    // SOUTH
    Occupancy_south_real: "#ff7300",
    Occupancy_south_predicted: "#ff7300",
    // ÅNGDOMEN
    Occupancy_angdomen_real: "#e91e63",
    Occupancy_angdomen_predicted: "#e91e63",
    // NEWTON
    Occupancy_newton_real: "#00bcd4",
    Occupancy_newton_predicted: "#00bcd4"
  };

  // Button label => which set of lines to toggle
  const labelMap = [
    { key: "main", label: "Main" },
    { key: "southEast", label: "SouthEast" },
    { key: "north", label: "North" },
    { key: "south", label: "South" },
    { key: "angdomen", label: "Angdomen" },
    { key: "newton", label: "Newton" }
  ];

  // Fetch the Real-vs-Predicted CSV from Hugging Face
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://huggingface.co/datasets/davnas/library-occupancy/resolve/main/Real_vs_Predicted_Occupancy_Data.csv"
        );
        const csvText = await response.text();
        const rows = csvText.split("\n").filter((r) => r.trim() !== "");

        // The first row is the header
        const header = rows[0].split(",");

        // Then parse the rest
        const data = rows.slice(1).map((row) => {
          const cols = row.split(",");
          const obj = {};
          header.forEach((colName, idx) => {
            // Try converting to number if possible
            obj[colName.trim()] = isNaN(cols[idx]) ? cols[idx] : Number(cols[idx]);
          });
          return obj;
        });

        setParsedData(data);
      } catch (error) {
        console.error("Error fetching Real-vs-Predicted CSV:", error);
      }
    };
    fetchData();
  }, []);

  // A single toggle that flips both real & predicted lines for an area
  const toggleLine = (areaKey) => {
    setVisibleLines((prev) => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === areaKey ? !prev[key] : false;
        return acc;
      }, {});
      return newState;
    });
  };

  return (
    <div className="mt-8 w-full max-w-4xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white rounded-lg shadow-md p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Occupancy Comparison</h2>
        </div>
        <svg
          className={`w-6 h-6 transform transition-transform ${
            isExpanded ? "rotate-180" : ""
          } text-gray-600`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden mt-2 ${
          isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="mb-4 text-gray-700">
            <p className="mb-2">
              This is the prediction made yesterday versus the real occupancy we had yesterday.
            </p>
            <div className="flex gap-4 text-sm">
              <span className="font-semibold">
                RME: <span className="text-blue-600">4.3%</span>
              </span>
              <span className="font-semibold">
                MAPE: <span className="text-blue-600">6.8%</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Toggle Buttons (to hide/show real & predicted lines per area) */}
            <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-32">
              {labelMap.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleLine(key)}
                  className={`px-2 py-1 text-sm rounded-lg text-white transition-opacity flex-1 md:flex-none ${
                    visibleLines[key] ? "opacity-100" : "opacity-40"
                  }`}
                  style={{
                    // We'll just pick the real color for the button.
                    backgroundColor: colors[`Occupancy_${key}_real`] || "#8884d8"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Chart Container */}
            <div className="flex-1 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={parsedData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="Time"
                    height={60}
                    tick={{
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 12
                    }}
                  />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "20px" }} />

                  {/* MAIN */}
                  {visibleLines.main && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Occupancy_main_real"
                        name="Main (Real)"
                        stroke={colors["Occupancy_main_real"]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Occupancy_main_predicted"
                        name="Main (Predicted)"
                        stroke={colors["Occupancy_main_predicted"]}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </>
                  )}

                  {/* SOUTH-EAST */}
                  {visibleLines.southEast && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Occupancy_southEast_real"
                        name="SouthEast (Real)"
                        stroke={colors["Occupancy_southEast_real"]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Occupancy_southEast_predicted"
                        name="SouthEast (Predicted)"
                        stroke={colors["Occupancy_southEast_predicted"]}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </>
                  )}

                  {/* NORTH */}
                  {visibleLines.north && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Occupancy_north_real"
                        name="North (Real)"
                        stroke={colors["Occupancy_north_real"]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Occupancy_north_predicted"
                        name="North (Predicted)"
                        stroke={colors["Occupancy_north_predicted"]}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </>
                  )}

                  {/* SOUTH */}
                  {visibleLines.south && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Occupancy_south_real"
                        name="South (Real)"
                        stroke={colors["Occupancy_south_real"]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Occupancy_south_predicted"
                        name="South (Predicted)"
                        stroke={colors["Occupancy_south_predicted"]}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </>
                  )}

                  {/* ÅNGDOMEN */}
                  {visibleLines.angdomen && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Occupancy_angdomen_real"
                        name="Ångdomen (Real)"
                        stroke={colors["Occupancy_angdomen_real"]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Occupancy_angdomen_predicted"
                        name="Ångdomen (Predicted)"
                        stroke={colors["Occupancy_angdomen_predicted"]}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </>
                  )}

                  {/* NEWTON */}
                  {visibleLines.newton && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Occupancy_newton_real"
                        name="Newton (Real)"
                        stroke={colors["Occupancy_newton_real"]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Occupancy_newton_predicted"
                        name="Newton (Predicted)"
                        stroke={colors["Occupancy_newton_predicted"]}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3) Main LibraryOccupancy component
// ─────────────────────────────────────────────────────────────────────────────
const LibraryOccupancy = () => {
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [currentHour, setCurrentHour] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [weather, setWeather] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [realTimeOccupancy, setRealTimeOccupancy] = useState({
    main: 0,
    southEast: 0,
    north: 0,
    south: 0,
    angdomen: 0,
    newton: 0
  });

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkMobile);
      }
    };
  }, []);

  // Fetch data (Firebase + CSV) + Weather
  useEffect(() => {
    // Listener su Firebase
    const occupancyRef = ref(database, "current-occupancy");
    const unsubscribe = onValue(occupancyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRealTimeOccupancy({
          main: data.main || 0,
          southEast: data.southEast || 0,
          north: data.north || 0,
          south: data.south || 0,
          angdomen: data.angdomen || 0,
          newton: data.newton || 0
        });
      }
    });

    // Fetch CSV data
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://huggingface.co/datasets/davnas/library-occupancy/raw/main/data_2.csv"
        );
        const text = await response.text();
        const rows = text.split("\n");

        const parsedData = rows
          .slice(1)
          .filter((row) => row.trim() !== "")
          .map((row) => {
            const values = row.split(",");
            return {
              time: values[0].trim(),
              main: parseInt(values[1], 10),
              southEast: parseInt(values[2], 10),
              north: parseInt(values[3], 10),
              south: parseInt(values[4], 10),
              angdomen: parseInt(values[5], 10),
              newton: parseInt(values[6], 10)
            };
          });

        setOccupancyData(parsedData);

        // Update current occupancy for all areas
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, "0");
        const minute = Math.floor(now.getMinutes() / 30) * 30;
        const formattedTime = `${hour}:${minute === 0 ? "00" : "30"}`;
        setCurrentHour(formattedTime);

        const currentData = parsedData.find((entry) => entry.time === formattedTime);
        if (currentData) {
          setCurrentOccupancy(currentData.main); 
          setRealTimeOccupancy({
            main: currentData.main,
            southEast: currentData.southEast,
            north: currentData.north,
            south: currentData.south,
            angdomen: currentData.angdomen,
            newton: currentData.newton
          });
        }
      } catch (err) {
        setError(`Error loading data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Fetch weather data
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.weatherapi.com/v1/current.json?key=9bb3873cd7fc42c8ac1190047241211&q=Stockholm&aqi=no"
        );
        const data = await response.json();
        setWeather(data.current);
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    fetchData();
    fetchWeather();

    // Cleanup for the Firebase onValue
    return () => unsubscribe();
  }, []);

  // Returns a color based on occupancy
  const getColorFromOccupancy = (occupancy) => {
    if (occupancy <= 50) return "#22c55e"; // verde
    if (occupancy <= 80) return "#f97316"; // arancione
    return "#dc2626"; // rosso
  };

  // Bar color based on time vs current time
  const getBarColor = (time) => {
    const timeHour = parseInt(time.split(":")[0], 10);
    const currentTimeHour = parseInt(currentHour.split(":")[0], 10);

    if (time === currentHour) {
      return getColorFromOccupancy(currentOccupancy);
    } else if (timeHour < currentTimeHour) {
      // ore passate (azzurro)
      return "#93c5fd";
    } else {
      // ore future (blu più chiaro)
      return "#bfdbfe";
    }
  };

  // Weather icon helper
  const getWeatherIcon = (condition) => {
    if (!condition) return <WiDaySunny className="text-yellow-500" />;
    const code = condition.code;

    if (code >= 1000 && code < 1003) return <WiDaySunny className="text-yellow-500" />;
    if (code >= 1003 && code < 1063) return <WiCloudy className="text-gray-500" />;
    if (code >= 1063 && code < 1200) return <WiRain className="text-blue-500" />;
    if (code >= 1200 && code < 1300) return <WiSnow className="text-blue-300" />;
    return <WiDaySunny className="text-yellow-500" />;
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Returns the occupancy data for a specific area
  const getAreaData = (areaKey) => {
    return occupancyData.map((entry) => ({
      time: entry.time,
      occupancy: entry[areaKey]
    }));
  };

  // Renders the 6 occupancy cards
  const renderCards = (isMobile) => (
    <div
      className={
        isMobile
          ? "w-full max-w-md space-y-4"
          : "grid grid-cols-2 gap-2 auto-rows-max"
      }
    >
      {[
        { title: "KTH LIBRARY", key: "main", id: "first" },
        { title: "South-East Gallery", key: "southEast", id: "second" },
        { title: "North Gallery", key: "north", id: "third" },
        { title: "South Gallery", key: "south", id: "fourth" },
        { title: "Ångdomen", key: "angdomen", id: "fifth" },
        { title: "Newton", key: "newton", id: "sixth" }
      ].map(({ title, key, id }) => (
        <OccupancyCard
          key={id}
          title={title}
          occupancy={realTimeOccupancy[key]}
          data={getAreaData(key)}
          onHover={() => !isMobile && setHoveredCard(id)}
          onLeave={() => !isMobile && setHoveredCard(null)}
          getBarColor={getBarColor}
          getColorFromOccupancy={getColorFromOccupancy}
          isMobile={isMobile}
        />
      ))}
    </div>
  );

  // Floor plan image logic (desktop hover)
  const getImageSrc = () => {
    if (!isMobile) {
      if (hoveredCard === "first") return "/2.png";
      if (hoveredCard === "second") return "/3.png";
      if (hoveredCard === "third") return "/4.png";
      if (hoveredCard === "fourth") return "/5.png";
      if (hoveredCard === "fifth") return "/6.png";
      if (hoveredCard === "sixth") return "/7.png";
    }
    return "/1.png";
  };

  // ───────────────────────────────────────────────────────────────────────────
  // LAYOUT (MOBILE vs. DESKTOP)
  // ───────────────────────────────────────────────────────────────────────────

  // MOBILE
  if (isMobile) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          KTH Library Seat Prediction
        </h1>
        <p className="text-center text-gray-600 mb-4 px-4">
          This project is a serverless application to predict the seating at the KTH library.
        </p>

        {/* Immagine del piano */}
        <div className="w-full max-w-md mb-6">
          <img
            src={getImageSrc()}
            alt="Floor plan"
            className="w-full h-auto rounded-lg"
          />
        </div>

        {/* Sezione meteo e countdown esami */}
        {weather && (
          <div className="w-full max-w-md mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow-md">
              <div className="text-5xl">{getWeatherIcon(weather.condition)}</div>
              <div className="text-gray-800">
                <p className="text-xl font-semibold">{weather.temp_c}°C</p>
                <p className="text-sm">{weather.condition?.text}</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-md text-center">
              <p className="text-lg font-bold text-gray-800">
                Days until exams: <span className="text-blue-600">10</span>
              </p>
            </div>
          </div>
        )}

        {/* Cards in colonna per mobile */}
        {renderCards(true)}

        {/* OccupancyComparison shown in mobile as well */}
        <OccupancyComparison />
      </div>
    );
  }

  // DESKTOP
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        KTH Library Seat Prediction
      </h1>
      <p className="text-center text-gray-600 mb-4">
        This project is a serverless application to predict the seating at the KTH library.
      </p>

      <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-[1200px]">
        <div className="flex flex-row items-center justify-center gap-6">
          {/* Griglia con 6 card */}
          {renderCards(false)}

          {/* Sezione immagine, meteo e countdown esami */}
          <div className="flex flex-col items-center w-[500px]">
            <img
              src={getImageSrc()}
              alt="Floor plan"
              className="w-full h-auto object-cover rounded-lg"
            />
            {weather && (
              <div className="flex items-center gap-4 mt-4 p-4 bg-white/50 backdrop-blur-sm rounded-lg">
                <div className="text-7xl">{getWeatherIcon(weather.condition)}</div>
                <div className="text-gray-800">
                  <p className="text-2xl font-semibold">{weather.temp_c}°C</p>
                  <p className="text-sm">{weather.condition?.text}</p>
                </div>
              </div>
            )}
            <div className="mt-0 p-0 bg-white/50 backdrop-blur-sm rounded-lg w-full text-center">
              <p className="text-xl font-bold text-gray-800">
                Days until exams: <span className="text-blue-600">10</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OccupancyComparison below the main cards */}
      <OccupancyComparison />
    </div>
  );
};

export default React.memo(LibraryOccupancy);
