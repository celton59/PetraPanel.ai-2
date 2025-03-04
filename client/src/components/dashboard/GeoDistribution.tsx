import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, MapPin, Map } from "lucide-react";
import { motion } from "framer-motion";

// Datos simulados para el mapa
const regionData = [
  { id: "LATAM", name: "América Latina", value: 45, color: "#3B82F6" },
  { id: "NA", name: "Norteamérica", value: 28, color: "#10B981" },
  { id: "EU", name: "Europa", value: 18, color: "#6366F1" },
  { id: "ASIA", name: "Asia", value: 6, color: "#EC4899" },
  { id: "OTHER", name: "Otros", value: 3, color: "#F59E0B" }
];

// Datos simulados por país
const countryData = [
  { id: "MX", name: "México", value: 18, region: "LATAM" },
  { id: "CO", name: "Colombia", value: 12, region: "LATAM" },
  { id: "AR", name: "Argentina", value: 8, region: "LATAM" },
  { id: "BR", name: "Brasil", value: 7, region: "LATAM" },
  { id: "US", name: "Estados Unidos", value: 22, region: "NA" },
  { id: "CA", name: "Canadá", value: 6, region: "NA" },
  { id: "ES", name: "España", value: 8, region: "EU" },
  { id: "UK", name: "Reino Unido", value: 5, region: "EU" },
  { id: "DE", name: "Alemania", value: 3, region: "EU" },
  { id: "FR", name: "Francia", value: 2, region: "EU" },
  { id: "JP", name: "Japón", value: 2, region: "ASIA" },
  { id: "IN", name: "India", value: 2, region: "ASIA" },
  { id: "CN", name: "China", value: 1, region: "ASIA" },
  { id: "AU", name: "Australia", value: 2, region: "OTHER" },
  { id: "ZA", name: "Sudáfrica", value: 1, region: "OTHER" }
];

// Datos simulados por ciudad
const cityData = [
  { name: "Ciudad de México", value: 8, country: "MX" },
  { name: "Bogotá", value: 6, country: "CO" },
  { name: "Buenos Aires", value: 5, country: "AR" },
  { name: "Sao Paulo", value: 4, country: "BR" },
  { name: "Nueva York", value: 7, country: "US" },
  { name: "Los Ángeles", value: 5, country: "US" },
  { name: "Toronto", value: 3, country: "CA" },
  { name: "Madrid", value: 4, country: "ES" },
  { name: "Barcelona", value: 3, country: "ES" },
  { name: "Londres", value: 4, country: "UK" },
  { name: "Berlín", value: 2, country: "DE" },
  { name: "París", value: 1, country: "FR" },
  { name: "Tokio", value: 1, country: "JP" },
  { name: "Mumbai", value: 1, country: "IN" },
  { name: "Sidney", value: 1, country: "AU" }
];

// Datos de lenguaje y plataforma
const languageData = [
  { code: "es", name: "Español", value: 52 },
  { code: "en", name: "Inglés", value: 35 },
  { code: "pt", name: "Portugués", value: 8 },
  { code: "fr", name: "Francés", value: 3 },
  { code: "other", name: "Otros", value: 2 }
];

export function GeoDistribution() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState("region");

  // Función para obtener el color de una región
  const getRegionColor = (regionId: string) => {
    const region = regionData.find(r => r.id === regionId);
    return region ? region.color : "#CBD5E1";
  };

  // Filtra los países por región si hay una selección
  const filteredCountries = selectedRegion 
    ? countryData.filter(country => country.region === selectedRegion)
    : countryData;

  // Ordena los países por valor (mayor a menor)
  const sortedCountries = [...filteredCountries].sort((a, b) => b.value - a.value);

  // Renderiza la vista de regiones
  const renderRegions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regionData.map((region) => (
          <motion.div
            key={region.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
            className={`cursor-pointer p-4 rounded-lg border transition-all 
              ${selectedRegion === region.id 
                ? 'border-2 border-primary shadow-md' 
                : 'border-border hover:border-primary/50'}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }} />
                <span className="font-medium">{region.name}</span>
              </div>
              <Badge 
                variant={selectedRegion === region.id ? "default" : "secondary"}
                className="font-medium"
              >
                {region.value}%
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mapa Visual (Representación simulada) */}
      <div className="mt-6 p-6 border rounded-lg flex flex-col items-center justify-center bg-accent/10">
        <div className="w-full h-[300px] relative flex items-center justify-center">
          <Globe className="w-16 h-16 text-primary/50" strokeWidth={1} />
          <div className="text-center mt-4 text-muted-foreground">
            <p className="text-sm mb-1">Mapa de distribución global</p>
            {selectedRegion ? (
              <p className="font-medium text-foreground">
                {regionData.find(r => r.id === selectedRegion)?.name}: 
                {regionData.find(r => r.id === selectedRegion)?.value}%
              </p>
            ) : (
              <p className="text-xs">Haz clic en una región para ver detalles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Renderiza la vista de países
  const renderCountries = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {regionData.map((region) => (
          <Badge
            key={region.id}
            variant={selectedRegion === region.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
            style={{ borderColor: selectedRegion === region.id ? undefined : region.color }}
          >
            {region.name}
          </Badge>
        ))}
      </div>

      <div className="space-y-2">
        {sortedCountries.slice(0, 10).map((country) => (
          <div 
            key={country.id}
            className="flex items-center p-2 rounded-md hover:bg-accent/20 transition-colors"
          >
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="font-medium flex items-center gap-2">
                  <MapPin size={14} style={{ color: getRegionColor(country.region) }} />
                  {country.name}
                </span>
                <span className="text-sm text-muted-foreground">{country.value}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${country.value}%`, 
                    backgroundColor: getRegionColor(country.region) 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Renderiza la vista de idiomas
  const renderLanguages = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languageData.map((lang) => (
          <div 
            key={lang.code}
            className="p-4 border rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                {lang.code.toUpperCase()}
              </span>
              <span>{lang.name}</span>
            </div>
            <Badge variant="secondary">{lang.value}%</Badge>
          </div>
        ))}
      </div>

      <div className="p-4 border rounded-lg bg-accent/10">
        <div className="mb-4">
          <h4 className="text-sm font-medium">Distribución de Idiomas</h4>
        </div>
        <div className="flex h-6 w-full rounded-full overflow-hidden">
          {languageData.map((lang, index) => (
            <div 
              key={lang.code}
              className="h-full transition-all duration-500"
              style={{ 
                width: `${lang.value}%`, 
                backgroundColor: 
                  index === 0 ? "#3B82F6" : 
                  index === 1 ? "#10B981" : 
                  index === 2 ? "#6366F1" : 
                  index === 3 ? "#EC4899" : "#F59E0B",
              }}
              title={`${lang.name}: ${lang.value}%`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-6 border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Distribución Geográfica
          </h3>
        </div>
      </div>

      <Tabs defaultValue="region" onValueChange={setSelectedView}>
        <TabsList className="mb-6 bg-muted/50">
          <TabsTrigger value="region" className="data-[state=active]:bg-background">
            Regiones
          </TabsTrigger>
          <TabsTrigger value="country" className="data-[state=active]:bg-background">
            Países
          </TabsTrigger>
          <TabsTrigger value="language" className="data-[state=active]:bg-background">
            Idiomas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="region" className="mt-0">
          {renderRegions()}
        </TabsContent>
        
        <TabsContent value="country" className="mt-0">
          {renderCountries()}
        </TabsContent>
        
        <TabsContent value="language" className="mt-0">
          {renderLanguages()}
        </TabsContent>
      </Tabs>
    </Card>
  );
}