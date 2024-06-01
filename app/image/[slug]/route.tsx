import { NextRequest, NextResponse } from 'next/server';
const { GIFEncoder, applyPalette, quantize } = require('gifenc');
import path from 'path'

const { promisify } = require("util");
const getPixels = promisify(require("get-pixels"));

async function readImage(file: string) {
  const { data, shape } = await getPixels(file);
  let width, height;
  if (shape.length === 3) {
    // PNG,JPG,etc...
    width = shape[0];
    height = shape[1];
  } else if (shape.length === 4) {
    // still GIFs might appear in frames, so [N,w,h]
    width = shape[1];
    height = shape[2];
  } else {
    throw new Error("Invalid shape " + shape.join(", "));
  }
  return { data, width, height };
}

function reshapeArray1DTo2D(arr: Uint8Array, rows: number, cols: number) {
    if (arr.length !== rows * cols) {
        throw new Error("The total number of elements does not match the specified dimensions.");
    }

    let reshapedArray = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            row.push(arr[i * cols + j]);
        }
        reshapedArray.push(row);
    }
    return reshapedArray;
}

const cropImage = (
  reshaped: number[][],
  x: number,
  y: number,
  croppedWidth: number,
  croppedHeight: number
) => {
  const output = new Uint8Array(croppedHeight * croppedWidth)
  let pos = 0
  for (let i = 0; i < croppedHeight; i++) {
    for (let j = 0; j < croppedWidth; j++) {
      output[pos++] = reshaped[y + i][x + j]
    }
  }
  return output
};

export async function GET(
   req: NextRequest,
   { params }: { params: { slug: string}}
) {
  //const searchParams = req.nextUrl.searchParams

  const imageFiles = [
    "public/ghost.png",
    "public/sea-monster.png",
    //"public/square_green.png",
    //"public/square_blue.png",
  ]
  const imageBuffers = []
  const imagePalettes = []

  let combinedPaletteLength = 0
  const imgWidth = 800, imgHeight = 800

  for (let i = 0; i < imageFiles.length; i++) {
    const fullPath = path.join(process.cwd(), imageFiles[i]);
    const { data } = await readImage(fullPath)
    const palette = quantize(data, 32);
    const index = applyPalette(data, palette, 'rgb444')
    for (let j = 0; j < index.length; j++) {
      index[j] += combinedPaletteLength
    }
    imageBuffers.push(index);
    imagePalettes.push(palette)
    combinedPaletteLength += palette.length
  }

  const palette = imagePalettes.flat()
  palette.push([0, 0, 0])

  //
  imageBuffers.push(imageBuffers[0])
  const images = imageBuffers

  // Create a buffer that has all images side-by-side
  const fullWidth = imgWidth * images.length
  const fullHeight = imgHeight
  const full = new Uint8Array(fullWidth * fullHeight)
  let pos = 0

  for (let i = 0; i < imgHeight; i++) {
    images.forEach(img => {
      for (let j = 0; j < imgWidth; j++) {
        full[pos++] = img[(i * imgHeight) + j]
      }
    })
  }
  const reshaped = reshapeArray1DTo2D(full, fullHeight, fullWidth)
  
  // Compute positions for the strips
  const frm = new Uint8Array(imgWidth * imgHeight)
  const blank = new Uint8Array(800 * 200).fill(palette.length - 1)

  const gif = GIFEncoder()
  for (let i = 0; i < (fullWidth - 800) / 10; i++) {
    const a = cropImage(reshaped, 0, 0, imgWidth, 200)
    const b = cropImage(reshaped, i * 10, 200, imgWidth, 200)
    const c = blank
    const d = blank
    //const c = cropImage(reshaped, 1600, 400, imgWidth, 200)
    //const d = cropImage(reshaped, 0, 600, imgWidth, 200)
    frm.set(a, 0);
    frm.set(b, a.length);
    frm.set(c, a.length + b.length);
    frm.set(d, a.length + b.length + c.length);
    gif.writeFrame(frm, imgWidth, imgHeight, { palette, delay: 20 })
  }
  //gif.writeFrame(full, fullWidth, fullHeight, { palette })
  gif.finish()

  const response = new NextResponse(gif.bytesView());
  response.headers.set("content-type", "image/gif");
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}