export interface DeviceType {
  id: string;
  name: string;
  abbreviation: string;
  category: "networking" | "compute" | "storage" | "security" | "other";
  description: string;
  specifications?: {
    label: string;
    value: string;
  }[];
  ports?: {
    label: string;
    count: number;
    type: string;
  }[];
  configurations?: {
    label: string;
    value: string;
  }[];
}

export const DEVICE_TYPES: Record<string, DeviceType> = {
  firewall: {
    id: "firewall",
    name: "Firewall",
    abbreviation: "FW",
    category: "security",
    description: "Network security device that monitors and filters incoming and outgoing network traffic",
    specifications: [
      { label: "Throughput", value: "10 Gbps" },
      { label: "Max Concurrent Sessions", value: "500,000" },
      { label: "VPN Support", value: "IPSec, SSL" },
    ],
    ports: [
      { label: "Ethernet", count: 8, type: "RJ45 1Gbps" },
      { label: "SFP+", count: 2, type: "10Gbps" },
    ],
    configurations: [
      { label: "Mode", value: "Layer 3 (Routing)" },
      { label: "HA", value: "Active/Standby" },
    ],
  },
  router: {
    id: "router",
    name: "Router",
    abbreviation: "RTR",
    category: "networking",
    description: "Network device that forwards data packets between computer networks",
    specifications: [
      { label: "Routing Capacity", value: "100 Gbps" },
      { label: "Max Routes", value: "1M routes" },
      { label: "Protocols", value: "BGP, OSPF, EIGRP" },
    ],
    ports: [
      { label: "Ethernet", count: 24, type: "RJ45 1Gbps" },
      { label: "SFP+", count: 4, type: "10Gbps" },
    ],
    configurations: [
      { label: "Routing Protocol", value: "BGP + OSPF" },
      { label: "Load Balancing", value: "ECMP" },
    ],
  },
  switch: {
    id: "switch",
    name: "Switch",
    abbreviation: "SW",
    category: "networking",
    description: "Network device that connects devices within a network by using packet switching",
    specifications: [
      { label: "Switching Capacity", value: "128 Gbps" },
      { label: "Forwarding Rate", value: "95.2 Mpps" },
      { label: "VLAN Support", value: "4096 VLANs" },
    ],
    ports: [
      { label: "Ethernet", count: 48, type: "RJ45 1Gbps" },
      { label: "SFP+", count: 4, type: "10Gbps Uplink" },
    ],
    configurations: [
      { label: "Layer", value: "Layer 2/3" },
      { label: "Stacking", value: "Up to 8 units" },
    ],
  },
  loadbalancer: {
    id: "loadbalancer",
    name: "Load Balancer",
    abbreviation: "LB",
    category: "networking",
    description: "Distributes network traffic across multiple servers to ensure reliability and performance",
    specifications: [
      { label: "Throughput", value: "40 Gbps" },
      { label: "Connections/sec", value: "250,000" },
      { label: "SSL TPS", value: "10,000" },
    ],
    ports: [
      { label: "Ethernet", count: 8, type: "RJ45 1Gbps" },
      { label: "SFP+", count: 2, type: "10Gbps" },
    ],
    configurations: [
      { label: "Algorithm", value: "Round Robin, Least Connections" },
      { label: "Health Checks", value: "HTTP, TCP, ICMP" },
    ],
  },
  server: {
    id: "server",
    name: "Server",
    abbreviation: "SRV",
    category: "compute",
    description: "Physical or virtual computer that provides services to other computers over a network",
    specifications: [
      { label: "CPU", value: "2x Intel Xeon Gold 6248R" },
      { label: "RAM", value: "512 GB DDR4" },
      { label: "Storage", value: "8x 1.92TB SSD (RAID 10)" },
    ],
    ports: [
      { label: "Ethernet", count: 4, type: "RJ45 10Gbps" },
      { label: "Management", count: 1, type: "iLO/IPMI" },
    ],
    configurations: [
      { label: "OS", value: "Ubuntu Server 22.04 LTS" },
      { label: "Virtualization", value: "VMware ESXi 8.0" },
    ],
  },
  wap: {
    id: "wap",
    name: "Wireless Access Point",
    abbreviation: "WAP",
    category: "networking",
    description: "Device that allows wireless devices to connect to a wired network",
    specifications: [
      { label: "Standard", value: "Wi-Fi 6E (802.11ax)" },
      { label: "Max Speed", value: "9.6 Gbps" },
      { label: "Concurrent Clients", value: "512" },
    ],
    ports: [
      { label: "Ethernet", count: 2, type: "RJ45 2.5Gbps PoE+" },
    ],
    configurations: [
      { label: "Bands", value: "2.4GHz, 5GHz, 6GHz" },
      { label: "Security", value: "WPA3, 802.1X" },
    ],
  },
  storage: {
    id: "storage",
    name: "Storage Array",
    abbreviation: "SAN",
    category: "storage",
    description: "Network-attached storage system for centralized data storage",
    specifications: [
      { label: "Capacity", value: "480 TB (raw)" },
      { label: "IOPS", value: "500,000" },
      { label: "Redundancy", value: "RAID 6 + Hot Spare" },
    ],
    ports: [
      { label: "Fibre Channel", count: 4, type: "16Gbps" },
      { label: "iSCSI", count: 4, type: "10Gbps" },
    ],
    configurations: [
      { label: "Protocol", value: "FC, iSCSI, NFS" },
      { label: "Snapshots", value: "Enabled" },
    ],
  },
  vpngateway: {
    id: "vpngateway",
    name: "VPN Gateway",
    abbreviation: "VPN",
    category: "security",
    description: "Secure connection point for remote access to private networks",
    specifications: [
      { label: "VPN Throughput", value: "5 Gbps" },
      { label: "Concurrent Tunnels", value: "10,000" },
      { label: "Encryption", value: "AES-256" },
    ],
    ports: [
      { label: "Ethernet", count: 4, type: "RJ45 1Gbps" },
    ],
    configurations: [
      { label: "Protocols", value: "IPSec, OpenVPN, WireGuard" },
      { label: "Authentication", value: "RADIUS, LDAP, MFA" },
    ],
  },
};
