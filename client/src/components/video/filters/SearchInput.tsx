import React from 'react';
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const SearchInput = ({ searchTerm, onSearchChange }: SearchInputProps) => {
  return (
    <Input
      placeholder="Buscar videos por título o número de serie"
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full pl-4"
    />
  );
};
