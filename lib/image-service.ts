import path from 'path';
import fs from 'fs/promises';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Uploads an image buffer to the local filesystem.
 * @param buffer The image buffer to save.
 * @param filename The desired filename for the image.
 * @returns A promise that resolves to the public URL of the saved image.
 */
export async function uploadImage(buffer: Buffer, filename: string): Promise<string> {
  try {
    // Ensure the uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.writeFile(filePath, buffer);

    // Return the public URL of the image
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Failed to save image:', error);
    throw new Error('Image could not be saved.');
  }
}

