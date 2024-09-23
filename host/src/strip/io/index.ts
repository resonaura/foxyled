import { SerialPort } from 'serialport';
import { Timer } from '../../tools/timer';
import { LEDTools } from '../../tools/led';

export class StripIO {
  private portPath: string;
  private port: SerialPort | null = null;

  private portOpening = false;
  private ready = false;

  constructor(portPath?: string) {
    if (!portPath) {
      throw new Error('Port path it required.');
    }

    this.portPath = portPath;
  }

  private async checkSerialDevice(): Promise<string> {
    try {
      const ports = await SerialPort.list();
      const foundPort = ports.find((p) => p.path === this.portPath);

      if (!foundPort) {
        console.log('🚫 Device not found. Retrying...');
        await Timer.sleep(5); // Wait and retry
        return this.checkSerialDevice(); // Keep looking for the device
      }

      console.log(`🔌 Device found at ${foundPort.path}`);
      return foundPort.path;
    } catch (error) {
      console.log('🛑 Error finding device:', error);
      await Timer.sleep(5); // Wait before retrying in case of error
      return this.checkSerialDevice();
    }
  }

  private async recreatePort() {
    console.log('🔄 Recreating the serial port...');
    if (this.port) {
      this.port.removeAllListeners(); // Ensure all listeners are removed before recreating
      this.port = null;
    }
    await this.init(); // Retry creating the port
  }

  private async openPortIfNeeded(): Promise<void> {
    if (!this.port || (!this.port.isOpen && !this.portOpening)) {
      this.portOpening = true;
      try {
        this.port?.open();
        this.port?.on('open', () => {
          console.log('🔌 Port opened successfully.');
          this.portOpening = false;
          this.ready = true;
        });
      } catch (err: any) {
        console.error('🚫 Failed to open port:', err.message);
        this.portOpening = false;
        this.ready = false;
        await Timer.sleep(5); // Wait before retrying
        return this.openPortIfNeeded(); // Retry opening the port
      }
    }
  }

  async init() {
    // Remove the old port if it exists
    if (this.port) {
      this.port.removeAllListeners();
      this.port = null;
    }

    // Dynamically find the device path
    const devicePath = await this.checkSerialDevice();

    this.port = new SerialPort({
      path: devicePath,
      baudRate: 115200,
      autoOpen: false
    });

    this.port.on('error', (err) => {
      console.error('🛑 Port error:', err.message);
      this.ready = false;
      this.recreatePort(); // Recreate the port on error
    });

    this.port.on('close', () => {
      console.log('🔌 Port closed. Attempting to reconnect...');
      this.ready = false;
      this.recreatePort(); // Recreate the port when closed
    });

    await this.openPortIfNeeded();
  }

  public isReady() {
    return this.ready;
  }

  async write(data: Buffer): Promise<void> {
    if (!this.ready) {
      throw new Error('Port is not ready');
    }

    try {
      this?.port?.write(data, (error) => {
        if (error) {
          console.log('🛑 Error on write:', error.message);
          this.ready = false; // Mark the port as closed on error
          this.recreatePort(); // Recreate port on write error
        }
      });
    } catch (e) {
      console.error('🛑 Error during write:', e);
      this.ready = false; // Mark the port as closed on error
      this.recreatePort(); // Recreate port on write error
    }
  }
}
