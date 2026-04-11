export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface saveKdrRequestModel {
  kills: number;
  deaths: number;
  killDeathRatioTarget: number;
  killDeathRatioMediumTarget: number;
}


export interface KdrData {
  timeStamp: string;
  kills: number;
  deaths: number;
  killDeathRatioTarget: number;
  killDeathRatioMediumTarget: number;
  // Calculated fields NOT MAPPED TO API, used for frontend display
  kdr?: number;
  deltaKdr?: number;
}


export interface RealisticTarget {
  icon: string;
  kills: number;
  deaths: number;
  kdr: string;
}

export interface BaseKdr {
  idBaseKdr: string;
  baseKills: number;
  baseDeaths: number;
  createDate: string;
}
