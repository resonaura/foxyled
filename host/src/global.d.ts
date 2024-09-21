declare module "sinricpro";

// Define a type for the expected structure of the process.env object with LED Strip and Sinric Pro configurations
type EnvironmentVariables = {
  SERIAL_PORT: string;
  LED_COUNT: string; // Environment variables are string by default

  SINRIC_KEY: string;
  SINRIC_SECRET: string;
  SINRIC_DEVICE_ID: string;
  REMOTE_PORT: string;
};

// Declare the global NodeJS environment variable type to include the new environment variable types
namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
