/**
 * Geographic Types
 * Type definitions for geographic data structures
 */

export interface INormalizedCSVRow {
  countyCode: string;
  countyName: string;
  constituencyCode: string;
  constituencyName: string;
  wardCode: string;
  wardName: string;
  regCenterCode: string;
  regCenterName: string;
  pollingStationCode: string;
  pollingStationName: string;
  registeredVoters: number;
}

export interface IBulkUploadChunk {
  data: INormalizedCSVRow[];
  chunkIndex: number;
  totalChunks: number;
}

export interface IBulkUploadSummary {
  countiesAdded: number;
  countiesUpdated: number;
  constituenciesAdded: number;
  constituenciesUpdated: number;
  wardsAdded: number;
  wardsUpdated: number;
  pollingStationsAdded: number;
  pollingStationsUpdated: number;
}

export interface IGeographicFilters {
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
  isActive?: boolean;
}

export interface IStatisticsFilters {
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
  isActive?: boolean;
}

export interface IPollingStationSearchFilters {
  // Filter by hierarchy
  countyId?: string;
  constituencyId?: string;
  wardId?: string;

  // Search by name or code
  search?: string;

  // Filter by status
  isActive?: boolean;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: 'name' | 'code' | 'registeredVoters';
  sortOrder?: 'asc' | 'desc';
}

export interface IHierarchyFilters {
  level: 'county' | 'constituency' | 'ward' | 'polling_station';
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface IHierarchyItem {
  id: string;
  code: string;
  name: string;
  type: 'county' | 'constituency' | 'ward' | 'polling_station';

  // Statistics
  totalConstituencies?: number;
  totalWards?: number;
  totalPollingStations?: number;
  totalRegisteredVoters: number;
  registeredVoters?: number; // For polling stations

  // Parent information
  countyId?: string;
  countyName?: string;
  constituencyId?: string;
  constituencyName?: string;
  wardId?: string;
  wardName?: string;

  // Status
  isActive?: boolean;

  // Location
  latitude?: number | null;
  longitude?: number | null;
}

export interface IVotingAreaStatistics {
  // Summary counts
  totalCounties: number;
  totalConstituencies: number;
  totalWards: number;
  totalPollingStations: number;
  totalRegisteredVoters: number;

  // County-level statistics
  counties: Array<{
    id: string;
    code: string;
    name: string;
    totalConstituencies: number;
    totalWards: number;
    totalPollingStations: number;
    totalRegisteredVoters: number;
  }>;

  // Constituency-level statistics (if countyId is specified)
  constituencies?: Array<{
    id: string;
    code: string;
    name: string;
    countyId: string;
    countyName: string;
    totalWards: number;
    totalPollingStations: number;
    totalRegisteredVoters: number;
  }>;

  // Ward-level statistics (if constituencyId is specified)
  wards?: Array<{
    id: string;
    code: string;
    name: string;
    constituencyId: string;
    constituencyName: string;
    totalPollingStations: number;
    totalRegisteredVoters: number;
  }>;

  // Polling station-level statistics (if wardId is specified)
  pollingStations?: Array<{
    id: string;
    code: string;
    name: string;
    wardId: string;
    wardName: string;
    registeredVoters: number;
  }>;
}
