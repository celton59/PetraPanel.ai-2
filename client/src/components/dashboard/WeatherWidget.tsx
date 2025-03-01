
import { Cloud, Sun, Moon, CloudRain, Thermometer, Wind, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

type WeatherData = {
  temperature: number;
  condition: "sunny" | "cloudy" | "rainy";
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  description: string;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 22,
    condition: "sunny",
    humidity: 65,
    windSpeed: 0,
    feelsLike: 22,
    description: ""
  });

  useEffect(() => {
    const getWeather = async () => {
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?zip=46520,es&units=metric&appid=8d2de98e089f1c28e1a22fc19a24ef04`
        );
        
        const condition = res.data.weather[0].main.toLowerCase();
        setWeather({
          temperature: Math.round(res.data.main.temp),
          condition: condition.includes("cloud") ? "cloudy" : 
                    condition.includes("rain") ? "rainy" : "sunny",
          humidity: res.data.main.humidity,
          windSpeed: Math.round(res.data.wind.speed * 3.6), // Convert m/s to km/h
          feelsLike: Math.round(res.data.main.feels_like),
          description: translateWeatherCondition(res.data.weather[0].description)
        });
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    getWeather();
    const interval = setInterval(getWeather, 1800000); // Update every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const translateWeatherCondition = (condition: string) => {
    const translations: Record<string, string> = {
      'clear sky': 'cielo despejado',
      'few clouds': 'algunas nubes',
      'scattered clouds': 'nubes dispersas',
      'broken clouds': 'nublado',
      'shower rain': 'lluvia',
      'rain': 'lluvia',
      'light rain': 'lluvia ligera',
      'thunderstorm': 'tormenta',
      'snow': 'nieve',
      'mist': 'neblina',
      'overcast clouds': 'muy nublado'
    };
    return translations[condition] || condition;
  };

  const getWeatherIcon = (condition: string) => {
    const isNight = new Date().getHours() >= 20 || new Date().getHours() <= 6;
    
    switch(condition) {
      case "sunny": return (
        <motion.div
          animate={isNight ? {
            y: [-2, 2, -2],
            scale: [1, 1.1, 1],
            filter: [
              "brightness(1)",
              "brightness(1.2)",
              "brightness(1)"
            ]
          } : {
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: isNight ? 3 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {isNight ? 
            <motion.div style={{ scaleX: -1 }}>
              <Moon className="h-8 w-8 text-slate-300" />
            </motion.div> :
            <Sun className="h-8 w-8 text-yellow-500" />
          }
        </motion.div>
      );
      case "cloudy": return (
        <motion.div
          animate={{
            x: [-5, 5, -5],
            y: [-2, 2, -2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Cloud className="h-8 w-8 text-gray-500" />
        </motion.div>
      );
      case "rainy": return (
        <motion.div
          animate={{
            y: [-2, 2, -2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <CloudRain className="h-8 w-8 text-blue-500" />
        </motion.div>
      );
      default: return (
        <motion.div
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Sun className="h-8 w-8 text-yellow-500" />
        </motion.div>
      );
    }
  };

  return (
    <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Weather-themed gradient accent */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400"></div>
      
      <CardHeader className="border-b border-muted/30 bg-muted/10 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Thermometer className="h-5 w-5 text-primary" />
          Puerto de Sagunto
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex flex-col gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-3xl font-bold tracking-tight">{weather.temperature}°C</span>
              <span className="text-sm text-muted-foreground capitalize">
                {weather.description}
              </span>
            </motion.div>
            
            <div className="bg-primary/5 p-3 rounded-full border border-primary/10 shadow-inner">
              {getWeatherIcon(weather.condition)}
            </div>
          </div>
          
          <motion.div 
            className="mt-2 grid grid-cols-2 gap-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 bg-blue-500/10 p-2 rounded-lg">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{weather.humidity}% humedad</span>
            </div>
            
            <div className="flex items-center gap-2 bg-green-500/10 p-2 rounded-lg">
              <Wind className="h-4 w-4 text-green-500" />
              <span className="font-medium">{weather.windSpeed} km/h</span>
            </div>
            
            <div className="col-span-2 flex items-center justify-center gap-2 bg-amber-500/10 p-2 rounded-lg mt-1">
              <Thermometer className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Sensación térmica: {weather.feelsLike}°C</span>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
