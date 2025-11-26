export interface CountryBase {
  name: {
    common: string;
    official: string;
  };
  cca2: string; // ISO 2-letter code
  cca3: string;
  capital?: string[];
  region: string;
  subregion?: string;
  latlng: [number, number];
  population: number;
  flags: {
    svg: string;
    png: string;
  };
}

export interface TouristAttraction {
  name: string;
  description: string;
}

export interface CulturalInfo {
  greetings: string;
  traditions: string[];
  religion: string;
  festivals: string[];
}

export interface AnthemInfo {
  title: string;
  lyricsSnippet: string;
  audioUrl?: string;
}

export interface BookingInfo {
  topHotels: string[];
  bestTimeVisit: string;
  avgCostPerDayUSD: string;
}

export interface AIEnrichedData {
  summary: string;
  attractions: TouristAttraction[];
  culture: CulturalInfo;
  anthem: AnthemInfo;
  travel: BookingInfo;
}

export interface CountryFull extends CountryBase {
  aiData?: AIEnrichedData;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';