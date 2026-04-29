export type SunRequirement = "full" | "partial" | "shade";

export type PlantCategory =
  | "vegetable"
  | "herb"
  | "fruit"
  | "flower"
  | "root";

export type PlantingTiming = {
  startIndoorsWeeksBeforeLastFrost?: number;
  transplantWeeksAfterLastFrost?: number;
  directSowWeeksAfterLastFrost?: number;
  harvestableThroughFirstFrost?: boolean;
};

export type Plant = {
  id: string;
  name: string;
  scientificName?: string;
  category: PlantCategory;
  sun: SunRequirement;
  spacingInches: number;
  daysToMaturity?: number;
  companions: string[];
  antagonists: string[];
  notes?: string;
  timing?: PlantingTiming;
};

export type Bed = {
  id: string;
  name: string;
  widthFt: number;
  lengthFt: number;
  sun: SunRequirement;
  notes?: string;
};

export type Placement = {
  id: string;
  bedId: string;
  plantId: string;
  row: number;
  col: number;
  plantedAt?: string;
  notes?: string;
  photos?: string[];
};

export type Location = {
  lat?: number;
  lon?: number;
  label?: string;
  zip?: string;
  usdaZone?: string;
  lastFrost?: string;
  firstFrost?: string;
};

export type GardenState = {
  gardenName: string;
  location: Location;
  beds: Bed[];
  placements: Placement[];
};
