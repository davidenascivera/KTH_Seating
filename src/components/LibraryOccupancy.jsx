import React, { useState, useEffect, useMemo } from "react";
import { WiDaySunny, WiCloudy, WiRain, WiSnow } from "react-icons/wi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { database, ref, onValue } from './firebase';

// OccupancyCard componente riutilizzabile e responsivo
const OccupancyCard = React.memo(({ 
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
      isMobile ? 'w-full mb-4' : 'w-[300px] h-[150px]'
    }`}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
  >
    <div className={`${isMobile ? 'p-4' : 'p-3'} h-full flex flex-col justify-between`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-700`}>
          {title}
        </h3>
        <div
          className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}
          style={{ color: getColorFromOccupancy(occupancy) }}
        >
          {occupancy}%
        </div>
      </div>

      {/* Wrapper del grafico */}
      <div
        className={isMobile 
          ? 'h-[150px] w-full' 
          : 'w-full h-[200px] -mb-[15px] -ml-[10px]'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={isMobile 
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
              content={({ active, payload, label }) => (
                active && payload && payload.length ? (
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
                ) : null
              )}
            />

            <Bar
              dataKey="occupancy"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {data.map((entry) => (
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
));

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

  // Verifica se lo schermo è di dimensioni mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch dei dati dall'endpoint e da Firebase
  useEffect(() => {
    // Listener su Firebase
    const occupancyRef = ref(database, 'current-occupancy');
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

    // Lettura CSV con i dati di occupancy
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://huggingface.co/datasets/davnas/library-occupancy/raw/main/data_2.csv"
        );
        const text = await response.text();
        const rows = text.split("\n");
        const headers = rows[0].split(",");
        
        const parsedData = rows.slice(1)
          .filter(row => row.trim() !== "")
          .map(row => {
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
        const formattedTime = `${hour}:${minute === 0 ? '00' : '30'}`;
        setCurrentHour(formattedTime);

        const currentData = parsedData.find(entry => entry.time === formattedTime);
        if (currentData) {
          setCurrentOccupancy(currentData.main); // For backward compatibility
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

    // Fetch meteo
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

    return () => unsubscribe();
  }, []);

  // Funzione che restituisce il colore basato sul livello di occupancy
  const getColorFromOccupancy = (occupancy) => {
    if (occupancy <= 50) return "#22c55e";   // verde
    if (occupancy <= 80) return "#f97316";   // arancione
    return "#dc2626";                       // rosso
  };

  // Funzione che decide il colore della barra in base all'ora corrente
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

  // Seleziona l'icona meteo in base al codice condizione
  const getWeatherIcon = (condition) => {
    if (!condition) return <WiDaySunny className="text-yellow-500" />;
    const code = condition.code;

    if (code >= 1000 && code < 1003) return <WiDaySunny className="text-yellow-500" />;
    if (code >= 1003 && code < 1063) return <WiCloudy className="text-gray-500" />;
    if (code >= 1063 && code < 1200) return <WiRain className="text-blue-500" />;
    if (code >= 1200 && code < 1300) return <WiSnow className="text-blue-300" />;
    return <WiDaySunny className="text-yellow-500" />;
  };

  // Memorizziamo i dati del grafico
  const chartData = useMemo(() => occupancyData, [occupancyData]);

  // Determina l'immagine da mostrare al passaggio del mouse (solo desktop)
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

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Funzione per ottenere i dati di un'area specifica
  const getAreaData = (areaKey) => {
    return occupancyData.map(entry => ({
      time: entry.time,
      occupancy: entry[areaKey]
    }));
  };

  // Funzione per rendere le card
  const renderCards = (isMobile) => (
    <div className={isMobile ? "w-full max-w-md space-y-4" : "grid grid-cols-2 gap-2 auto-rows-max"}>
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

  // LAYOUT MOBILE
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
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        {/* Sezione meteo e countdown esami */}
        {weather && (
          <div className="w-full max-w-md mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow-md">
              <div className="text-5xl">
                {getWeatherIcon(weather.condition)}
              </div>
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

        {/* Card occupancy in colonna per mobile */}
        {renderCards(true)}
      </div>
    );
  }

  // LAYOUT DESKTOP
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
                <div className="text-7xl">
                  {getWeatherIcon(weather.condition)}
                </div>
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
    </div>
  );
};

export default React.memo(LibraryOccupancy);
