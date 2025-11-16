'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { Download, Check, Loader2, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface ImportState {
  status: 'idle' | 'scanning' | 'found' | 'importing' | 'success' | 'error';
  foundCount?: number;
  correctCount?: number;
  volume?: string;
  calculatedScore?: number;
  error?: string;
}

export function ImportPredictions() {
  const { platforms, connectPlatform, importPredictions, isConnecting, isImporting } = useTruthBounty();
  const [selectedPlatform, setSelectedPlatform] = useState<bigint | null>(null);
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' });
  const [progress, setProgress] = useState(0);

  // Mock scenarios for testing
  const mockScenarios = [
    { name: 'Beginner', total: 20, correct: 12, volume: '1', winRate: 60 },
    { name: 'Intermediate', total: 100, correct: 75, volume: '10', winRate: 75 },
    { name: 'Expert', total: 500, correct: 425, volume: '100', winRate: 85 },
  ];

  const handleConnectPlatform = async (platformId: bigint) => {
    try {
      await connectPlatform(platformId);
      setSelectedPlatform(platformId);
    } catch (error) {
      console.error('Failed to connect platform:', error);
    }
  };

  const simulateScan = async () => {
    setImportState({ status: 'scanning' });
    setProgress(0);

    // Simulate blockchain scanning
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    // Simulate found predictions
    const scenario = mockScenarios[1]; // Use intermediate by default
    setImportState({
      status: 'found',
      foundCount: scenario.total,
      correctCount: scenario.correct,
      volume: scenario.volume,
    });
  };

  const handleImport = async () => {
    if (!selectedPlatform || importState.status !== 'found') return;

    setImportState(prev => ({ ...prev, status: 'importing' }));
    setProgress(0);

    try {
      const { foundCount, correctCount, volume } = importState;

      // Simulate import progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(i);
      }

      // Generate proof
      const proof = `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`;

      // Call contract
      await importPredictions(
        selectedPlatform,
        BigInt(foundCount!),
        BigInt(correctCount!),
        BigInt(parseFloat(volume!) * 10 ** 18)  ,
        proof
      );

      // Calculate expected score (simplified formula)
      const winRate = (correctCount! / foundCount!) * 100;
      const volumeNum = parseFloat(volume!);
      const calculatedScore = Math.floor((winRate * 100) * Math.sqrt(volumeNum) / 100);

      setImportState({
        status: 'success',
        foundCount,
        correctCount,
        volume,
        calculatedScore,
      });
    } catch (error: any) {
      setImportState({
        status: 'error',
        error: error?.message || 'Failed to import predictions',
      });
    }
  };

  const resetFlow = () => {
    setImportState({ status: 'idle' });
    setProgress(0);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Import Predictions
        </CardTitle>
        <CardDescription>
          Import your prediction history from connected platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        {!selectedPlatform && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Select Platform</p>
            {platforms.map((platform) => (
              <div
                key={platform.id.toString()}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{platform.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {platform.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleConnectPlatform(platform.id)}
                  disabled={!platform.isActive || isConnecting}
                >
                  {isConnecting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting</>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Scanning State */}
        {selectedPlatform && importState.status === 'idle' && (
          <div className="space-y-4">
            <Alert>
              <Clock className="w-4 h-4" />
              <AlertDescription>
                Ready to scan blockchain for your prediction history
              </AlertDescription>
            </Alert>
            <Button onClick={simulateScan} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        )}

        {importState.status === 'scanning' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning blockchain for predictions...</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Found Predictions */}
        {importState.status === 'found' && (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <Check className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                Found {importState.foundCount} predictions on-chain!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{importState.foundCount}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importState.correctCount}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{importState.volume} BNB</div>
                <div className="text-xs text-muted-foreground">Volume</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={resetFlow} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleImport} className="flex-1" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Import Now
              </Button>
            </div>
          </div>
        )}

        {/* Importing State */}
        {importState.status === 'importing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Importing predictions to blockchain...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Please confirm the transaction in your wallet
            </p>
          </div>
        )}

        {/* Success State */}
        {importState.status === 'success' && (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <Check className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400 font-semibold">
                Successfully imported predictions!
              </AlertDescription>
            </Alert>

            <div className="p-6 border-2 border-purple-500 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Your TruthScore</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {importState.calculatedScore}
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  Updated
                </Badge>
              </div>
            </div>

            <Button onClick={resetFlow} variant="outline" className="w-full">
              Import More
            </Button>
          </div>
        )}

        {/* Error State */}
        {importState.status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{importState.error}</AlertDescription>
            </Alert>
            <Button onClick={resetFlow} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}

        {/* Rate Limit Warning */}
        {selectedPlatform && (
          <p className="text-xs text-muted-foreground text-center">
            ⏱️ Rate limit: 1 hour between imports
          </p>
        )}
      </CardContent>
    </Card>
  );
}
