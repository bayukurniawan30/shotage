/**
 * Compresses a UTF-8 string to a base64-encoded gzip binary string using native CompressionStream.
 * Prefixes with 'gz:' for explicit identification.
 * Falls back to raw string if CompressionStream is not supported.
 */
export async function compressGzipString(input: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') {
    return input;
  }
  try {
    const stream = new Blob([input]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const response = new Response(compressedStream);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Efficient binary to base64 conversion using safe chunking
    let binary = '';
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[]
      );
    }
    return `gz:${btoa(binary)}`;
  } catch (err) {
    console.warn('Gzip compression failed, falling back to uncompressed string:', err);
    return input;
  }
}

/**
 * Decompresses a gzip base64 string (prefixed with 'gz:') or returns raw JSON string if uncompressed.
 * Ensures 100% backward compatibility with legacy shared designs.
 */
export async function decompressGzipString(input: string): Promise<string> {
  if (!input || typeof input !== 'string') return input;

  // Backward compatibility: If it's a plain JSON object or string without 'gz:' prefix
  if (input.trim().startsWith('{') || !input.startsWith('gz:')) {
    return input;
  }

  if (typeof DecompressionStream === 'undefined') {
    console.warn('DecompressionStream not supported in this environment.');
    return input;
  }

  try {
    const base64Data = input.slice(3); // Remove 'gz:' prefix
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const stream = new Blob([bytes]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    return await new Response(decompressedStream).text();
  } catch (err) {
    console.warn('Gzip decompression failed:', err);
    return input;
  }
}
