import * as fs from "fs";
import * as path from "path";
import { ColorRGB } from "../../interfaces";

export class CacheTools {
  // Method to get cache file path
  static getCacheFilePath(): string {
    return path.join(process.cwd(), "cache.json");
  }

  // Load the last color from file at startup
  static loadLastColor(): ColorRGB | null {
    try {
      const path = this.getCacheFilePath();
      const data = fs.readFileSync(path, "utf8");

      const lastColor = JSON.parse(data);
      console.log(`🔮 Last color loaded: ${JSON.stringify(lastColor)}`);

      return lastColor;
    } catch (err) {
      console.log("🛑 No last color found, using default.");
      return null;
    }
  }

  // Save the last color to file
  static saveLastColor(color: ColorRGB) {
    const path = this.getCacheFilePath();
    fs.writeFileSync(path, JSON.stringify(color));
    console.log(`💾 Last color saved: ${JSON.stringify(color)}`);
  }
}
