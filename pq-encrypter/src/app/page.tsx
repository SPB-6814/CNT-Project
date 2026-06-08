'use client';

import React, { useState, useEffect } from 'react';
import LZString from 'lz-string';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyGenerationTab } from '@/components/KeyGenerationTab';
import { EncryptTab } from '@/components/EncryptTab';
import { DecryptTab } from '@/components/DecryptTab';
import { InternalsTab } from '@/components/InternalsTab';
import { Shield } from 'lucide-react';
import { Matrix, KeyPair } from '@/lib/mceliece';
import { useMcElieceWorker } from '@/hooks/useMcElieceWorker';
import { motion } from 'framer-motion';

export type SyncData = {
  mode: 'encrypt' | 'decrypt';
  publicKey?: { G_hat: Matrix };
  privateKey?: { S: Matrix, G: Matrix, P: Matrix };
  text?: string;
  ciphertexts?: Matrix[];
};

export default function Dashboard() {
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<KeyPair | null>(null);
  const [deepLinkPayload, setDeepLinkPayload] = useState<any>(null);
  const [deepLinkPeerId, setDeepLinkPeerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('keygen');

  useEffect(() => {
    // Check hash on mount for deep link
    const hash = window.location.hash;
    if (hash) {
      if (hash.startsWith('#decrypt=')) {
        try {
          const compressed = hash.substring(9);
          const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
          if (decompressed) {
            const data = JSON.parse(decompressed);
            if (data.privateKey && data.payload) {
              setGeneratedKeys({ publicKey: data.publicKey, privateKey: data.privateKey } as any);
              setDeepLinkPayload(data.payload);
              setActiveTab('decrypt');
              // Clean up the hash
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } catch (err) {
          console.error("Failed to parse deep link:", err);
        }
      } else if (hash.startsWith('#webrtc=')) {
        try {
          const compressed = hash.substring(8);
          const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
          if (decompressed) {
            const data = JSON.parse(decompressed);
            if (data.privateKey && data.peerId) {
              setGeneratedKeys({ publicKey: data.publicKey, privateKey: data.privateKey } as any);
              setDeepLinkPeerId(data.peerId);
              setActiveTab('decrypt');
              // Clean up the hash
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } catch (err) {
          console.error("Failed to parse webrtc link:", err);
        }
      }
    }
  }, []);

  const { 
    isGenerating, generateKeys, 
    isEncrypting, encrypt, 
    isDecrypting, decrypt 
  } = useMcElieceWorker();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.main 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-4xl mx-auto relative z-10"
      >
        
        {/* Header */}
        <header className="mb-12 flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center terminal-glow pulse-slow">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground tracking-tight">Post-Quantum Vault</h1>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              Client-side file encryption powered by the McEliece Cryptosystem
            </p>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border mb-8 p-1">
            <TabsTrigger 
              value="keygen" 
              className="font-mono text-xs md:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              KEY GENERATION
            </TabsTrigger>
            <TabsTrigger 
              value="encrypt"
              className="font-mono text-xs md:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              ENCRYPT
            </TabsTrigger>
            <TabsTrigger 
              value="decrypt"
              className="font-mono text-xs md:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              DECRYPT
            </TabsTrigger>
            <TabsTrigger 
              value="internals"
              className="font-mono text-xs md:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              INTERNALS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keygen" className="mt-0">
            <motion.div initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.4 }}>
              <KeyGenerationTab isGenerating={isGenerating} onGenerate={generateKeys} onKeysGenerated={setGeneratedKeys} />
            </motion.div>
          </TabsContent>

          <TabsContent value="encrypt" className="mt-0">
            <motion.div initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.4 }}>
              <EncryptTab isEncrypting={isEncrypting} onEncrypt={encrypt} onSync={setSyncData} providedPublicKey={generatedKeys?.publicKey} providedPrivateKey={generatedKeys?.privateKey} />
            </motion.div>
          </TabsContent>

          <TabsContent value="decrypt" className="mt-0">
            <motion.div initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.4 }}>
              <DecryptTab isDecrypting={isDecrypting} onDecrypt={decrypt} onSync={setSyncData} providedPrivateKey={generatedKeys?.privateKey} providedPayload={deepLinkPayload} providedPeerId={deepLinkPeerId} />
            </motion.div>
          </TabsContent>

          <TabsContent value="internals" className="mt-0">
            <motion.div initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.4 }}>
              <InternalsTab syncData={syncData} />
            </motion.div>
          </TabsContent>
        </Tabs>

      </motion.main>
    </div>
  );
}
