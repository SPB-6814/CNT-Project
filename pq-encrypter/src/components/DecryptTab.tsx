'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDropzone } from './Dropzone';
import { Matrix } from '@/lib/mceliece';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isDecrypting: boolean;
  onDecrypt: (privateKey: { S: Matrix, G: Matrix, P: Matrix }, ciphertexts: Matrix[]) => Promise<string>;
}

export function DecryptTab({ isDecrypting, onDecrypt }: Props) {
  const [privateKey, setPrivateKey] = useState<any>(null);
  const [privFileName, setPrivFileName] = useState<string>('');
  const [ciphertexts, setCiphertexts] = useState<Matrix[] | null>(null);
  const [encFileName, setEncFileName] = useState<string>('');
  const [decryptedText, setDecryptedText] = useState<string>('');

  const onDropPriv = (files: File[]) => {
    const file = files[0];
    if (file) {
      setPrivFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const key = JSON.parse(e.target?.result as string);
          if (key.S && key.G && key.P) setPrivateKey(key);
        } catch (err) {
          alert("Invalid private key file");
        }
      };
      reader.readAsText(file);
    }
  };

  const onDropEnc = (files: File[]) => {
    const file = files[0];
    if (file) {
      setEncFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.ciphertexts) setCiphertexts(data.ciphertexts);
        } catch (err) {
          alert("Invalid encrypted file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDecrypt = async () => {
    if (!privateKey || !ciphertexts) return;
    const text = await onDecrypt(privateKey, ciphertexts);
    setDecryptedText(text);
  };

  return (
    <Card className="glass-panel border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-mono tracking-tight">Decrypt Data</CardTitle>
        <CardDescription className="text-muted-foreground font-sans">
          Upload an encrypted packet and your private key to reverse the process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground">1. ENCRYPTED DATA (.enc)</label>
            <FileDropzone 
              onDrop={onDropEnc} 
              accept={{ 'text/plain': ['.enc'] }} 
              label={encFileName ? `Loaded: ${encFileName}` : "Drag & drop .enc file"} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground">2. PRIVATE KEY (.priv)</label>
            <FileDropzone 
              onDrop={onDropPriv} 
              accept={{ 'text/plain': ['.priv'] }} 
              label={privFileName ? `Loaded: ${privFileName}` : "Drag & drop .priv key"} 
            />
          </div>
        </div>

        <Button 
          onClick={handleDecrypt} 
          disabled={isDecrypting || !privateKey || !ciphertexts}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono font-bold terminal-glow hover:terminal-glow-active transition-all duration-300"
        >
          {isDecrypting ? "DECRYPTING..." : "EXECUTE DECRYPTION"}
        </Button>

        <AnimatePresence>
          {decryptedText && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-border overflow-hidden"
            >
              <div className="p-4 border border-border rounded bg-background/50">
                <h3 className="text-sm font-mono text-primary mb-2 border-b border-primary/30 pb-1">Decryption Successful</h3>
                <div className="p-4 bg-[#0e0e0f] border border-border rounded font-mono text-sm text-foreground whitespace-pre-wrap">
                  {decryptedText}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
