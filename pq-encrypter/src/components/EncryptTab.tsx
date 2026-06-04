'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [originalFileName, setOriginalFileName] = useState<string>('message.txt');
  const [payloadFileName, setPayloadFileName] = useState<string>('');
  
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

  const onDropPayload = (files: File[]) => {
    const file = files[0];
    if (file) {
      setPayloadFileName(file.name);
      setOriginalFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        // We encrypt the Data URL directly for files (e.g., data:application/pdf;base64,JVBERi0...)
        setText(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
    const fileData = JSON.stringify({ 
      filename: originalFileName,
      ciphertexts 
    });
    const file = new Blob([fileData], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${originalFileName}.enc.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card className="glass-panel border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-mono tracking-tight">Encrypt Data</CardTitle>
        <CardDescription className="text-muted-foreground font-sans">
          Upload a public key and enter data (or drop a file) to encrypt using the McEliece cryptosystem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">1. PUBLIC KEY (.json)</label>
          <FileDropzone 
            onDrop={onDropPub} 
            accept={{ 'application/json': ['.json'], 'text/plain': ['.json'] }} 
            label={pubFileName ? `Loaded: ${pubFileName}` : "Drag & drop public key here"} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">2. PAYLOAD DATA</label>
          <Tabs defaultValue="text" className="w-full border border-border rounded-md p-2">
            <TabsList className="grid w-full grid-cols-2 bg-background mb-4">
              <TabsTrigger value="text" className="font-mono text-xs">TEXT INPUT</TabsTrigger>
              <TabsTrigger value="file" className="font-mono text-xs">FILE UPLOAD (.txt, .pdf)</TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <Textarea 
                placeholder="Enter text to encrypt..." 
                value={text.startsWith('data:') ? '' : text}
                onChange={(e) => {
                  setText(e.target.value);
                  setOriginalFileName('message.txt');
                  setPayloadFileName('');
                }}
                className="font-mono bg-background/50 border-border focus-visible:ring-primary h-32"
              />
            </TabsContent>
            <TabsContent value="file">
              <FileDropzone 
                onDrop={onDropPayload} 
                label={payloadFileName ? `Loaded payload: ${payloadFileName}` : "Drag & drop a file (.txt, .pdf, etc.)"} 
                className={payloadFileName ? "border-primary text-primary" : ""}
              />
            </TabsContent>
          </Tabs>
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
                <p className="text-xs font-mono text-muted-foreground break-all mb-4 line-clamp-3">
                  {JSON.stringify(ciphertexts).substring(0, 200)}...
                </p>
                <Button variant="outline" size="sm" onClick={downloadEncrypted} className="w-full font-mono text-xs border-primary/50 text-primary hover:bg-primary/10">
                  DOWNLOAD {originalFileName.toUpperCase()}.ENC.JSON
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
