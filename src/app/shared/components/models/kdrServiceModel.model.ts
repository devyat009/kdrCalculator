export interface saveKdrRequestModel {

}


export interface KdrData {
  timeStamp: string;
  kills: number;
  deaths: number;
  baseKdr: number;
  baseKills: number;
  baseDeaths: number;
  kdrTarget: number;
  expectedMediumKdr: number;
}


export interface RealisticTarget {
  icon: string;
  kills: number;
  deaths: number;
  kdr: string;
}
