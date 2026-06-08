'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDropzone } from './Dropzone';
import { Matrix } from '@/lib/mceliece';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import LZString from 'lz-string';

interface HybridPayload {
  filename: string;
  iv: number[];
  encryptedPayload: string;
  ciphertexts: Matrix[];
}

interface Props {
  isDecrypting: boolean;
  onDecrypt: (privateKey: { S: Matrix, G: Matrix, P: Matrix }, ciphertexts: Matrix[]) => Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSync?: (data: any) => void;
  providedPrivateKey?: { S: Matrix, G: Matrix, P: Matrix };
  providedPayload?: HybridPayload;
  providedPeerId?: string | null;
}

export function DecryptTab({ isDecrypting, onDecrypt, onSync, providedPrivateKey, providedPayload, providedPeerId }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [internalPrivateKey, setInternalPrivateKey] = useState<any>(null);
  const [internalPrivFileName, setInternalPrivFileName] = useState<string>('');
  
  const privateKey = internalPrivateKey || providedPrivateKey;
  const privFileName = internalPrivFileName || (providedPrivateKey ? 'Auto-generated Key' : '');
  
  const [internalHybridPayload, setInternalHybridPayload] = useState<HybridPayload | null>(null);
  const [internalEncFileName, setInternalEncFileName] = useState<string>('');
  
  const hybridPayload = internalHybridPayload || providedPayload;
  const encFileName = internalEncFileName || (providedPayload ? `Link: ${providedPayload.filename}` : '');
  
  const [originalFileNameDecrypted, setOriginalFileNameDecrypted] = useState<string>('decrypted_file.txt');
  
  const [decryptedText, setDecryptedText] = useState<string>('');
  const [webrtcStatus, setWebrtcStatus] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const onDropPriv = (files: File[]) => {
    const file = files[0];
    if (file) {
      setInternalPrivFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const key = JSON.parse(e.target?.result as string);
          if (key.S && key.G && key.P) setInternalPrivateKey(key);
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
      setInternalEncFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.ciphertexts && data.iv && data.encryptedPayload) {
            setInternalHybridPayload(data);
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

  const handleScan = (result: any) => {
    if (result && result.length > 0 && result[0].rawValue) {
      const scannedUrl = result[0].rawValue;
      try {
        const hashIndex = scannedUrl.indexOf('#');
        if (hashIndex !== -1) {
          const hash = scannedUrl.substring(hashIndex);
          if (hash.startsWith('#decrypt=')) {
            const compressed = hash.substring(9);
            const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
            if (decompressed) {
              const data = JSON.parse(decompressed);
              if (data.privateKey && data.payload) {
                setInternalPrivateKey(data.privateKey);
                setInternalHybridPayload(data.payload);
                setOriginalFileNameDecrypted(data.payload.filename || 'decrypted_file.txt');
                setIsScanning(false);
              }
            }
          } else if (hash.startsWith('#webrtc=')) {
            const compressed = hash.substring(8);
            const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
            if (decompressed) {
              const data = JSON.parse(decompressed);
              if (data.privateKey && data.peerId) {
                setInternalPrivateKey(data.privateKey);
                // We fake passing a providedPeerId by explicitly triggering the WebRTC connection
                // but since providedPeerId is a prop, we can instead handle it directly or add an internal state for peer ID.
                setInternalPeerId(data.peerId);
                setIsScanning(false);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to parse scanned QR code:", err);
      }
    }
  };

  const [internalPeerId, setInternalPeerId] = useState<string | null>(null);
  const activePeerId = providedPeerId || internalPeerId;

  useEffect(() => {
    // Auto-decrypt when we have both payload and key from deep-links or WebRTC
    if (hybridPayload && privateKey && !decryptedText && !isDecrypting && (providedPayload || activePeerId || internalHybridPayload)) {
      setWebrtcStatus('Executing automatic decryption...');
      handleDecrypt().then(() => {
        setWebrtcStatus('');
      });
    } else if ((hybridPayload || activePeerId) && !decryptedText) {
      if (!hybridPayload) {
        setWebrtcStatus('Waiting for payload data...');
      } else if (!privateKey) {
        setWebrtcStatus('Waiting for private key...');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hybridPayload, privateKey, providedPayload, activePeerId, internalHybridPayload, isDecrypting]);

  useEffect(() => {
    if (activePeerId && !internalHybridPayload && !providedPayload) {
      setWebrtcStatus('Connecting to desktop...');
      import('peerjs').then(({ default: Peer }) => {
        const peer = new Peer();
        peer.on('open', () => {
          const conn = peer.connect(activePeerId);
          conn.on('open', () => {
            setWebrtcStatus('Connected! Downloading file...');
          });
          conn.on('data', (data: any) => {
            try {
              const payload = typeof data === 'string' ? JSON.parse(data) : data;
              setInternalHybridPayload(payload);
              setOriginalFileNameDecrypted(payload.filename || 'decrypted_file.txt');
              setWebrtcStatus('');
            } catch (e) {
              console.error(e);
              setWebrtcStatus('Error parsing received file.');
            }
          });
          conn.on('error', (err) => {
            console.error(err);
            setWebrtcStatus('Connection failed.');
          });
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePeerId]);

  const base64ToArrayBufferAsync = async (base64: string): Promise<ArrayBuffer> => {
    const res = await fetch(`data:application/octet-stream;base64,${base64}`);
    return await res.arrayBuffer();
  };

  const handleDecrypt = async () => {
    if (!privateKey || !hybridPayload) return;
    
    if (!window.crypto || !window.crypto.subtle) {
      alert("Error: Decryption requires a secure context (HTTPS or localhost). Since you are accessing this on a local IP via HTTP, the browser disables cryptography. Please deploy the app or use a tunneling service like ngrok to test on mobile.");
      setWebrtcStatus("Decryption blocked: Insecure HTTP connection.");
      return;
    }

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
      setWebrtcStatus('');
    } catch(err) {
      alert("Decryption failed. Incorrect private key or corrupted data.");
      console.error(err);
      setWebrtcStatus('Decryption failed.');
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
        <CardTitle className="text-xl text-primary font-mono tracking-tight flex items-center justify-between">
          <span>Decrypt Data</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsScanning(!isScanning)}
            className={`font-mono text-xs border-primary text-primary hover:bg-primary/20 ${isScanning ? 'bg-primary/20' : 'bg-transparent'}`}
          >
            <QrCode className="w-4 h-4 mr-2" />
            {isScanning ? "CANCEL SCAN" : "SCAN QR CODE"}
          </Button>
        </CardTitle>
        <CardDescription className="text-muted-foreground font-sans">
          Upload a hybrid-encrypted packet and your private key, or scan a QR code from another device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {isScanning && (
          <div className="w-full max-w-sm mx-auto overflow-hidden rounded-lg border-2 border-primary">
            <Scanner 
              onScan={handleScan} 
              onError={(error: any) => {
                console.error(error);
                if (error?.name === 'NotAllowedError') {
                  alert("Camera access denied! Please allow camera permissions in your browser settings to scan QR codes.");
                }
              }} 
            />
            <p className="text-center text-xs text-primary mt-2 mb-2 font-mono">Point your camera at the QR Code...</p>
          </div>
        )}

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

        {webrtcStatus && (
          <div className="w-full p-4 border border-primary/50 bg-primary/10 rounded text-center animate-pulse">
            <p className="font-mono text-primary font-bold">{webrtcStatus}</p>
          </div>
        )}

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
                              const decodedText = decodeURIComponent(escape(atob(base64Data)));
                              return (
                                <div className="space-y-4">
                                  <div>{decodedText}</div>
                                  {decodedText.length < 2500 && (
                                    <div className="mt-4 flex flex-col items-center justify-center p-4 bg-white rounded border border-border w-fit mx-auto">
                                      <p className="text-xs text-black mb-2 font-bold font-sans">Scan to read message</p>
                                      <QRCodeSVG value={decodedText} size={200} />
                                    </div>
                                  )}
                                </div>
                              );
                            } catch (e) {
                              return "Preview not available.";
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    {/* Show a preview if it's a PDF file! */}
                    {(decryptedText.includes('application/pdf') || originalFileNameDecrypted.endsWith('.pdf')) && (
                      <div className="mt-4 w-full text-left border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground font-mono mb-2">PDF PREVIEW:</p>
                        <iframe src={decryptedText} className="w-full h-96 border border-border rounded bg-white" title="PDF Preview" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#0e0e0f] border border-border rounded font-mono text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {decryptedText}
                    </div>
                    {decryptedText.length < 2500 && (
                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded border border-border w-fit mx-auto">
                        <p className="text-xs text-black mb-2 font-bold font-sans">Scan to read message</p>
                        <QRCodeSVG value={decryptedText} size={200} />
                      </div>
                    )}
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
