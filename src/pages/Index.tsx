import React, { useState, useEffect } from 'react';
import { Search, MapPin, Cloud, CloudRain, Sun, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [cityName, setCityName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [radarImageUrl, setRadarImageUrl] = useState('');
  const [error, setError] = useState('');

  // OpenWeatherMap API key
  const API_KEY = 'eb6ea4ea5d79cd9be70ba4fb6dab30fb';

  const getCoordinates = async (city) => {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Geocoding API Error:', errorData);
      if (response.status === 401) {
        throw new Error('API key is invalid or expired. Please check your OpenWeatherMap API key.');
      }
      throw new Error(`Geocoding failed: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (data.length === 0) throw new Error('City not found');
    return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
  };

  const getWeather = async (lat, lon) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Weather API Error:', errorData);
      if (response.status === 401) {
        throw new Error('API key is invalid or expired. Please check your OpenWeatherMap API key.');
      }
      throw new Error(`Weather data failed: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return {
      status: data.weather[0].main,
      description: data.weather[0].description,
      rainfall: data.rain ? data.rain['1h'] || 0 : 0,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      icon: data.weather[0].icon
    };
  };

  const getRadarMap = async (lat, lon) => {
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();
      const latestMap = data.radar.past[data.radar.past.length - 1].path;
      return `https://tilecache.rainviewer.com${latestMap}/256/6/${Math.round(lat)}/${Math.round(lon)}/2/1_1.png`;
    } catch (error) {
      console.error('Failed to get radar map:', error);
      return '';
    }
  };

  const checkWeather = async () => {
    if (!cityName.trim()) {
      setError('Please enter a city name');
      return;
    }

    setIsLoading(true);
    setError('');
    setWeatherData(null);
    setRadarImageUrl('');

    try {
      console.log('Fetching coordinates for:', cityName);
      const coordinates = await getCoordinates(cityName);
      console.log('Coordinates found:', coordinates);
      
      const weather = await getWeather(coordinates.lat, coordinates.lon);
      console.log('Weather data:', weather);
      
      const radarUrl = await getRadarMap(coordinates.lat, coordinates.lon);
      console.log('Radar URL:', radarUrl);

      setWeatherData({
        ...weather,
        city: coordinates.name,
        country: coordinates.country,
        lat: coordinates.lat,
        lon: coordinates.lon
      });
      setRadarImageUrl(radarUrl);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      if (err.message.includes('API key')) {
        setError('Invalid API key. Please verify your OpenWeatherMap API key is correct and active.');
      } else if (err.message === 'City not found') {
        setError('City not found. Please check the spelling and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setCityName('');
    setWeatherData(null);
    setRadarImageUrl('');
    setError('');
  };

  const getRainfallStatus = (rainfall, status) => {
    if (rainfall > 0) {
      if (rainfall < 0.5) return { text: `Light rain: ${rainfall} mm/h`, icon: CloudRain, color: 'text-blue-600' };
      if (rainfall < 2) return { text: `Moderate rain: ${rainfall} mm/h`, icon: CloudRain, color: 'text-blue-700' };
      return { text: `Heavy rain: ${rainfall} mm/h`, icon: CloudRain, color: 'text-blue-800' };
    }
    
    if (status === 'Rain') return { text: 'Light rain detected', icon: CloudRain, color: 'text-blue-600' };
    if (status === 'Drizzle') return { text: 'Drizzle detected', icon: CloudRain, color: 'text-blue-500' };
    if (status === 'Clouds') return { text: 'No rain - Cloudy', icon: Cloud, color: 'text-gray-600' };
    return { text: 'No rain detected', icon: Sun, color: 'text-yellow-500' };
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkWeather();
    }
  };

  const getBackgroundGradient = () => {
    if (!weatherData) return 'from-gray-50 via-blue-50 to-blue-100';
    
    if (weatherData.rainfall > 2) return 'from-blue-100 via-blue-200 to-blue-300';
    if (weatherData.rainfall > 0) return 'from-blue-50 via-blue-100 to-blue-200';
    if (weatherData.status === 'Clouds') return 'from-gray-50 via-gray-100 to-blue-100';
    return 'from-white via-blue-50 to-blue-100';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} relative overflow-hidden transition-all duration-1000`}>
      {/* Animated raindrops */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-6 bg-blue-400 opacity-30 animate-pulse raindrop"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              transform: 'rotate(15deg)',
              animation: `raindrop ${2 + Math.random() * 2}s linear infinite`
            }}
          />
        ))}
      </div>

      {/* Floating clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute text-6xl opacity-10 text-gray-400 cloud-float"
            style={{
              top: `${20 + i * 25}%`,
              left: `${-10 + i * 40}%`,
              animationDelay: `${i * 5}s`,
              animation: `cloudFloat 20s linear infinite`
            }}
          >
            ☁️
          </div>
        ))}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        
        @keyframes raindrop {
          0% {
            transform: translateY(-100vh) rotate(15deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(100vh) rotate(15deg);
            opacity: 0;
          }
        }
        
        @keyframes cloudFloat {
          0% {
            transform: translateX(-50px);
          }
          100% {
            transform: translateX(calc(100vw + 50px));
          }
        }
        
        @keyframes candleFlicker {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          25% { opacity: 0.8; transform: scale(1.05) rotate(1deg); }
          50% { opacity: 0.9; transform: scale(0.95) rotate(-1deg); }
          75% { opacity: 0.85; transform: scale(1.02) rotate(0.5deg); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        @keyframes fadeInRadar {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .candle-flicker {
          animation: candleFlicker 0.5s ease-in-out infinite;
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .fade-in-radar {
          animation: fadeInRadar 1s ease-out;
        }
        
        .glass-morphism {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
          transition: transform 0.3s ease;
        }
        
        .card-3d:hover {
          transform: perspective(1000px) rotateX(5deg) rotateY(-5deg) translateZ(20px);
        }
        
        .btn-3d {
          transform-style: preserve-3d;
          transition: all 0.3s ease;
        }
        
        .btn-3d:hover {
          transform: perspective(1000px) rotateX(-10deg) translateZ(10px) scale(1.05);
          box-shadow: 0 20px 40px rgba(45, 212, 191, 0.3);
        }
        
        .btn-3d:active {
          transform: perspective(1000px) rotateX(-5deg) translateZ(5px) scale(1.02);
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3 {
          font-family: 'Roboto', sans-serif;
        }
      `}</style>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-blue-800 mb-4 tracking-tight drop-shadow-lg">
            Is It Raining Right Now? 🌧️
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Check real-time rainfall status for any city worldwide with live weather data and radar maps
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 shadow-2xl border-0 glass-morphism card-3d">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-500 w-6 h-6" />
                <Input
                  type="text"
                  placeholder="Enter city name (e.g., London, New York, Tokyo)"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-14 text-lg border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl glass-morphism"
                  disabled={isLoading}
                  aria-label="Enter city name to check rainfall"
                />
              </div>
              <Button
                onClick={checkWeather}
                disabled={isLoading || !cityName.trim()}
                className="h-14 px-8 bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg rounded-xl btn-3d transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 candle-flicker" />
                    Checking the skies...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6 mr-3" />
                    Check Weather
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="mb-8 border-2 border-red-300 bg-red-50 glass-morphism shake">
            <AlertDescription className="text-red-700 font-semibold text-lg">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Weather Results */}
        {weatherData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Weather Status Card */}
            <Card className="shadow-2xl border-2 border-teal-200 glass-morphism card-3d">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-blue-800">
                  <span className="text-2xl font-bold">
                    {weatherData.city}, {weatherData.country}
                  </span>
                  <span className="text-4xl font-bold text-teal-600">
                    {weatherData.temperature}°C
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(() => {
                    const rainfallInfo = getRainfallStatus(weatherData.rainfall, weatherData.status);
                    const IconComponent = rainfallInfo.icon;
                    return (
                      <div className="flex items-center space-x-4">
                        <IconComponent className={`w-12 h-12 ${rainfallInfo.color} animate-pulse`} />
                        <span className="text-2xl font-bold text-blue-800">
                          {rainfallInfo.text}
                        </span>
                      </div>
                    );
                  })()}
                  
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-teal-100">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-medium">Weather</p>
                      <p className="font-bold text-gray-800 capitalize text-lg">
                        {weatherData.description}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-medium">Humidity</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {weatherData.humidity}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radar Map Card */}
            <Card className="shadow-2xl border-2 border-teal-200 glass-morphism card-3d">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-800">
                  Precipitation Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {radarImageUrl ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl border-2 border-teal-200 hover:scale-105 transition-transform duration-300">
                      <img
                        src={radarImageUrl}
                        alt="Precipitation radar map"
                        className="w-full h-64 object-cover fade-in-radar"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const nextElement = target.nextSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'block';
                          }
                        }}
                      />
                      <div 
                        className="hidden w-full h-64 bg-gray-100 rounded-xl border-2 border-teal-200 flex items-center justify-center"
                      >
                        <p className="text-gray-500 font-medium">Radar map unavailable</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center font-medium">
                      Live precipitation radar centered on {weatherData.city}
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-xl border-2 border-teal-200 flex items-center justify-center">
                    <p className="text-gray-500 font-medium">Loading radar map...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reset Button */}
        {weatherData && (
          <div className="text-center">
            <Button
              onClick={resetSearch}
              variant="outline"
              className="h-14 px-8 bg-teal-50 hover:bg-teal-100 border-2 border-teal-300 hover:border-teal-400 text-teal-700 font-bold text-lg rounded-xl btn-3d transition-all duration-300"
            >
              <RotateCcw className="w-6 h-6 mr-3" />
              Check Another City
            </Button>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-600 max-w-2xl mx-auto font-medium glass-morphism p-4 rounded-xl border border-gray-200" title="Your privacy is protected - no data is stored or tracked">
            🔒 Your city input is used only to fetch weather data and is not stored. 
            This app respects your privacy and doesn't track or save any personal information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
