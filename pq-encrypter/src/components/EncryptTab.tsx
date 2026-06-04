'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDropzone } from './Dropzone';
import { Matrix } from '@/lib/mceliece';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isEncrypting: boolean;
  onEncrypt: (publicKey: { G_hat: Matrix }, text: string) => Promise<Matrix[]>;
}

export function EncryptTab({ isEncrypting, onEncrypt }: Props) {
  const [publicKey, setPublicKey] = useState<{ G_hat: Matrix } | null>(null);
  const [pubFileName, setPubFileName] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [ciphertexts, setCiphertexts] = useState<Matrix[] | null>(null);

  const onDropPub = (files: File[]) => {
    const file = files[0];
    if (file) {
      setPubFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const key = JSON.parse(e.target?.result as string);
          if (key.G_hat) setPublicKey(key);
        } catch (err) {
          alert("Invalid public key file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEncrypt = async () => {
    if (!publicKey || !text) return;
    const result = await onEncrypt(publicKey, text);
    setCiphertexts(result);
  };

  const downloadEncrypted = () => {
    if (!ciphertexts) return;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify({ ciphertexts })], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'message.enc';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card className="glass-panel border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-mono tracking-tight">Encrypt Data</CardTitle>
        <CardDescription className="text-muted-foreground font-sans">
          Upload a public key and enter data to encrypt using the McEliece cryptosystem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">1. PUBLIC KEY (.pub)</label>
          <FileDropzone 
            onDrop={onDropPub} 
            accept={{ 'text/plain': ['.pub'] }} 
            label={pubFileName ? `Loaded: ${pubFileName}` : "Drag & drop public key here"} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">2. PAYLOAD DATA</label>
          <Textarea 
            placeholder="Enter text to encrypt..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="font-mono bg-background/50 border-border focus-visible:ring-primary h-32"
          />
        </div>

        <Button 
          onClick={handleEncrypt} 
          disabled={isEncrypting || !publicKey || !text}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono font-bold terminal-glow hover:terminal-glow-active transition-all duration-300"
        >
          {isEncrypting ? "ENCRYPTING..." : "EXECUTE ENCRYPTION"}
        </Button>

        <AnimatePresence>
          {ciphertexts && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-border overflow-hidden"
            >
              <div className="p-4 border border-border rounded bg-background/50">
                <h3 className="text-sm font-mono text-primary mb-2 border-b border-primary/30 pb-1">Encryption Successful</h3>
                <p className="text-xs font-mono text-muted-foreground break-all mb-4">
                  {JSON.stringify(ciphertexts).substring(0, 200)}...
                </p>
                <Button variant="outline" size="sm" onClick={downloadEncrypted} className="w-full font-mono text-xs border-primary/50 text-primary hover:bg-primary/10">
                  DOWNLOAD .ENC
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
