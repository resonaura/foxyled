import { ColorRGB } from "../../interfaces";
import { Timer } from "../timer";

export class LEDTools {
  static kelvinToRGB(kelvin: number): ColorRGB {
    const temperature = kelvin / 100;
    let r, g, b;

    if (temperature <= 66) {
      r = 255;
      g = Math.max(99.4708025861 * Math.log(temperature) - 161.1195681661, 0);
      b =
        temperature <= 19
          ? 0
          : Math.max(
              138.5177312231 * Math.log(temperature - 10) - 305.0447927307,
              0
            );
    } else {
      r = Math.max(
        329.698727446 * Math.pow(temperature - 60, -0.1332047592),
        0
      );
      g = Math.max(
        288.1221695283 * Math.pow(temperature - 60, -0.0755148492),
        0
      );
      b = 255;
    }

    return { r: this.clamp(r), g: this.clamp(g), b: this.clamp(b) };
  }

  static normalizeColor(color: ColorRGB): ColorRGB {
    return {
      r: this.clamp(color.r),
      g: this.clamp(color.g),
      b: this.clamp(color.b),
    };
  }

  static fillEntireBufferWithOneColor(
    color: ColorRGB,
    numLeds: number
  ): Buffer {
    const stabilizedColor = LEDTools.applyBrightnessToColor(color, 30);
    const colorData: Buffer = Buffer.alloc(numLeds * 3);

    for (let i = 0; i < numLeds; i++) {
      const offset = i * 3;

      colorData[offset] = stabilizedColor.r;
      colorData[offset + 1] = stabilizedColor.g;
      colorData[offset + 2] = stabilizedColor.b;
    }
    return colorData;
  }

  static bufferFromMatrix(colors: ColorRGB[]): Buffer {
    const colorData: Buffer = Buffer.alloc(colors.length * 3);

    colors.forEach((color, index) => {
      const offset = index * 3;
      colorData[offset] = color.r;
      colorData[offset + 1] = color.g;
      colorData[offset + 2] = color.b;
    });

    return colorData;
  }

  static prepareData(data: Buffer): Buffer {
    const header = Buffer.from("Ada\x00\x00\x36", "ascii");
    return Buffer.concat([header, data]);
  }

  static clamp(value: number): number {
    return Math.max(0, Math.min(255, value));
  }

  static async smoothTransitionToColor(
    current: ColorRGB,
    target: ColorRGB,
    onStep: (color: ColorRGB, index: number, remaining: number) => Promise<void>
  ): Promise<ColorRGB> {
    const steps = 20;

    const deltaR = (target.r - current.r) / steps;
    const deltaG = (target.g - current.g) / steps;
    const deltaB = (target.b - current.b) / steps;

    let lastStepColor = {
      r: this.clamp(current.r),
      g: this.clamp(current.g),
      b: this.clamp(current.b),
    };

    for (let i = 0; i < steps; i++) {
      lastStepColor.r = this.clamp(lastStepColor.r + deltaR);
      lastStepColor.g = this.clamp(lastStepColor.g + deltaG);
      lastStepColor.b = this.clamp(lastStepColor.b + deltaB);

      await onStep(lastStepColor, i, steps - (i + 1));

      await Timer.sleep(0.5 / steps);
    }

    return { r: target.r, g: target.g, b: target.b };
  }

  static async smoothTransitionMatrix(
    currents: ColorRGB[],
    targets: ColorRGB[],
    onStep: (
      colors: ColorRGB[],
      index: number,
      remaining: number
    ) => Promise<void>
  ): Promise<ColorRGB[]> {
    const steps = 20;
    const deltas = currents.map((current, index) => ({
      deltaR: (targets[index].r - current.r) / steps,
      deltaG: (targets[index].g - current.g) / steps,
      deltaB: (targets[index].b - current.b) / steps,
    }));

    let lastStepColors = currents.map((current) => ({
      r: this.clamp(current.r),
      g: this.clamp(current.g),
      b: this.clamp(current.b),
    }));

    for (let i = 0; i < steps; i++) {
      lastStepColors = lastStepColors.map((color, index) => ({
        r: this.clamp(color.r + deltas[index].deltaR),
        g: this.clamp(color.g + deltas[index].deltaG),
        b: this.clamp(color.b + deltas[index].deltaB),
      }));

      await onStep(lastStepColors, i, steps - (i + 1));
      await new Promise((resolve) => setTimeout(resolve, 25)); // Delay of 25ms for smoother animation
    }

    return targets.map((target) => ({
      r: target.r,
      g: target.g,
      b: target.b,
    }));
  }

  static matrixFromColor(color: ColorRGB, length: number): ColorRGB[] {
    return Array.from({ length }, () => color);
  }

  static applyBrightnessToColor(color: ColorRGB, brightness: number): ColorRGB {
    const adjustedBrightness = brightness / 100;

    return {
      r: color.r * adjustedBrightness,
      g: color.g * adjustedBrightness,
      b: color.b * adjustedBrightness,
    };
  }
}
