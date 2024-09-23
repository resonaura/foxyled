import { ColorRGB } from '../interfaces';
import { LEDTools } from '../tools/led';
import { Timer } from '../tools/timer';
import { StripIO } from './io';

export class LEDStrip {
  private io: StripIO;
  private numLeds: number;

  private busy: boolean = false;

  private currentState: ColorRGB[];

  async init() {
    await this.io.init();

    this.refresh();

    setInterval(() => {
      if (this.io.isReady() && !this.busy) this.refresh();
    }, 500);
  }

  constructor(port: string, numLeds: number) {
    this.io = new StripIO(port);
    this.numLeds = numLeds;
    this.currentState = LEDTools.matrixFromColor({ r: 0, g: 0, b: 0 }, numLeds);
  }

  private async sendMatrixToIO(matrix: ColorRGB[]): Promise<void> {
    // If the port is not open, don't attempt to write
    if (!this.io.isReady()) {
      return; // Exit and wait for the connection to re-establish
    }

    const colorData = LEDTools.bufferFromMatrix(matrix);
    const data = LEDTools.prepareData(colorData);

    await this.io.write(data);
  }

  async smoothFillWithColor(color: ColorRGB): Promise<void> {
    while (this.busy) {
      await Timer.sleep(0.5);
    }

    this.busy = true;
    const resultState = await LEDTools.smoothTransitionMatrix(
      this.currentState,
      LEDTools.matrixFromColor(color, this.numLeds),
      async (stepState) => {
        this.currentState = stepState;
        this.refresh();
      }
    );

    this.currentState = resultState;
    this.refresh();
    this.busy = false;
  }

  async fillWithMatrix(matrix: ColorRGB[]) {
    this.currentState = matrix;
    this.refresh();
  }

  async refresh() {
    await this.sendMatrixToIO(this.currentState);
  }
}
