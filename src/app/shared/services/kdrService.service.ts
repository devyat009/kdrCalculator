import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { enviroment } from "../../../enviroments/enviroment";
import { KdrData, saveKdrRequestModel } from "../components/models/kdrServiceModel.model";
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

  async save(item: saveKdrRequestModel): Promise<void> {
    await firstValueFrom(this.http.post(`${this.baseUrl}/kdrCalculator/createKdr`, item));
  }

  async get(): Promise<KdrData[]> {
    return await firstValueFrom(this.http.get<KdrData[]>(`${this.baseUrl}/kdrCalculator`));
  }

}
