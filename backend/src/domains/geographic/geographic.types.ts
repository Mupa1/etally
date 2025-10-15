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
