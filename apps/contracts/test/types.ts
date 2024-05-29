export interface ShipType {
  name: string;
  size: number[];
}

export interface ShipSetupInfo {
  shipId: number;
  topLeft: [number, number];
  bottomRight: [number, number];
}
