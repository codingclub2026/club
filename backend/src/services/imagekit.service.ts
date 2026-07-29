import ImageKit from 'imagekit';
import { env } from '../config/env';

let imagekit: ImageKit | null = null;

if (env.IMAGEKIT_PUBLIC_KEY && env.IMAGEKIT_PRIVATE_KEY && env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });
}

export async function uploadToImageKit(
  fileBase64: string,
  fileName: string,
  folder: 'posters' | 'payment_qrs' | 'payment_proofs'
): Promise<string> {
  if (!imagekit) {
    throw new Error('ImageKit credentials are not configured in backend environment variables.');
  }

  const response = await imagekit.upload({
    file: fileBase64,
    fileName: `${Date.now()}_${fileName}`,
    folder: `/codeved/${folder}`,
  });

  return response.url;
}
