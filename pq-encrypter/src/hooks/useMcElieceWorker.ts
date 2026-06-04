import { useEffect, useRef, useState, useCallback } from 'react';
import type { KeyPair, Matrix } from '../lib/mceliece';
import type { WorkerMessage, WorkerResponse } from '../workers/mceliece.worker';

export function useMcElieceWorker() {
  const workerRef = useRef<Worker>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Callbacks for promises
  const resolveGenerateRef = useRef<((keys: KeyPair) => void) | null>(null);
  const resolveEncryptRef = useRef<((ciphertexts: Matrix[]) => void) | null>(null);
  const resolveDecryptRef = useRef<((text: string) => void) | null>(null);
  const rejectRef = useRef<((reason?: any) => void) | null>(null);

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(new URL('../workers/mceliece.worker.ts', import.meta.url));

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      switch (data.type) {
        case 'KEYS_GENERATED':
          setIsGenerating(false);
          if (resolveGenerateRef.current) resolveGenerateRef.current(data.payload);
          break;
        case 'ENCRYPTED':
          setIsEncrypting(false);
          if (resolveEncryptRef.current) resolveEncryptRef.current(data.payload.ciphertexts);
          break;
        case 'DECRYPTED':
          setIsDecrypting(false);
          if (resolveDecryptRef.current) resolveDecryptRef.current(data.payload.text);
          break;
        case 'ERROR':
          setIsGenerating(false);
          setIsEncrypting(false);
          setIsDecrypting(false);
          if (rejectRef.current) rejectRef.current(new Error(data.payload.message));
          break;
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const generateKeys = useCallback((): Promise<KeyPair> => {
    setIsGenerating(true);
    return new Promise((resolve, reject) => {
      resolveGenerateRef.current = resolve;
      rejectRef.current = reject;
      const msg: WorkerMessage = { type: 'GENERATE_KEYS' };
      workerRef.current?.postMessage(msg);
    });
  }, []);

  const encrypt = useCallback((publicKey: { G_hat: Matrix }, text: string): Promise<Matrix[]> => {
    setIsEncrypting(true);
    return new Promise((resolve, reject) => {
      resolveEncryptRef.current = resolve;
      rejectRef.current = reject;
      const msg: WorkerMessage = { type: 'ENCRYPT', payload: { publicKey, text } };
      workerRef.current?.postMessage(msg);
    });
  }, []);

  const decrypt = useCallback((privateKey: { S: Matrix, G: Matrix, P: Matrix }, ciphertexts: Matrix[]): Promise<string> => {
    setIsDecrypting(true);
    return new Promise((resolve, reject) => {
      resolveDecryptRef.current = resolve;
      rejectRef.current = reject;
      const msg: WorkerMessage = { type: 'DECRYPT', payload: { privateKey, ciphertexts } };
      workerRef.current?.postMessage(msg);
    });
  }, []);

  return {
    isGenerating,
    isEncrypting,
    isDecrypting,
    generateKeys,
    encrypt,
    decrypt
  };
}
