import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

/**
 * Base HTTP Client Service
 * 
 * Provides base functionality for making HTTP requests to other microservices.
 */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Make HTTP GET request
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url, config)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`GET ${url} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Make HTTP POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(url, data, config)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`POST ${url} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Make HTTP PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.put<T>(url, data, config)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`PUT ${url} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete<T>(url, config)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`DELETE ${url} failed: ${error.message}`);
      throw error;
    }
  }
}

