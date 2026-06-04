'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyPair } from '@/lib/mceliece';
import { BlockMath, InlineMath } from 'react-katex';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface Props {
  isGenerating: boolean;
  onGenerate: () => Promise<KeyPair>;
}

export function KeyGenerationTab({ isGenerating, onGenerate }: Props) {
  const [keys, setKeys] = useState<KeyPair | null>(null);

  const handleGenerate = async () => {
    const generatedKeys = await onGenerate();
    setKeys(generatedKeys);
  };

  const matrixToLatex = (matrix: number[][], name: string) => {
    const rows = matrix.map(row => row.join(' & ')).join(' \\\\ ');
    return `${name} = \\begin{bmatrix} ${rows} \\end{bmatrix}`;
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadPublicKey = () => {
    if (!keys) return;
    downloadFile('public_key.json', JSON.stringify({ G_hat: keys.publicKey.G_hat }));
  };

  const downloadPrivateKey = () => {
    if (!keys) return;
    downloadFile('private_key.json', JSON.stringify(keys.privateKey));
  };

  return (
    <Card className="glass-panel border-border bg-card/60">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl text-primary font-mono tracking-tight">Key Generation Chamber</CardTitle>
          <CardDescription className="text-muted-foreground font-sans mt-1">
            Initialize McEliece cryptosystem parameters. Generates Public and Private Keypairs based on the [7, 4, 1] Hamming code.
          </CardDescription>
        </div>
        {keys && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10 ml-4 hidden md:flex"
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            REGENERATE
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {!keys && (
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono font-bold terminal-glow hover:terminal-glow-active transition-all duration-300"
          >
            {isGenerating ? "GENERATING MATRICES..." : "INITIALIZE KEYPAIR GENERATION"}
          </Button>
        )}

        <AnimatePresence>
          {keys && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded bg-background/50">
                  <h3 className="text-sm font-mono text-warning mb-2 border-b border-warning/30 pb-1">Private Key Elements</h3>
                  <div className="text-[10px] overflow-x-auto">
                    <BlockMath math={matrixToLatex(keys.privateKey.S, "S")} />
                    <BlockMath math={matrixToLatex(keys.privateKey.G, "G")} />
                    <BlockMath math={matrixToLatex(keys.privateKey.P, "P")} />
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadPrivateKey} className="w-full mt-4 font-mono text-xs border-border hover:bg-card">
                    DOWNLOAD PRIVATE_KEY.JSON
                  </Button>
                </div>
                
                <div className="p-4 border border-border rounded bg-background/50 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-mono text-primary mb-2 border-b border-primary/30 pb-1">Public Key Element</h3>
                    <p className="text-xs text-muted-foreground mb-2"><InlineMath math="\hat{G} = S \cdot G \cdot P" /></p>
                    <div className="text-[10px] overflow-x-auto">
                      <BlockMath math={matrixToLatex(keys.publicKey.G_hat, "\\hat{G}")} />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadPublicKey} className="w-full mt-4 font-mono text-xs border-primary/50 text-primary hover:bg-primary/10">
                    DOWNLOAD PUBLIC_KEY.JSON
                  </Button>
                </div>
              </div>

              {/* Mobile regenerate button */}
              <Button 
                variant="outline" 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="w-full font-mono text-xs border-primary/50 text-primary hover:bg-primary/10 md:hidden mt-4"
              >
                <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                REGENERATE KEYPAIR
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
