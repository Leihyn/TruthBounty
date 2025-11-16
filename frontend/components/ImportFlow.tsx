'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { formatEther } from 'viem';

export function ImportFlow() {
  const { platforms, connectPlatform, importPredictions, isConnecting, isImporting } = useTruthBounty();
  const [selectedPlatform, setSelectedPlatform] = useState<bigint | null>(null);

  // Mock prediction data for testing
  const mockScenarios = [
    {
      name: 'Beginner',
      total: 20,
      correct: 12,
      volume: '1',
      description: '60% win rate, 1 BNB volume',
    },
    {
      name: 'Intermediate',
      total: 100,
      correct: 75,
      volume: '10',
      description: '75% win rate, 10 BNB volume',
    },
    {
      name: 'Expert',
      total: 500,
      correct: 425,
      volume: '100',
      description: '85% win rate, 100 BNB volume',
    },
  ];

  const handleConnectPlatform = async (platformId: bigint) => {
    try {
      await connectPlatform(platformId);
      setSelectedPlatform(platformId);
    } catch (error) {
      console.error('Failed to connect platform:', error);
    }
  };

  const handleImportScenario = async (scenario: typeof mockScenarios[0]) => {
    if (!selectedPlatform) return;

    try {
      // Generate a simple proof (in production, this would come from backend)
      const proof = `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`;

      await importPredictions(
        selectedPlatform,
        BigInt(scenario.total),
        BigInt(scenario.correct),
        BigInt(scenario.volume) * BigInt(10 ** 18), // Convert to wei
        proof
      );
    } catch (error) {
      console.error('Failed to import predictions:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Predictions</CardTitle>
        <CardDescription>
          Connect your prediction platform and import your trading history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connect">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connect">Connect Platform</TabsTrigger>
            <TabsTrigger value="import" disabled={!selectedPlatform}>
              Import Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a platform to connect to your TruthBounty profile
            </p>
            <div className="space-y-2">
              {platforms.map((platform) => (
                <div
                  key={platform.id.toString()}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{platform.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {platform.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleConnectPlatform(platform.id)}
                    disabled={!platform.isActive || isConnecting}
                    variant={selectedPlatform === platform.id ? 'secondary' : 'default'}
                  >
                    {selectedPlatform === platform.id ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a scenario to import (for testing purposes)
            </p>
            <div className="grid gap-4">
              {mockScenarios.map((scenario) => (
                <Card key={scenario.name}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{scenario.name}</h4>
                          <Badge variant="outline">
                            {((scenario.correct / scenario.total) * 100).toFixed(0)}% Win Rate
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          <span>{scenario.total} predictions</span>
                          <span>{scenario.correct} correct</span>
                          <span>{scenario.volume} BNB</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleImportScenario(scenario)}
                        disabled={isImporting}
                        size="sm"
                      >
                        Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Rate limit: 1 hour between imports
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
