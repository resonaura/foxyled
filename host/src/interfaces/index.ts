export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface AppState {
  color: ColorRGB;
  brightness: number;
  on: boolean;
}
