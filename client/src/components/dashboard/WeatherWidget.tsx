
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
    <Card className="bg-gradient-to-br from-background to-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Puerto de Sagunto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold">{weather.temperature}°C</span>
              <span className="text-sm text-muted-foreground capitalize">
                {weather.description}
              </span>
            </div>
            {getWeatherIcon(weather.condition)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>{weather.humidity}% humedad</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-green-500" />
              <span>{weather.windSpeed} km/h</span>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
              <Thermometer className="h-4 w-4" />
              <span>Sensación térmica: {weather.feelsLike}°C</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
