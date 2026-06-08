/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const b64 = Buffer.from('Hello World').toString('base64');
const dataUrl = `data:text/plain;base64,${b64}`;

const textToBinaryVectors = (text) => {
  const vectors = [];
  const safeText = unescape(encodeURIComponent(text));
  for (let i = 0; i < safeText.length; i++) {
    const charCode = safeText.charCodeAt(i);
    const bits = charCode.toString(2).padStart(8, '0').split('').map(Number);
    vectors.push([bits.slice(0, 4)]);
    vectors.push([bits.slice(4, 8)]);
  }
  return vectors;
};

const binaryVectorsToText = (vectors) => {
  let text = "";
  for (let i = 0; i < vectors.length; i += 2) {
    if (i + 1 >= vectors.length) break;
    const v1 = vectors[i][0];
    const v2 = vectors[i+1][0];
    const bits = [...v1, ...v2];
    const charCode = parseInt(bits.join(''), 2);
    text += String.fromCharCode(charCode);
  }
  return decodeURIComponent(escape(text));
};

const vectors = textToBinaryVectors(dataUrl);
const decrypted = binaryVectorsToText(vectors);

console.log("Original:", dataUrl);
console.log("Decrypted:", decrypted);
console.log("Match:", dataUrl === decrypted);
