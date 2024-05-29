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

  // Load the image
  let imgPath1 = path.join(process.cwd(), 'public/square_red.png');
  const { data: data1, width: width1, height: height1 } = await readImage(imgPath1)
  const palette1 = quantize(data1, 256);
  const index1 = applyPalette(data1, palette1, 'rgb444');

  let imgPath2 = path.join(process.cwd(), 'public/square_green.png');
  const { data: data2, width: width2, height: height2 } = await readImage(imgPath2)
  const palette2 = quantize(data2, 256);
  const index2 = applyPalette(data2, palette2, 'rgb444');

  let imgPath3 = path.join(process.cwd(), 'public/square_blue.png');
  const { data: data3, width: width3, height: height3 } = await readImage(imgPath3)
  const palette3 = quantize(data3, 356);
  const index3 = applyPalette(data3, palette3, 'rgb444');

  for (let i = 0; i < index2.length; i++) {
    index2[i] += palette1.length
  }

  for (let i = 0; i < index3.length; i++) {
    index3[i] += (palette1.length + palette2.length)
  }

  const palette = [palette1, palette2, palette3].flat()

  //
  const images = [index1, index2, index3, index1]

  // Create a buffer that has all 3 side-by-side
  const full = new Uint8Array(width1 * 4 * height1)
  let pos = 0

  for (let i = 0; i < height1; i++) {
    images.forEach(img => {
      for (let j = 0; j < width1; j++) {
        full[pos++] = img[(i * height1) + j]
      }
    })
  }
  const reshaped = reshapeArray1DTo2D(full, height1, width1 * 4)
  
  // Compute positions for the strips
  const topHeight = 267, midHeight = 267, botHeight = 266
  const midStart = topHeight, botStart = topHeight + midHeight
  const frmSize = width1 * height1

  const gif = GIFEncoder()
  for (let i = 0; i < 240; i++) {
    const top = cropImage(reshaped, i * 10, 0, width1, topHeight)
    const mid = cropImage(reshaped, 800, midStart, width1, midHeight)
    const bot = cropImage(reshaped, 1600, botStart, width1, botHeight)
    const frm = new Uint8Array(frmSize)
    frm.set(top, 0);
    frm.set(mid, top.length);
    frm.set(bot, top.length + mid.length);
    gif.writeFrame(frm, width1, height1, { palette, delay: 20 })
  }
  //gif.writeFrame(full, width1 * 3, height1, { palette })
  gif.finish()

  const response = new NextResponse(gif.bytesView());
  response.headers.set("content-type", "image/gif");
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}