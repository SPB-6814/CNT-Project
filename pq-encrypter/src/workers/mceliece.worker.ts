import { generateKeys, encrypt, decrypt, textToBinaryVectors, binaryVectorsToText, Matrix, KeyPair } from '../lib/mceliece';

export type WorkerMessage = 
  | { type: 'GENERATE_KEYS' }
  | { type: 'ENCRYPT', payload: { publicKey: { G_hat: Matrix }, text: string } }
  | { type: 'DECRYPT', payload: { privateKey: { S: Matrix, G: Matrix, P: Matrix }, ciphertexts: Matrix[] } };

export type WorkerResponse = 
  | { type: 'KEYS_GENERATED', payload: KeyPair }
  | { type: 'ENCRYPTED', payload: { ciphertexts: Matrix[] } }
  | { type: 'DECRYPTED', payload: { text: string } }
  | { type: 'ERROR', payload: { message: string } };

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  try {
    switch (event.data.type) {
      case 'GENERATE_KEYS': {
        const keys = generateKeys();
        self.postMessage({ type: 'KEYS_GENERATED', payload: keys });
        break;
      }
      case 'ENCRYPT': {
        const { publicKey, text } = event.data.payload;
        const vectors = textToBinaryVectors(text);
        
        // Add a small artificial delay to simulate heavy computation for the UI
        setTimeout(() => {
          const ciphertexts = vectors.map(v => encrypt(publicKey, v));
          self.postMessage({ type: 'ENCRYPTED', payload: { ciphertexts } });
        }, 500);
        break;
      }
      case 'DECRYPT': {
        const { privateKey, ciphertexts } = event.data.payload;
        
        // Add a small artificial delay to simulate heavy computation for the UI
        setTimeout(() => {
          const decryptedVectors = ciphertexts.map(c => decrypt(privateKey, c));
          const text = binaryVectorsToText(decryptedVectors);
          self.postMessage({ type: 'DECRYPTED', payload: { text } });
        }, 500);
        break;
      }
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', payload: { message: (error as Error).message } });
  }
};
