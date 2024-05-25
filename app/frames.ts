import { farcasterHubContext } from "frames.js/middleware";
import { createFrames } from "frames.js/next";
import { headers } from "next/headers";

//-------------------------------------------------------------------
// Utility functions
//-------------------------------------------------------------------

export const getHostName = (): string => {
  if (process.env['HOST']) {
    return process.env['HOST']
  }
  const headersList = headers();
  const host = headersList.get('x-forwarded-host');
  const proto = headersList.get('x-forwarded-proto');
  return `${proto}://${host}`;
}

const getHubRoute = (): string => {
  if (process.env['VERCEL_REGION']) {
    return 'https://nemes.farcaster.xyz:2281'
  }
  return 'http://localhost:3010/hub'
}

export const encodeCells = (cells: boolean[][]): string => {
  return Buffer.from(
    cells
      .flat()
      .map((b) => (b ? 1 : 0))
      .reduce((acc: number[], bit, index) => {
        const byteIndex = Math.floor(index / 8);
        acc[byteIndex] = (acc[byteIndex] || 0) | (bit << (7 - (index % 8)));
        return acc;
      }, [])
  ).toString("base64");
}

export const encodeColor = (color: Color): string => {
  return (
    color.red.toString(16).padStart(2, "0") +
    color.green.toString(16).padStart(2, "0") +
    color.blue.toString(16).padStart(2, "0")
  );
};

export const decodeCells = (
  encoded: string,
  rows: number,
  cols: number
): boolean[][] => {

  while (encoded.length % 4 != 0) {
    encoded += '='
  }

  const buffer = Buffer.from(encoded, "base64");
  const bytes = new Uint8Array(buffer)

  // Convert buffer to boolean array
  const boolArray: boolean[] = new Array(rows*cols).fill(false);
  let pos = 0
  bytes.forEach(byte => {
    // Process each byte to get 8 boolean values
    for (let j = 7; j >= 0; j--) {
      boolArray[pos++] = (byte & (1 << j)) !== 0;
    }
  })

  // Check if the dimensions match the desired output
  const result: boolean[][] = [];
  for (let i = 0; i < rows; i++) {
    const start = i * cols;
    const row = boolArray.slice(start, start + cols);
    result.push(row);
  }
  return result;
};

export const decodeColor = (colorString: string | null): Color => {
  if (colorString == null) {
    return {
      red: 12,
      green: 134,
      blue: 192
    }
  }
  const num = parseInt(colorString, 16)
  return {
    red: (num >> 16) & 0xFF,
    green: (num >> 8) & 0xFF,
    blue: num & 0xFF
  }
}

//-------------------------------------------------------------------
// Frame setup
//-------------------------------------------------------------------

export type Color = {
  red: number;
  green: number;
  blue: number;
}

export type State = {
  cells: boolean[][];
  count: number;
  color: Color;
}
 
export const frames = createFrames<State>({
  middleware: [farcasterHubContext({
    hubHttpUrl: getHubRoute()
  })],
  initialState: {
    cells: [],
    count: 0,
    color: decodeColor(null)
  }
});