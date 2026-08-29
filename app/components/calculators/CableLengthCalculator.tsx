"use client";

import { useState } from "react";
import { Calculator, Cable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MeasurementInput {
  feet: string;
  inches: string;
}

function parseMeasurement(feet: string, inches: string): number {
  const ft = Number.parseFloat(feet) || 0;
  const inch = Number.parseFloat(inches) || 0;
  return Math.max(0, ft + inch / 12);
}

function formatLength(totalFeet: number): string {
  if (totalFeet <= 0) return "0 ft 0 in";
  const feet = Math.floor(totalFeet);
  const inches = Math.round((totalFeet - feet) * 12);
  
  if (inches === 12) {
    return `${feet + 1} ft 0 in`;
  }
  
  return `${feet} ft ${inches} in`;
}

export function CableLengthCalculator() {
  const [vertical, setVertical] = useState<string>("");
  const [panelTerm, setPanelTerm] = useState<string>("");
  const [deviceTerm, setDeviceTerm] = useState<MeasurementInput>({ feet: "", inches: "" });
  const [terminations, setTerminations] = useState<string>("");
  const [serviceLoop, setServiceLoop] = useState<MeasurementInput>({ feet: "10", inches: "0" });
  const [waste, setWaste] = useState<MeasurementInput>({ feet: "", inches: "" });
  const [hasCalculated, setHasCalculated] = useState(false);

  const verticalFt = Number.parseFloat(vertical) || 0;
  const panelTermFt = Number.parseFloat(panelTerm) || 0;
  const deviceTermFt = parseMeasurement(deviceTerm.feet, deviceTerm.inches);
  const terminationsFt = Number.parseFloat(terminations) || 0;
  const serviceLoopFt = parseMeasurement(serviceLoop.feet, serviceLoop.inches);
  const wasteFt = parseMeasurement(waste.feet, waste.inches);

  const totalLength = verticalFt + panelTermFt + deviceTermFt + terminationsFt + serviceLoopFt + wasteFt;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setHasCalculated(true);
  };

  const handleReset = () => {
    setVertical("");
    setPanelTerm("");
    setDeviceTerm({ feet: "", inches: "" });
    setTerminations("");
    setServiceLoop({ feet: "10", inches: "0" });
    setWaste({ feet: "", inches: "" });
    setHasCalculated(false);
  };

  const showResults = hasCalculated;

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardContent className="p-5 sm:p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Cable className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Cable Length Calculator
            </h3>
            <p className="text-sm text-muted-foreground">
              Calculate total cable needed for your installation
            </p>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Vertical (feet only) */}
            <div className="space-y-2">
              <Label htmlFor="vertical" className="text-base font-semibold flex items-center gap-2">
                Vertical Run
                <span className="text-xs font-normal text-muted-foreground">(feet)</span>
              </Label>
              <Input
                id="vertical"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="0"
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="h-11 text-base"
              />
              <p className="text-xs text-muted-foreground">Vertical distance from panel to device</p>
            </div>

            {/* Panel Termination (feet only) */}
            <div className="space-y-2">
              <Label htmlFor="panelTerm" className="text-base font-semibold flex items-center gap-2">
                Panel Termination
                <span className="text-xs font-normal text-muted-foreground">(feet)</span>
              </Label>
              <Input
                id="panelTerm"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="0"
                value={panelTerm}
                onChange={(e) => setPanelTerm(e.target.value)}
                className="h-11 text-base"
              />
              <p className="text-xs text-muted-foreground">Length needed at panel for termination</p>
            </div>

            {/* Device Termination (feet + inches) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Device Termination
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="0"
                    value={deviceTerm.feet}
                    onChange={(e) => setDeviceTerm({ ...deviceTerm, feet: e.target.value })}
                    className="h-11 text-base"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">Feet</span>
                </div>
                <div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="11"
                    placeholder="0"
                    value={deviceTerm.inches}
                    onChange={(e) => setDeviceTerm({ ...deviceTerm, inches: e.target.value })}
                    className="h-11 text-base"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">Inches</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Length needed at device for termination</p>
            </div>

            {/* Other Terminations (feet only) */}
            <div className="space-y-2">
              <Label htmlFor="terminations" className="text-base font-semibold flex items-center gap-2">
                Other Terminations
                <span className="text-xs font-normal text-muted-foreground">(feet)</span>
              </Label>
              <Input
                id="terminations"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="0"
                value={terminations}
                onChange={(e) => setTerminations(e.target.value)}
                className="h-11 text-base"
              />
              <p className="text-xs text-muted-foreground">Additional termination allowances</p>
            </div>

            {/* Service Loop (feet + inches) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Service Loop
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={serviceLoop.feet}
                    onChange={(e) => setServiceLoop({ ...serviceLoop, feet: e.target.value })}
                    className="h-11 text-base"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">Feet</span>
                </div>
                <div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="11"
                    value={serviceLoop.inches}
                    onChange={(e) => setServiceLoop({ ...serviceLoop, inches: e.target.value })}
                    className="h-11 text-base"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">Inches</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Extra cable for service loops and slack (default: 10 ft)</p>
            </div>

            {/* Waste (feet + inches) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Waste Allowance
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="0"
                    value={waste.feet}
                    onChange={(e) => setWaste({ ...waste, feet: e.target.value })}
                    className="h-11 text-base"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">Feet</span>
                </div>
                <div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="11"
                    placeholder="0"
                    value={waste.inches}
                    onChange={(e) => setWaste({ ...waste, inches: e.target.value })}
                    className="h-11 text-base"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">Inches</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Safety margin for cuts and errors</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" size="lg" className="gap-2 flex-1 sm:flex-initial">
              <Calculator className="h-4 w-4" />
              Calculate Total
            </Button>
            {hasCalculated && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleReset}
                className="flex-1 sm:flex-initial"
              >
                Reset
              </Button>
            )}
          </div>
        </form>

        {showResults && (
          <div className="mt-6 pt-6 border-t-2 border-border space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 p-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Total Cable Length Required
              </p>
              <p className="text-4xl sm:text-5xl font-bold text-primary mb-4">
                {formatLength(totalLength)}
              </p>
              <p className="text-lg font-semibold text-foreground">
                ({totalLength.toFixed(2)} feet total)
              </p>
            </div>

            <div className="space-y-2 bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Breakdown:</p>
              <div className="space-y-1.5 text-sm">
                {verticalFt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Vertical run:</span>
                    <span className="font-medium text-foreground">{formatLength(verticalFt)}</span>
                  </div>
                )}
                {panelTermFt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Panel termination:</span>
                    <span className="font-medium text-foreground">{formatLength(panelTermFt)}</span>
                  </div>
                )}
                {deviceTermFt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Device termination:</span>
                    <span className="font-medium text-foreground">{formatLength(deviceTermFt)}</span>
                  </div>
                )}
                {terminationsFt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Other terminations:</span>
                    <span className="font-medium text-foreground">{formatLength(terminationsFt)}</span>
                  </div>
                )}
                {serviceLoopFt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Service loop:</span>
                    <span className="font-medium text-foreground">{formatLength(serviceLoopFt)}</span>
                  </div>
                )}
                {wasteFt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Waste allowance:</span>
                    <span className="font-medium text-foreground">{formatLength(wasteFt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                💡 Pro Tip
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Always round up to the nearest foot when ordering cable. It's better to have a little extra than to come up short on the job!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
