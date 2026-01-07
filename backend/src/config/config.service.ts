import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

export class ConfigService {
  private env: { [key: string]: string };

  constructor(envFilePath?: string) {
    const filePath = envFilePath || path.resolve(process.cwd(), '.env');
    if (fs.existsSync(filePath)) {
      this.env = dotenv.parse(fs.readFileSync(filePath));
    } else {
      this.env = {};
    }
  }

  get(key: string, defaultValue?: string): string {
    return process.env[key] ?? this.env[key] ?? defaultValue ?? '';
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key);
    const num = Number(value);
    return Number.isNaN(num) ? (defaultValue ?? 0) : num;
  }
}

// Export a singleton instance for easy use
export const configService = new ConfigService();
