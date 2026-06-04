export type Matrix = number[][];

export function addMatrices(A: Matrix, B: Matrix): Matrix {
  return A.map((row, i) => row.map((val, j) => (val + B[i][j]) % 2));
}

export function multiplyMatrices(A: Matrix, B: Matrix): Matrix {
  const m = A.length;
  const n = A[0].length;
  const p = B[0].length;
  const result: Matrix = Array(m).fill(0).map(() => Array(p).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum % 2;
    }
  }
  return result;
}

export function transpose(A: Matrix): Matrix {
  return A[0].map((_, colIndex) => A.map(row => row[colIndex]));
}

// Generate random permutation matrix of size n x n
export function randomPermutationMatrix(n: number): Matrix {
  const identity = Array(n).fill(0).map((_, i) => {
    const row = Array(n).fill(0);
    row[i] = 1;
    return row;
  });
  // Shuffle rows
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [identity[i], identity[j]] = [identity[j], identity[i]];
  }
  return identity;
}

export function getInverse(A: Matrix): Matrix {
  // Simple Gauss-Jordan elimination over GF(2)
  const n = A.length;
  const aug = A.map((row, i) => {
    const newRow = [...row];
    for (let j = 0; j < n; j++) {
      newRow.push(i === j ? 1 : 0);
    }
    return newRow;
  });

  for (let i = 0; i < n; i++) {
    // Find pivot
    if (aug[i][i] === 0) {
      let swapRow = -1;
      for (let j = i + 1; j < n; j++) {
        if (aug[j][i] === 1) {
          swapRow = j;
          break;
        }
      }
      if (swapRow === -1) throw new Error("Matrix is not invertible");
      // Swap
      [aug[i], aug[swapRow]] = [aug[swapRow], aug[i]];
    }

    // Eliminate
    for (let j = 0; j < n; j++) {
      if (i !== j && aug[j][i] === 1) {
        for (let k = i; k < 2 * n; k++) {
          aug[j][k] = (aug[j][k] + aug[i][k]) % 2;
        }
      }
    }
  }

  return aug.map(row => row.slice(n));
}

// Generate a random non-singular k x k matrix
export function randomNonSingularMatrix(k: number): Matrix {
  while (true) {
    const matrix = Array(k).fill(0).map(() => 
      Array(k).fill(0).map(() => Math.random() < 0.5 ? 0 : 1)
    );
    try {
      getInverse(matrix);
      return matrix;
    } catch {
      // Not invertible, try again
    }
  }
}
