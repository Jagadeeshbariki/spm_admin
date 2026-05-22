import { PDFDocument } from 'pdf-lib';

/**
 * Compresses an image file by resizing (if too large) and re-encoding at a lower quality.
 */
export async function compressImage(file: File, maxDimension: number = 1600, quality: number = 0.6): Promise<{ compressedFile: File; originalSize: number; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2D context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with lower quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas export failed'));
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve({
              compressedFile: compressedFile.size < file.size ? compressedFile : file,
              originalSize: file.size,
              compressedSize: compressedFile.size < file.size ? compressedFile.size : file.size,
            });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses a PDF file using pdf-lib object stream compaction.
 */
export async function compressPDF(file: File): Promise<{ compressedFile: File; originalSize: number; compressedSize: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Save with stream compression and object structure compaction
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
    });
    
    const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
    
    const compressedFile = new File([compressedBlob], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    const isSmaller = compressedFile.size < file.size;

    return {
      compressedFile: isSmaller ? compressedFile : file,
      originalSize: file.size,
      compressedSize: isSmaller ? compressedFile.size : file.size,
    };
  } catch (error) {
    console.error('PDF stream compression failed, returning original:', error);
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }
}

/**
 * General compression dispatcher.
 */
export async function compressFile(file: File): Promise<{ compressedFile: File; originalSize: number; compressedSize: number; ratio: number }> {
  let result: { compressedFile: File; originalSize: number; compressedSize: number };
  
  if (file.type === 'application/pdf') {
    result = await compressPDF(file);
  } else if (file.type.startsWith('image/')) {
    result = await compressImage(file);
  } else {
    // No compression for other files
    result = {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  const ratio = result.originalSize > 0 
    ? Math.max(0, Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100))
    : 0;

  return {
    ...result,
    ratio,
  };
}
