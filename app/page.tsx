import { fetchMetadata } from "frames.js/next";
import { getHostName } from "./frames";

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ searchParams }: Props) {
  const routeUrl = new URL("/frames", getHostName())

  for (let key in searchParams) {
    let value = searchParams[key];
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(val => routeUrl.searchParams.append(key, val));
      } else {
        routeUrl.searchParams.append(key, value);
      }
    }
  }

  const metaData = await fetchMetadata(routeUrl);
  return {
    title: "Frame of Life",
    description: "Conway's Game of Life in a Frame",
    metadataBase: new URL(getHostName()),
    other: metaData,
  };
}

export default async function Page() {
  return (
    <div className="pl-4 pt-4">
      <center>
      <h1 className="pb-2 text-4xl">Frame of Life <span className="text-2xl">by MassHesteria</span></h1>
      <div>
        <a className="text-red-600 text-2xl no-underline hover:underline pr-8" href="https://github.com/masshesteria/frame-of-life">Source code</a>
        <a className="text-purple-600 text-2xl no-underline hover:underline" href="https://warpcast.com/masshesteria/0x3c45cf6b">Original cast</a>
      </div>
      <img className="mt-4 border border-black" alt="Dart" src="/image/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAoAACIAADgAAAAAAxgAEUQAYowBBQQBatAAAAAAAAAA=="></img>
      </center>
    </div>
  )
}
