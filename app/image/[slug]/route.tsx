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
  const images = [index1, index2, index3]

  // Create a buffer that has all 3 side-by-side
  const full = new Uint8Array(width1 * 3 * height1)
  let pos = 0

  for (let i = 0; i < height1; i++) {
    images.forEach(img => {
      for (let j = 0; j < width1; j++) {
        full[pos++] = img[(i * height1) + j]
      }
    })
  }

  const gif = GIFEncoder()
  // Write the full buffer as a frame
  //gif.writeFrame(full, width1 * 3, height1, { palette, delay: 500 })
  gif.writeFrame(full, width1 * 3, height1, { palette })
  gif.finish()

  const response = new NextResponse(gif.bytesView());
  response.headers.set("content-type", "image/gif");
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}