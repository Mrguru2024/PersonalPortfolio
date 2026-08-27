"use client";

import { useState } from "react";
import { DeviceMarker, DEVICE_TYPES, type DeviceType } from "@/components/device-markers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeviceMarkersDemo() {
  const [selectedDevices, setSelectedDevices] = useState<DeviceType[]>([]);

  const handleDeviceSelect = (device: DeviceType) => {
    setSelectedDevices((prev) => {
      const exists = prev.find((d) => d.id === device.id);
      if (exists) {
        return prev;
      }
      return [...prev, device];
    });
  };

  const devices = Object.values(DEVICE_TYPES);
  const networkingDevices = devices.filter((d) => d.category === "networking");
  const computeDevices = devices.filter((d) => d.category === "compute");
  const storageDevices = devices.filter((d) => d.category === "storage");
  const securityDevices = devices.filter((d) => d.category === "security");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Device Markers Demo
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Click on any device marker to see its details. The marker will
            expand to show the full device name and a popup will appear with
            complete specifications and configurations.
          </p>
        </div>

        <div className="grid gap-8 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Networking Devices
              </CardTitle>
              <CardDescription className="text-white/60">
                Devices that manage network traffic and connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {networkingDevices.map((device) => (
                  <DeviceMarker
                    key={device.id}
                    device={device}
                    onSelect={handleDeviceSelect}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                Security Devices
              </CardTitle>
              <CardDescription className="text-white/60">
                Devices that protect and secure the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {securityDevices.map((device) => (
                  <DeviceMarker
                    key={device.id}
                    device={device}
                    onSelect={handleDeviceSelect}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                Compute Devices
              </CardTitle>
              <CardDescription className="text-white/60">
                Servers and processing units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {computeDevices.map((device) => (
                  <DeviceMarker
                    key={device.id}
                    device={device}
                    onSelect={handleDeviceSelect}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Storage Devices
              </CardTitle>
              <CardDescription className="text-white/60">
                Data storage and management systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {storageDevices.map((device) => (
                  <DeviceMarker
                    key={device.id}
                    device={device}
                    onSelect={handleDeviceSelect}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Network Diagram Example</CardTitle>
            <CardDescription className="text-white/60">
              Click on any device marker in the diagram below to view details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-slate-950/50 rounded-lg p-8 min-h-[400px] border border-white/10">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              
              <div className="relative">
                <div className="flex justify-center mb-8">
                  <DeviceMarker
                    device={DEVICE_TYPES.firewall}
                    onSelect={handleDeviceSelect}
                  />
                </div>

                <div className="flex justify-center gap-12 mb-8">
                  <DeviceMarker
                    device={DEVICE_TYPES.router}
                    onSelect={handleDeviceSelect}
                  />
                  <DeviceMarker
                    device={DEVICE_TYPES.loadbalancer}
                    onSelect={handleDeviceSelect}
                  />
                </div>

                <div className="flex justify-center gap-8 mb-8">
                  <DeviceMarker
                    device={DEVICE_TYPES.switch}
                    onSelect={handleDeviceSelect}
                  />
                  <DeviceMarker
                    device={DEVICE_TYPES.vpngateway}
                    onSelect={handleDeviceSelect}
                  />
                  <DeviceMarker
                    device={DEVICE_TYPES.wap}
                    onSelect={handleDeviceSelect}
                  />
                </div>

                <div className="flex justify-center gap-12">
                  <DeviceMarker
                    device={DEVICE_TYPES.server}
                    onSelect={handleDeviceSelect}
                  />
                  <DeviceMarker
                    device={DEVICE_TYPES.storage}
                    onSelect={handleDeviceSelect}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedDevices.length > 0 && (
          <Card className="mt-8 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Selected Devices</CardTitle>
              <CardDescription className="text-white/60">
                Devices you've clicked on ({selectedDevices.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedDevices.map((device) => (
                  <span
                    key={device.id}
                    className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-md"
                  >
                    {device.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
