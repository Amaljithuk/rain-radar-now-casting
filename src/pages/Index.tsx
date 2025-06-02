
import React, { useState } from 'react';
import { Search, MapPin, Cloud, CloudRain, Sun, Loader2 } from 'lucide-react';
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

  // You'll need to replace this with your actual OpenWeatherMap API key
  const API_KEY = 'your-openweathermap-api-key';

  const getCoordinates = async (city) => {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
    );
    const data = await response.json();
    if (data.length === 0) throw new Error('City not found');
    return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
  };

  const getWeather = async (lat, lon) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
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
      if (err.message === 'City not found') {
        setError('City not found. Please check the spelling and try again.');
      } else {
        setError('Weather data unavailable. Please try again later.');
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
      if (rainfall < 0.5) return { text: `Light rain: ${rainfall} mm/h`, icon: CloudRain, color: 'text-blue-500' };
      if (rainfall < 2) return { text: `Moderate rain: ${rainfall} mm/h`, icon: CloudRain, color: 'text-blue-600' };
      return { text: `Heavy rain: ${rainfall} mm/h`, icon: CloudRain, color: 'text-blue-700' };
    }
    
    if (status === 'Rain') return { text: 'Light rain detected', icon: CloudRain, color: 'text-blue-500' };
    if (status === 'Drizzle') return { text: 'Drizzle detected', icon: CloudRain, color: 'text-blue-400' };
    if (status === 'Clouds') return { text: 'No rain - Cloudy', icon: Cloud, color: 'text-gray-500' };
    return { text: 'No rain detected', icon: Sun, color: 'text-yellow-500' };
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkWeather();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Animated background raindrops */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-8 bg-blue-300 opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              transform: 'rotate(15deg)'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4 font-inter">
            Is It Raining Right Now? 🌧️
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Check real-time rainfall status for any city worldwide with live weather data and radar maps
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Enter city name (e.g., London, New York, Tokyo)"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={checkWeather}
                disabled={isLoading || !cityName.trim()}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Checking the skies...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Check Weather
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Weather Results */}
        {weatherData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Weather Status Card */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-800">
                    {weatherData.city}, {weatherData.country}
                  </span>
                  <span className="text-3xl font-bold text-blue-600">
                    {weatherData.temperature}°C
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const rainfallInfo = getRainfallStatus(weatherData.rainfall, weatherData.status);
                    const IconComponent = rainfallInfo.icon;
                    return (
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-8 h-8 ${rainfallInfo.color}`} />
                        <span className="text-2xl font-bold text-gray-800">
                          {rainfallInfo.text}
                        </span>
                      </div>
                    );
                  })()}
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">Weather</p>
                      <p className="font-semibold text-gray-800 capitalize">
                        {weatherData.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Humidity</p>
                      <p className="font-semibold text-gray-800">
                        {weatherData.humidity}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radar Map Card */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Precipitation Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {radarImageUrl ? (
                  <div className="space-y-4">
                    <img
                      src={radarImageUrl}
                      alt="Precipitation radar map"
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div 
                      className="hidden w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"
                    >
                      <p className="text-gray-500">Radar map unavailable</p>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      Live precipitation radar centered on {weatherData.city}
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">Loading radar map...</p>
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
              className="h-12 px-8 bg-white/80 hover:bg-white border-gray-300 hover:border-gray-400"
            >
              Check Another City
            </Button>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            🔒 Your city input is used only to fetch weather data and is not stored. 
            This app respects your privacy and doesn't track or save any personal information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
