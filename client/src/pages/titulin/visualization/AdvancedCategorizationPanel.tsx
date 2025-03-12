import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Tag, 
  Plus, 
  X, 
  Filter, 
  RefreshCcw,
  CheckSquare
} from "lucide-react";

interface TrainingExample {
  id: number;
  title: string;
  is_evergreen: boolean;
  category?: string;
}

interface Category {
  name: string;
  count: number;
  examples: number[];
}

interface AdvancedCategorizationPanelProps {
  examples: TrainingExample[];
  onCategorize: (exampleIds: number[], category: string) => Promise<void>;
  className?: string;
}

export function AdvancedCategorizationPanel({ 
  examples, 
  onCategorize,
  className = "" 
}: AdvancedCategorizationPanelProps) {
  const [newCategory, setNewCategory] = useState("");
  const [selectedExamples, setSelectedExamples] = useState<number[]>([]);
  const [filter, setFilter] = useState("");
  const [isApplyingCategory, setIsApplyingCategory] = useState(false);
  
  // Extraer categorías existentes de los ejemplos
  const categories = examples.reduce<Category[]>((acc, example) => {
    if (!example.category) return acc;
    
    const existingCategory = acc.find(cat => cat.name === example.category);
    if (existingCategory) {
      existingCategory.count++;
      existingCategory.examples.push(example.id);
    } else {
      acc.push({ 
        name: example.category, 
        count: 1,
        examples: [example.id]
      });
    }
    
    return acc;
  }, []);
  
  // Ordenar categorías por cantidad de ejemplos (de mayor a menor)
  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);
  
  // Filtrar ejemplos por término de búsqueda
  const filteredExamples = examples.filter(ex => 
    ex.title.toLowerCase().includes(filter.toLowerCase()) ||
    (ex.category && ex.category.toLowerCase().includes(filter.toLowerCase()))
  );
  
  // Manejar selección de ejemplo
  const toggleExampleSelection = (id: number) => {
    setSelectedExamples(prev => 
      prev.includes(id) 
        ? prev.filter(exId => exId !== id) 
        : [...prev, id]
    );
  };
  
  // Manejar aplicación de categoría a los ejemplos seleccionados
  const applyCategory = async () => {
    if (selectedExamples.length === 0 || !newCategory.trim()) return;
    
    setIsApplyingCategory(true);
    try {
      await onCategorize(selectedExamples, newCategory.trim());
      setSelectedExamples([]);
      setNewCategory("");
    } catch (error) {
      console.error("Error al categorizar ejemplos:", error);
    } finally {
      setIsApplyingCategory(false);
    }
  };
  
  // Seleccionar todos los ejemplos filtrados
  const selectAllFiltered = () => {
    const filteredIds = filteredExamples.map(ex => ex.id);
    setSelectedExamples(filteredIds);
  };
  
  // Deseleccionar todos los ejemplos
  const deselectAll = () => {
    setSelectedExamples([]);
  };
  
  // Aplicar categoría existente a los ejemplos seleccionados
  const applyExistingCategory = async (category: string) => {
    if (selectedExamples.length === 0) return;
    
    setIsApplyingCategory(true);
    try {
      await onCategorize(selectedExamples, category);
      setSelectedExamples([]);
    } catch (error) {
      console.error("Error al categorizar ejemplos:", error);
    } finally {
      setIsApplyingCategory(false);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Tag className="h-5 w-5 mr-1" />
          <span>Categorización avanzada</span>
        </CardTitle>
        <CardDescription>
          Organiza tus ejemplos por categorías temáticas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Panel de categorías existentes */}
        <div className="space-y-2">
          <Label className="text-sm">Categorías existentes</Label>
          <div className="flex flex-wrap gap-2">
            {sortedCategories.length > 0 ? (
              sortedCategories.map(category => (
                <TooltipProvider key={category.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => applyExistingCategory(category.name)}
                      >
                        {category.name} ({category.count})
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clic para aplicar a los seleccionados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No hay categorías definidas</span>
            )}
          </div>
        </div>
        
        {/* Filtro de búsqueda */}
        <div className="space-y-2">
          <Label className="text-sm">Buscar ejemplos</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Filtrar por título o categoría..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => setFilter("")} disabled={!filter}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Ejemplos filtrados y selección */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Ejemplos ({filteredExamples.length})</Label>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={selectAllFiltered}
                disabled={filteredExamples.length === 0}
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                Seleccionar todos
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={deselectAll}
                disabled={selectedExamples.length === 0}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Deseleccionar
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md overflow-y-auto max-h-[200px] p-2 space-y-1">
            {filteredExamples.length > 0 ? (
              filteredExamples.map((example) => (
                <div
                  key={example.id}
                  className="flex items-start gap-2 p-1 rounded hover:bg-muted/50"
                >
                  <Checkbox
                    id={`example-${example.id}`}
                    checked={selectedExamples.includes(example.id)}
                    onCheckedChange={() => toggleExampleSelection(example.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 text-sm">
                    <Label
                      htmlFor={`example-${example.id}`}
                      className="font-normal cursor-pointer"
                    >
                      {example.title}
                    </Label>
                    {example.category && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {example.category}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {filter ? "No hay resultados para esta búsqueda" : "No hay ejemplos disponibles"}
              </div>
            )}
          </div>
        </div>
        
        {/* Nueva categoría */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm">Aplicar nueva categoría</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nueva categoría..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={applyCategory}
              disabled={selectedExamples.length === 0 || !newCategory.trim() || isApplyingCategory}
            >
              {isApplyingCategory ? (
                <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Aplicar
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {selectedExamples.length === 0 ? (
              "Selecciona ejemplos para categorizar"
            ) : (
              `${selectedExamples.length} ejemplo(s) seleccionado(s)`
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}