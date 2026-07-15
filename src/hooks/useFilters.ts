import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchPlants } from '@/lib/api';

interface FilterContextType {
  plants: string[];
  selectedPlants: string[];
  setSelectedPlants: (plants: string[]) => void;
  loading: boolean;
}

const FilterContext = createContext<FilterContextType>({
  plants: [],
  selectedPlants: [],
  setSelectedPlants: () => {},
  loading: true,
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<string[]>([]);
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlants()
      .then((list) => {
        setPlants(list);
        setSelectedPlants(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return React.createElement(
    FilterContext.Provider,
    { value: { plants, selectedPlants, setSelectedPlants, loading } },
    children
  );
}

export function useFilters() {
  return useContext(FilterContext);
}
