import * as fs from 'fs';
import * as path from 'path';
import { ColorRGB, AppState } from '../../interfaces';

export class CacheTools {
  // Method to get cache file path
  static getCacheFilePath(): string {
    return path.join(process.cwd(), 'cache.json');
  }

  // Load the last color from file at startup
  static loadState(): AppState | null {
    try {
      const path = this.getCacheFilePath();
      const data = fs.readFileSync(path, 'utf8');

      const state = JSON.parse(data);
      console.log(`🔮 Last state loaded`);

      return state;
    } catch (err) {
      return null;
    }
  }

  // Save the last color to file
  static saveState(state: AppState) {
    const path = this.getCacheFilePath();
    fs.writeFileSync(path, JSON.stringify(state));
  }
}
