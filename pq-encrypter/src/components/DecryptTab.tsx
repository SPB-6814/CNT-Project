'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDropzone } from './Dropzone';
import { Matrix } from '@/lib/mceliece';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';

interface HybridPayload {
  filename: string;
  iv: number[];
  encryptedPayload: string;
  ciphertexts: Matrix[];
}

interface Props {
  isDecrypting: boolean;
  onDecrypt: (privateKey: { S: Matrix, G: Matrix, P: Matrix }, ciphertexts: Matrix[]) => Promise<string>;
  onSync?: (data: any) => void;
}

export function DecryptTab({ isDecrypting, onDecrypt, onSync }: Props) {
  const [privateKey, setPrivateKey] = useState<any>(null);
  const [privFileName, setPrivFileName] = useState<string>('');
  
  const [hybridPayload, setHybridPayload] = useState<HybridPayload | null>(null);
  const [encFileName, setEncFileName] = useState<string>('');
  const [originalFileNameDecrypted, setOriginalFileNameDecrypted] = useState<string>('decrypted_file.txt');
  
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
          if (data.ciphertexts && data.iv && data.encryptedPayload) {
            setHybridPayload(data);
            setOriginalFileNameDecrypted(data.filename || 'decrypted_file.txt');
          } else {
            alert("This payload uses the old encryption format without AES. Please re-encrypt.");
          }
        } catch (err) {
          alert("Invalid encrypted file");
        }
      };
      reader.readAsText(file);
    }
  };

  const base64ToArrayBufferAsync = async (base64: string): Promise<ArrayBuffer> => {
    const res = await fetch(`data:application/octet-stream;base64,${base64}`);
    return await res.arrayBuffer();
  };

  const handleDecrypt = async () => {
    if (!privateKey || !hybridPayload) return;
    
    try {
      if (onSync) {
        onSync({ mode: 'decrypt', privateKey, ciphertexts: hybridPayload.ciphertexts });
      }

      // 1. Decrypt AES Key using McEliece
      const keyStringBase64 = await onDecrypt(privateKey, hybridPayload.ciphertexts);
      const keyBuffer = await base64ToArrayBufferAsync(keyStringBase64);
      
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // 2. Decrypt Payload using AES
      const iv = new Uint8Array(hybridPayload.iv);
      const encryptedContentBuffer = await base64ToArrayBufferAsync(hybridPayload.encryptedPayload);
      
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encryptedContentBuffer
      );
      
      const decoder = new TextDecoder();
      const text = decoder.decode(decryptedContent);
      setDecryptedText(text);
    } catch(err) {
      alert("Decryption failed. Incorrect private key or corrupted data.");
      console.error(err);
    }
  };

  const downloadFileFromDataUrl = () => {
    if (!decryptedText.startsWith('data:')) return;
    const element = document.createElement("a");
    element.href = decryptedText;
    element.download = originalFileNameDecrypted;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card className="glass-panel border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-mono tracking-tight">Decrypt Data</CardTitle>
        <CardDescription className="text-muted-foreground font-sans">
          Upload a hybrid-encrypted packet and your private key to reverse the process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground">1. ENCRYPTED DATA (.json)</label>
            <FileDropzone 
              onDrop={onDropEnc} 
              accept={{ 'application/json': ['.json'], 'text/plain': ['.json'] }} 
              label={encFileName ? `Loaded: ${encFileName}` : "Drag & drop .enc.json file"} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground">2. PRIVATE KEY (.json)</label>
            <FileDropzone 
              onDrop={onDropPriv} 
              accept={{ 'application/json': ['.json'], 'text/plain': ['.json'] }} 
              label={privFileName ? `Loaded: ${privFileName}` : "Drag & drop private_key.json"} 
            />
          </div>
        </div>

        <motion.div whileHover={(!isDecrypting && privateKey && hybridPayload) ? { scale: 1.02 } : {}} whileTap={(!isDecrypting && privateKey && hybridPayload) ? { scale: 0.98 } : {}}>
          <Button 
            onClick={handleDecrypt} 
            disabled={isDecrypting || !privateKey || !hybridPayload}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono font-bold terminal-glow hover:terminal-glow-active transition-all duration-300"
          >
            {isDecrypting ? "DECRYPTING (HYBRID)..." : "EXECUTE DECRYPTION"}
          </Button>
        </motion.div>

        <AnimatePresence>
          {decryptedText && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-border overflow-hidden"
            >
              <div className="p-4 border border-border rounded bg-background/50">
                <h3 className="text-sm font-mono text-primary mb-4 border-b border-primary/30 pb-1">Decryption Successful</h3>
                
                {decryptedText.startsWith('data:') ? (
                  <div className="flex flex-col items-center justify-center p-6 border border-border bg-[#0e0e0f] rounded-md text-center w-full">
                    <p className="text-sm text-foreground font-mono mb-4">
                      File Extracted: <span className="text-primary">{originalFileNameDecrypted}</span>
                    </p>
                    <Button onClick={downloadFileFromDataUrl} className="font-mono text-xs border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary mb-4">
                      <Download className="w-4 h-4 mr-2" />
                      SAVE FILE
                    </Button>

                    {/* Show a preview if it's a text file! */}
                    {(decryptedText.includes('text/plain') || originalFileNameDecrypted.endsWith('.txt')) && (
                      <div className="mt-4 w-full text-left border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground font-mono mb-2">FILE PREVIEW:</p>
                        <div className="p-3 bg-background/50 border border-border rounded font-mono text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {(() => {
                            try {
                              const base64Data = decryptedText.split(',')[1];
                              return decodeURIComponent(escape(atob(base64Data)));
                            } catch (e) {
                              return "Preview not available.";
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0e0e0f] border border-border rounded font-mono text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {decryptedText}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
