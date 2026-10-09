/** Download a validated copy so exports do not depend on remote image CORS later. */
export async function loadRemoteImage(input: string, signal: AbortSignal): Promise<string> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('Enter a valid image URL.');
  }
  if (!['https:', 'http:'].includes(url.protocol))
    throw new Error('Use an HTTP or HTTPS image URL.');
  const response = await fetch(url.href, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error(`The image URL returned an error (${response.status}).`);
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('image/')) {
    throw new Error('This URL does not return an image. Use a direct image link, not a webpage.');
  }
  const blob = await response.blob();
  if (!blob.size || blob.size > 50 * 1024 * 1024)
    throw new Error('Use an image smaller than 50 MB.');
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read the downloaded image.'));
    reader.readAsDataURL(blob);
  });
  const image = new Image();
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error('The URL returned an invalid or unsupported image.');
  }
  if (!image.naturalWidth || !image.naturalHeight)
    throw new Error('This image has no valid dimensions.');
  signal.throwIfAborted();
  return source;
}
