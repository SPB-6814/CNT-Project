import { Matrix, multiplyMatrices, randomPermutationMatrix, randomNonSingularMatrix, getInverse, transpose } from './gf2';
export type { Matrix };

// Standard Systematic Generator Matrix for [7,4] Hamming Code over GF(2)
// This is a k x n matrix, where k=4, n=7
export const G_HAMMING: Matrix = [
  [1, 0, 0, 0, 0, 1, 1],
  [0, 1, 0, 0, 1, 0, 1],
  [0, 0, 1, 0, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1]
];

// Parity Check Matrix H for [7,4]
// H = [P^T | I_(n-k)] where G = [I_k | P]
// P = 
// 0 1 1
// 1 0 1
// 1 1 0
// 1 1 1
// P^T = 
// 0 1 1 1
// 1 0 1 1
// 1 1 0 1
// H = [P^T | I_3]
export const H_HAMMING: Matrix = [
  [0, 1, 1, 1, 1, 0, 0],
  [1, 0, 1, 1, 0, 1, 0],
  [1, 1, 0, 1, 0, 0, 1]
];

// Syndrome table maps syndrome (as integer) to error vector
const syndromeTable: { [key: number]: number[] } = {
  0: [0, 0, 0, 0, 0, 0, 0],
  3: [1, 0, 0, 0, 0, 0, 0], // col 0
  5: [0, 1, 0, 0, 0, 0, 0], // col 1
  6: [0, 0, 1, 0, 0, 0, 0], // col 2
  7: [0, 0, 0, 1, 0, 0, 0], // col 3
  4: [0, 0, 0, 0, 1, 0, 0], // col 4
  2: [0, 0, 0, 0, 0, 1, 0], // col 5
  1: [0, 0, 0, 0, 0, 0, 1]  // col 6
};

function getSyndromeInt(syndrome: Matrix): number {
  // syndrome is 1x3
  return (syndrome[0][0] << 2) | (syndrome[0][1] << 1) | syndrome[0][2];
}

export function decodeHamming(c: Matrix): Matrix {
  // c is 1x7
  // Compute syndrome s = c * H^T
  const H_T = transpose(H_HAMMING);
  const s = multiplyMatrices(c, H_T); // 1x3
  const sInt = getSyndromeInt(s);
  
  const error = syndromeTable[sInt];
  if (!error) {
    throw new Error("Uncorrectable error in Hamming decoding");
  }
  
  // Correct error
  const corrected = [c[0].map((val, i) => (val + error[i]) % 2)];
  
  // Extract message (first 4 bits since systematic)
  return [corrected[0].slice(0, 4)];
}

export type KeyPair = {
  publicKey: {
    G_hat: Matrix;
  };
  privateKey: {
    S: Matrix;
    G: Matrix;
    P: Matrix;
  };
};

export function generateKeys(): KeyPair {
  const S = randomNonSingularMatrix(4);
  const P = randomPermutationMatrix(7);
  
  // G_hat = S * G * P
  const SG = multiplyMatrices(S, G_HAMMING);
  const G_hat = multiplyMatrices(SG, P);
  
  return {
    publicKey: { G_hat },
    privateKey: { S, G: G_HAMMING, P }
  };
}

export function encrypt(publicKey: { G_hat: Matrix }, message: Matrix): Matrix {
  // message is 1x4
  // c_prime = m * G_hat
  const c_prime = multiplyMatrices(message, publicKey.G_hat);
  
  // Generate random error vector of weight 1
  const error = Array(7).fill(0);
  error[Math.floor(Math.random() * 7)] = 1;
  
  // c = c_prime + e
  const c = [c_prime[0].map((val, i) => (val + error[i]) % 2)];
  return c;
}

export function decrypt(privateKey: { S: Matrix, G: Matrix, P: Matrix }, ciphertext: Matrix): Matrix {
  // ciphertext is 1x7
  // 1. Compute c_hat = c * P^-1
  const P_inv = getInverse(privateKey.P);
  const c_hat = multiplyMatrices(ciphertext, P_inv);
  
  // 2. Decode c_hat using Hamming decoding to get m_hat
  const m_hat = decodeHamming(c_hat);
  
  // 3. Compute m = m_hat * S^-1
  const S_inv = getInverse(privateKey.S);
  const m = multiplyMatrices(m_hat, S_inv);
  
  return m;
}

export function textToBinaryVectors(text: string): Matrix[] {
  const vectors: Matrix[] = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Convert to 8 bits, then split into two 4-bit vectors
    const bits = charCode.toString(2).padStart(8, '0').split('').map(Number);
    vectors.push([bits.slice(0, 4)]);
    vectors.push([bits.slice(4, 8)]);
  }
  return vectors;
}

export function binaryVectorsToText(vectors: Matrix[]): string {
  let text = "";
  for (let i = 0; i < vectors.length; i += 2) {
    if (i + 1 >= vectors.length) break;
    const v1 = vectors[i][0];
    const v2 = vectors[i+1][0];
    const bits = [...v1, ...v2];
    const charCode = parseInt(bits.join(''), 2);
    text += String.fromCharCode(charCode);
  }
  return text;
}
