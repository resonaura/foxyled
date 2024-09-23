import { SinricPro, startSinricPro } from 'sinricpro';
import { LEDTools } from './tools/led';
import { AppState, ColorRGB } from './interfaces';
import * as dotenv from 'dotenv';
import { LEDStrip } from './strip';
import { CacheTools } from './tools/cache';
import WebSocket, { WebSocketServer } from 'ws';
import ping from 'ping';

dotenv.config();

const port = process.env.SERIAL_PORT;
const numLeds = process.env.LED_COUNT;
const wsPort = +(process.env.REMOTE_PORT ?? 3131); // Define the WebSocket port

if (!port || !numLeds) {
  console.log('🛑 Config file is missing (dotenv)');
  process.exit();
}

const strip = new LEDStrip(
  process.env.SERIAL_PORT ?? '',
  Number(process.env.LED_COUNT ?? 54)
);
const wss = new WebSocketServer({ port: wsPort });

let state = CacheTools.loadState() ?? {
  color: {
    r: 255,
    g: 255,
    b: 255
  },
  brightness: 100,
  on: true
};

const setState = (newState: AppState) => {
  state = newState;

  CacheTools.saveState(newState);
};

let connectedClient: WebSocket | null = null;
let externalMode = false;

wss.on('listening', () => {
  console.log(`📡 WebSocket server is running on ws://localhost:${wsPort}`);
});

// WebSocket connections
wss.on('connection', function connection(ws) {
  if (connectedClient === null) {
    connectedClient = ws;
    externalMode = true; // Set external mode true on connection
    console.log('✅ WebSocket client connected, external mode enabled.');

    ws.on('message', function incoming(message) {
      const data = JSON.parse(message.toString());
      console.log('📥 External color update received:', data);
      //updateLEDColor(data);
    });

    ws.on('close', function close() {
      connectedClient = null;
      externalMode = false; // Set external mode false on disconnect
      console.log('❌ WebSocket client disconnected, external mode disabled.');
    });
  } else {
    console.log(
      '🚫 Another WebSocket client tried to connect. Connection refused.'
    );
    ws.close(); // Close any additional connections
  }
});

// Sinric Pro handlers
const setPowerState = async (_deviceid: string, data: any) => {
  console.log('💡 Power state: ', data);
  if (data === 'Off') {
    setState({ ...state, on: false });
    await strip.smoothFillWithColor({ r: 0, g: 0, b: 0 });
  } else if (data === 'On') {
    setState({ ...state, on: true });
    await strip.smoothFillWithColor(
      LEDTools.applyBrightnessToColor(state.color, state.brightness)
    );
  }
  return true;
};

const setColor = async (_deviceid: string, data: any) => {
  const newColor = { r: data.r, g: data.g, b: data.b };

  if (JSON.stringify(newColor) === JSON.stringify({ r: -1, g: -1, b: -1 })) {
    return;
  }

  console.log('🎨 Color data received: ', newColor);

  if (JSON.stringify(newColor) !== JSON.stringify(state.color)) {
    if (state.on) {
      await strip.smoothFillWithColor(newColor);
    }

    setState({ ...state, color: newColor });
  }

  return true;
};

const setBrightness = async (_deviceid: string, newBrightness: any) => {
  console.log('🔆 Brightness: ', `${newBrightness}%`);

  setState({ ...state, brightness: newBrightness });

  if (state.on) {
    await strip.smoothFillWithColor(
      LEDTools.applyBrightnessToColor(state.color, newBrightness)
    );
  }

  return true;
};

const setColorTemperature = async (_deviceid: string, data: any) => {
  console.log('🌡️  Color temperature: ', `${data}K`);

  const color = LEDTools.kelvinToRGB(data);

  if (state.on) {
    await strip.smoothFillWithColor(color);
  }

  setState({ ...state, color });

  return true;
};

// Sinric Pro setup
const sinricKey = process.env.SINRIC_KEY;
const sinricSecret = process.env.SINRIC_SECRET;
const deviceId = process.env.SINRIC_DEVICE_ID;

const callbacks = {
  setPowerState,
  setColor,
  setBrightness,
  setColorTemperature,
  onDisconnect: () => console.log('🔌 Connection closed.'),
  onConnected: () => console.log('🖥  Connected to Sinric Pro.')
};

const sinricpro = new SinricPro(sinricKey, [deviceId], sinricSecret, true);
startSinricPro(sinricpro, callbacks);

strip.init();

// Check for internet connectivity
async function checkInternetConnection() {
  try {
    const res = await ping.promise.probe('google.com');
  } catch (err) {
    console.error('🛑 No internet connection. Exiting...');
    process.exit(1); // Exit if no internet
  }
}

// Schedule regular internet checks
setInterval(() => {
  checkInternetConnection();
}, 5000); // Check every 5 seconds

process.on('uncaughtException', (err) => {
  console.error('\n\n🛑 There was an uncaught error', err, '\n\n');
});

process.on('unhandledRejection', (reason, p) => {
  console.error(
    '\n\n🛑 Unhandled Rejection at: Promise',
    p,
    'reason:',
    reason,
    '\n\n'
  );
});
