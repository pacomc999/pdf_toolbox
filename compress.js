// compress.js
// Makes a PDF smaller by shrinking the pictures inside it (scans, photos).
// Text, fonts and drawings are left untouched, so text stays sharp,
// selectable and searchable. Works on a pdf-lib PDFDocument (PDFLib global).
//
// How: every picture in the file is decoded with the browser's own image
// tools, scaled down if it is very large, and saved again as a JPEG at a
// lower quality. A picture is only replaced when the new one is smaller.


// ---------- Levels ----------
// longestSide: pictures larger than this many pixels are scaled down.
// quality: JPEG quality from 0 to 1 (lower is smaller and blurrier).
const COMPRESSION_LEVELS = {
  medium: { longestSide: 1800, quality: 0.72 },
  small: { longestSide: 1200, quality: 0.5 },
};


// ---------- The main step ----------

// Shrinks every picture it can in the document.
// Gives back how many pictures were made smaller.
async function compressImages(pdfDoc, levelName) {
  const level = COMPRESSION_LEVELS[levelName];
  let shrunk = 0;
  for (const [ref, object] of findImages(pdfDoc)) {
    try {
      if (await shrinkImage(pdfDoc, ref, object, level)) shrunk++;
    } catch (error) {
      // A picture we cannot read is simply kept as it was
    }
  }
  return shrunk;
}

// All picture objects in the file, as [reference, object] pairs
function findImages(pdfDoc) {
  const { PDFName, PDFRawStream } = PDFLib;
  return pdfDoc.context.enumerateIndirectObjects().filter(([, object]) =>
    object instanceof PDFRawStream &&
    object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'));
}

// Shrinks one picture. Gives back true if it was replaced.
async function shrinkImage(pdfDoc, ref, image, level) {
  const info = readImageInfo(pdfDoc, image);
  if (!info) return false; // a kind of picture we leave alone

  const bitmap = await decodeImage(image, info);
  const jpeg = await encodeJpeg(bitmap, level);
  if (jpeg.bytes.length >= image.contents.length) return false; // not smaller: keep the original

  replaceImage(pdfDoc, ref, image, jpeg);
  return true;
}


// ---------- Reading a picture ----------

// Works out what kind of picture this is, or gives back null for kinds we
// skip: masks, unusual colours (CMYK, palettes), special decoding settings.
function readImageInfo(pdfDoc, image) {
  const { PDFName, PDFNumber } = PDFLib;
  const dict = image.dict;
  const get = (key) => pdfDoc.context.lookup(dict.get(PDFName.of(key)));

  if (get('ImageMask') || get('Decode')) return null;
  const width = get('Width') instanceof PDFNumber ? get('Width').asNumber() : 0;
  const height = get('Height') instanceof PDFNumber ? get('Height').asNumber() : 0;
  if (width < 64 || height < 64) return null; // tiny icons are not worth it

  const channels = colourChannels(pdfDoc, get('ColorSpace'));
  if (!channels) return null;

  const filter = filterName(get('Filter'));
  if (filter === 'DCTDecode') return { kind: 'jpeg', width, height, channels };
  const bits = get('BitsPerComponent');
  const simpleFlate = filter === 'FlateDecode' && !get('DecodeParms') &&
    bits instanceof PDFNumber && bits.asNumber() === 8;
  if (simpleFlate) return { kind: 'pixels', width, height, channels };
  return null;
}

// 3 for colour (RGB), 1 for grey, or null for colour spaces we skip
function colourChannels(pdfDoc, colourSpace) {
  const { PDFName, PDFArray, PDFNumber } = PDFLib;
  if (colourSpace === PDFName.of('DeviceRGB')) return 3;
  if (colourSpace === PDFName.of('DeviceGray')) return 1;
  // ICCBased: a colour profile; its N says how many channels
  if (colourSpace instanceof PDFArray && colourSpace.get(0) === PDFName.of('ICCBased')) {
    const profile = pdfDoc.context.lookup(colourSpace.get(1));
    const n = profile && profile.dict && pdfDoc.context.lookup(profile.dict.get(PDFName.of('N')));
    const count = n instanceof PDFNumber ? n.asNumber() : 0;
    return count === 3 || count === 1 ? count : null;
  }
  return null;
}

// The picture's compression, when there is exactly one
function filterName(filter) {
  const { PDFName, PDFArray } = PDFLib;
  if (filter instanceof PDFName) return filter.decodeText();
  if (filter instanceof PDFArray && filter.size() === 1) return filterName(filter.get(0));
  return null;
}


// ---------- Decoding and encoding ----------

// Turns the picture's bytes into something we can draw on a canvas
async function decodeImage(image, info) {
  if (info.kind === 'jpeg') {
    return createImageBitmap(new Blob([image.contents], { type: 'image/jpeg' }));
  }
  const pixels = await inflate(image.contents);
  return createImageBitmap(toImageData(pixels, info));
}

// Unpacks "FlateDecode" bytes with the browser's built in decompressor
async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Raw RGB or grey pixels into the RGBA layout a canvas uses
function toImageData(pixels, info) {
  const { width, height, channels } = info;
  if (pixels.length < width * height * channels) throw new Error('too few pixels');
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += channels) {
    rgba[i * 4] = pixels[p];
    rgba[i * 4 + 1] = pixels[channels === 3 ? p + 1 : p];
    rgba[i * 4 + 2] = pixels[channels === 3 ? p + 2 : p];
    rgba[i * 4 + 3] = 255;
  }
  return new ImageData(rgba, width, height);
}

// Draws the picture smaller (if it is large) and saves it as a JPEG
async function encodeJpeg(bitmap, level) {
  const scale = Math.min(1, level.longestSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff'; // JPEG has no see-through parts
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', level.quality));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}


// ---------- Putting it back ----------

// Swaps the old picture for the new JPEG under the same reference, so every
// page that shows it now shows the smaller one. A see-through mask (SMask),
// if any, is kept as it was.
function replaceImage(pdfDoc, ref, oldImage, jpeg) {
  const { PDFName } = PDFLib;
  const settings = {
    Type: 'XObject',
    Subtype: 'Image',
    Width: jpeg.width,
    Height: jpeg.height,
    ColorSpace: 'DeviceRGB',
    BitsPerComponent: 8,
    Filter: 'DCTDecode',
  };
  const mask = oldImage.dict.get(PDFName.of('SMask'));
  if (mask) settings.SMask = mask;
  pdfDoc.context.assign(ref, pdfDoc.context.stream(jpeg.bytes, settings));
}


// ---------- Sizes for the status line ----------

// 1234567 bytes -> "1.2 MB"
function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
