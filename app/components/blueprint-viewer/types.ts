export interface MarkerSymbol {
  id: string;
  name: string;
  abbreviation: string;
  category: "device" | "door" | "window" | "furniture" | "other";
  icon?: string;
  color: string;
  description: string;
  specifications?: {
    label: string;
    value: string;
  }[];
}

export interface PlacedMarkerData {
  id: string;
  symbol: MarkerSymbol;
  position: { x: number; y: number };
  rotation: number;
  customLabel?: string;
  customData?: Record<string, string>;
}

export const DEFAULT_SYMBOLS: MarkerSymbol[] = [
  {
    id: "router",
    name: "Router",
    abbreviation: "RTR",
    category: "device",
    color: "#3b82f6",
    description: "Network routing device",
    specifications: [
      { label: "Type", value: "Network Device" },
      { label: "Ports", value: "24x Ethernet" },
    ],
  },
  {
    id: "switch",
    name: "Switch",
    abbreviation: "SW",
    category: "device",
    color: "#3b82f6",
    description: "Network switch",
    specifications: [
      { label: "Type", value: "Network Device" },
      { label: "Ports", value: "48x Ethernet" },
    ],
  },
  {
    id: "firewall",
    name: "Firewall",
    abbreviation: "FW",
    category: "device",
    color: "#ef4444",
    description: "Security firewall",
    specifications: [
      { label: "Type", value: "Security Device" },
      { label: "Throughput", value: "10 Gbps" },
    ],
  },
  {
    id: "server",
    name: "Server",
    abbreviation: "SRV",
    category: "device",
    color: "#8b5cf6",
    description: "Server hardware",
    specifications: [
      { label: "Type", value: "Compute" },
      { label: "CPU", value: "2x Xeon" },
    ],
  },
  {
    id: "wap",
    name: "Wireless AP",
    abbreviation: "WAP",
    category: "device",
    color: "#3b82f6",
    description: "Wireless access point",
    specifications: [
      { label: "Type", value: "Network Device" },
      { label: "Standard", value: "Wi-Fi 6E" },
    ],
  },
  {
    id: "storage",
    name: "Storage",
    abbreviation: "SAN",
    category: "device",
    color: "#10b981",
    description: "Storage array",
    specifications: [
      { label: "Type", value: "Storage" },
      { label: "Capacity", value: "480 TB" },
    ],
  },
  {
    id: "door-single",
    name: "Single Door",
    abbreviation: "DR",
    category: "door",
    color: "#f59e0b",
    description: "Standard single door",
    specifications: [
      { label: "Type", value: "Single Door" },
      { label: "Width", value: "36 inches" },
    ],
  },
  {
    id: "door-double",
    name: "Double Door",
    abbreviation: "DDR",
    category: "door",
    color: "#f59e0b",
    description: "Double door entry",
    specifications: [
      { label: "Type", value: "Double Door" },
      { label: "Width", value: "72 inches" },
    ],
  },
  {
    id: "window",
    name: "Window",
    abbreviation: "WIN",
    category: "window",
    color: "#06b6d4",
    description: "Standard window",
    specifications: [
      { label: "Type", value: "Window" },
      { label: "Size", value: "Standard" },
    ],
  },
  {
    id: "desk",
    name: "Desk",
    abbreviation: "DSK",
    category: "furniture",
    color: "#64748b",
    description: "Office desk",
    specifications: [
      { label: "Type", value: "Furniture" },
      { label: "Size", value: "60x30 inches" },
    ],
  },
];
