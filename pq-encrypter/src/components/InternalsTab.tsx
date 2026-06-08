/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyPair, generateKeys, decodeHamming, textToBinaryVectors } from '@/lib/mceliece';
import { multiplyMatrices, getInverse, Matrix } from '@/lib/gf2';
import { BlockMath, InlineMath } from 'react-katex';
import { motion, AnimatePresence } from 'framer-motion';

import { SyncData } from '@/app/page';

interface SimulationStep {
  m: Matrix | null;
  c_prime: Matrix | null;
  e: Matrix | null;
  c: Matrix;
  c_hat: Matrix | null;
  m_hat: Matrix | null;
  m_decrypted: Matrix | null;
}

export function InternalsTab({ syncData }: { syncData?: SyncData | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [keys, setKeys] = useState<any>(null);
  const [messageInput, setMessageInput] = useState<string>('Hi');
  
  // State for internals
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (syncData) {
      if (syncData.mode === 'encrypt' && syncData.publicKey && syncData.text) {
        const { publicKey, text } = syncData;
        setKeys({ publicKey, privateKey: null });
        setMessageInput(text);
        
        try {
          const parsedBlocks = textToBinaryVectors(text);
          const steps: SimulationStep[] = parsedBlocks.map(mMatrix => {
            const cPrimeMatrix = multiplyMatrices(mMatrix, publicKey.G_hat);
            const errorVec = Array(7).fill(0);
            errorVec[Math.floor(Math.random() * 7)] = 1;
            const eMatrix: Matrix = [errorVec];
            const cMatrix: Matrix = [cPrimeMatrix[0].map((val, i) => (val + errorVec[i]) % 2)];
            
            return {
              m: mMatrix, c_prime: cPrimeMatrix, e: eMatrix, c: cMatrix,
              c_hat: null, m_hat: null, m_decrypted: null
            };
          });
          setSimulationSteps(steps);
          setCurrentStepIndex(0);
        } catch (e) {
          console.error(e);
        }
      } 
      else if (syncData.mode === 'decrypt' && syncData.privateKey && syncData.ciphertexts) {
        const { privateKey, ciphertexts } = syncData;
        setKeys({ publicKey: null, privateKey });
        setMessageInput('DECRYPTING FROM CIPHERTEXTS...');
        
        try {
          const steps: SimulationStep[] = ciphertexts.map((cMatrix: Matrix) => {
            const pInv = getInverse(privateKey.P);
            const cHatMatrix = multiplyMatrices(cMatrix, pInv);
            const mHatMatrix = decodeHamming(cHatMatrix);
            const sInv = getInverse(privateKey.S);
            const mDecryptedMatrix = multiplyMatrices(mHatMatrix, sInv);

            return {
              m: null, c_prime: null, e: null, c: cMatrix,
              c_hat: cHatMatrix, m_hat: mHatMatrix, m_decrypted: mDecryptedMatrix
            };
          });
          setSimulationSteps(steps);
          setCurrentStepIndex(0);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [syncData]);

  const handleGenerateKeys = () => {
    const newKeys = generateKeys();
    setKeys(newKeys);
    resetInternals();
  };

  const resetInternals = () => {
    setSimulationSteps([]);
    setCurrentStepIndex(0);
  };

  const matrixToLatex = (matrix: number[][], name?: string) => {
    if (!matrix || matrix.length === 0) return '';
    const rows = matrix.map(row => row.join(' & ')).join(' \\\\ ');
    return name ? `${name} = \\begin{bmatrix} ${rows} \\end{bmatrix}` : `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
  };

  const handleSimulate = () => {
    if (!keys) return;
    if (!messageInput) return;
    
    try {
      const parsedBlocks = textToBinaryVectors(messageInput);
      if (parsedBlocks.length === 0) return;

      const steps: SimulationStep[] = parsedBlocks.map(mMatrix => {
        // --- ENCRYPTION ---
        let cMatrix: Matrix;
        let cPrimeMatrix: Matrix | null = null;
        let eMatrix: Matrix | null = null;
        
        if (keys.publicKey) {
          cPrimeMatrix = multiplyMatrices(mMatrix, keys.publicKey.G_hat);
          const errorVec = Array(7).fill(0);
          errorVec[Math.floor(Math.random() * 7)] = 1;
          eMatrix = [errorVec];
          cMatrix = [cPrimeMatrix[0].map((val, i) => (val + errorVec[i]) % 2)];
        } else {
          cMatrix = [[0,0,0,0,0,0,0]]; // Fallback if no public key
        }
  
        // --- DECRYPTION ---
        let cHatMatrix: Matrix | null = null;
        let mHatMatrix: Matrix | null = null;
        let mDecryptedMatrix: Matrix | null = null;

        if (keys.privateKey) {
          const pInv = getInverse(keys.privateKey.P);
          cHatMatrix = multiplyMatrices(cMatrix, pInv);
          mHatMatrix = decodeHamming(cHatMatrix);
          const sInv = getInverse(keys.privateKey.S);
          mDecryptedMatrix = multiplyMatrices(mHatMatrix, sInv);
        }

        return {
          m: mMatrix,
          c_prime: cPrimeMatrix,
          e: eMatrix,
          c: cMatrix,
          c_hat: cHatMatrix,
          m_hat: mHatMatrix,
          m_decrypted: mDecryptedMatrix
        };
      });

      setSimulationSteps(steps);
      setCurrentStepIndex(0);

    } catch (err) {
      alert("Simulation error: " + (err as Error).message);
    }
  };

  const step = simulationSteps[currentStepIndex];

  return (
    <Card className="glass-panel border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-mono tracking-tight">System Internals</CardTitle>
        <CardDescription className="text-muted-foreground font-sans">
          Step-by-step mathematical walkthrough of the McEliece [7, 4, 1] encryption and decryption process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border p-4 rounded-md bg-background/50">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground">1. CRYPTO KEYS</label>
            <Button 
              onClick={handleGenerateKeys} 
              variant={keys ? "outline" : "default"}
              className={`w-full font-mono text-xs ${!keys ? 'bg-primary text-primary-foreground terminal-glow hover:bg-primary/90' : 'border-border'}`}
            >
              {keys ? "REGENERATE KEYS" : "GENERATE KEYS"}
            </Button>
            {keys && <p className="text-[10px] text-primary font-mono mt-1 text-center">Keys ready.</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground">2. TEXT MESSAGE</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-background border border-border rounded px-3 text-sm font-mono focus:outline-none focus:border-primary"
                placeholder="Enter any text..."
              />
              <Button 
                onClick={handleSimulate} 
                disabled={!keys || !messageInput}
                className="font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                SIMULATE
              </Button>
            </div>
          </div>
        </div>

        {simulationSteps.length > 0 && (
          <div className="flex items-center justify-between border border-border p-2 rounded bg-background/80">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentStepIndex === 0} 
              onClick={() => setCurrentStepIndex(i => i - 1)}
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              &lt; PREV BLOCK
            </Button>
            <span className="font-mono text-xs font-bold text-primary">
              BLOCK {currentStepIndex + 1} OF {simulationSteps.length}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentStepIndex === simulationSteps.length - 1} 
              onClick={() => setCurrentStepIndex(i => i + 1)}
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              NEXT BLOCK &gt;
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step && (
            <motion.div 
              key={currentStepIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, staggerChildren: 0.15 }}
              className="space-y-6 pt-2 overflow-hidden"
            >
              
              {/* Encryption Path */}
              {step.c_prime && keys?.publicKey && (
                <div className="p-4 border border-primary/30 rounded bg-primary/5">
                  <h3 className="text-sm font-mono text-primary mb-4 border-b border-primary/30 pb-1">ENCRYPTION INTERNALS</h3>
                  
                  <div className="space-y-4 text-[12px] md:text-sm overflow-x-auto">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">1. 4-bit Message Block (<InlineMath math="m" />)</p>
                      <BlockMath math={matrixToLatex(step.m!, "m")} />
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">2. Multiply by Public Key (<InlineMath math="c' = m \cdot \hat{G}" />)</p>
                      <BlockMath math={`c' = ${matrixToLatex(step.m!)} \\cdot ${matrixToLatex(keys.publicKey.G_hat)} = ${matrixToLatex(step.c_prime!)}`} />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">3. Generate Random Error Vector (<InlineMath math="e" />)</p>
                      <BlockMath math={matrixToLatex(step.e!, "e")} />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">4. Add Error to form Ciphertext (<InlineMath math="c = c' + e" />)</p>
                      <BlockMath math={`c = ${matrixToLatex(step.c_prime!)} + ${matrixToLatex(step.e!)} = ${matrixToLatex(step.c)}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Decryption Path */}
              {step.c_hat && keys?.privateKey && (
                <div className="p-4 border border-warning/30 rounded bg-warning/5">
                  <h3 className="text-sm font-mono text-warning mb-4 border-b border-warning/30 pb-1">DECRYPTION INTERNALS</h3>
                  
                  <div className="space-y-4 text-[12px] md:text-sm overflow-x-auto">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">1. Multiply Ciphertext by <InlineMath math="P^{-1}" /> (<InlineMath math="\hat{c} = c \cdot P^{-1}" />)</p>
                      <BlockMath math={`\\hat{c} = ${matrixToLatex(step.c)} \\cdot ${matrixToLatex(getInverse(keys.privateKey.P))} = ${matrixToLatex(step.c_hat!)}`} />
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">2. Decode with Hamming Code to remove error (<InlineMath math="\hat{m} = \text{Decode}(\hat{c})" />)</p>
                      <BlockMath math={`\\hat{m} = ${matrixToLatex(step.m_hat!)}`} />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">3. Multiply by <InlineMath math="S^{-1}" /> to get original block (<InlineMath math="m = \hat{m} \cdot S^{-1}" />)</p>
                      <BlockMath math={`m = ${matrixToLatex(step.m_hat!)} \\cdot ${matrixToLatex(getInverse(keys.privateKey.S))} = ${matrixToLatex(step.m_decrypted!)}`} />
                    </div>

                    {step.m && (
                      <div className="mt-6 p-2 bg-background/80 rounded border border-border text-center">
                        <p className="text-sm font-mono">
                          {JSON.stringify(step.m[0]) === JSON.stringify(step.m_decrypted![0]) 
                            ? <span className="text-green-500 font-bold">SUCCESS: Decrypted block matches original!</span> 
                            : <span className="text-red-500 font-bold">FAILURE: Mismatch</span>}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
