export interface ApplicationConfig {
  greeting: string;
}

export const AppConfig: ApplicationConfig = (window as any).env;
