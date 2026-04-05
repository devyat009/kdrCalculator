import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { enviroment } from "../../../enviroments/enviroment";
import { ApiResponse, BaseKdr, KdrData, saveKdrRequestModel } from "../components/models/kdrServiceModel.model";
import { firstValueFrom } from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class KdrService {
  baseUrl = enviroment.apiUrl;
  constructor(
    private readonly http: HttpClient
  ) {
  }

  async checkServiceHealth(): Promise<boolean> {
    return await firstValueFrom(this.http.get<boolean>(`${this.baseUrl}/kdrCalculator/health`));
  }

  async createKdr(item: saveKdrRequestModel): Promise<ApiResponse<void>> {
    return await firstValueFrom(this.http.post<ApiResponse<void>>(`${this.baseUrl}/kdrCalculator/createKdr`, item));
  }

  async updateKdr(id: string, item: saveKdrRequestModel): Promise<ApiResponse<void>> {
    return await firstValueFrom(this.http.put<ApiResponse<void>>(`${this.baseUrl}/kdrCalculator/updateKdr/${id}`, item));
  }

  async getKdr(): Promise<ApiResponse<KdrData[]>> {
    return await firstValueFrom(this.http.get<ApiResponse<KdrData[]>>(`${this.baseUrl}/kdrCalculator/getKdr`));
  }

  async getAll(): Promise<ApiResponse<KdrData[]>> {
    return await firstValueFrom(this.http.get<ApiResponse<KdrData[]>>(`${this.baseUrl}/kdrCalculator/getAllKdr`));
  }

  async saveBaseKdr(baseKills: number, baseDeaths: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.baseUrl}/kdrCalculator/createBase`, { baseKills, baseDeaths }));
  }

  async getBaseKdr(): Promise<ApiResponse<BaseKdr>> {
    return await firstValueFrom(this.http.get<ApiResponse<BaseKdr>>(`${this.baseUrl}/kdrCalculator/getBase`));
  }

  async getBaseAllKdr(): Promise<ApiResponse<BaseKdr[]>> {
    return await firstValueFrom(this.http.get<ApiResponse<BaseKdr[]>>(`${this.baseUrl}/kdrCalculator/getBaseAll`));
  }

}
