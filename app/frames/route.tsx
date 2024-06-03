/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next";
import {
  frames,
  getHostName,
} from "../frames";

const handleRequest = frames(async (ctx: any) => {
  const timestamp = `${Date.now()}`;
  const baseRoute = getHostName() + "/frames?ts=" + timestamp;
  const top = ctx.searchParams?.top;
  const mid = ctx.searchParams?.mid;
  const bot = ctx.searchParams?.bot;

  let imagePath = getHostName() + `/image?ts=${timestamp}`
  let postRoute = baseRoute + `&top=${timestamp}`
  let buttonText = "Do Not Push 🛑"

  if (top) {
    imagePath += '&top=' + top
    postRoute = baseRoute + `&top=${top}&mid=${timestamp}`
    buttonText = "Seriously, DO NOT PUSH!"
  }
  if (mid) {
    imagePath += '&mid=' + mid
    postRoute = baseRoute + `&top=${top}&mid=${mid}&bot=${timestamp}`
    buttonText = "Last Chance, DO NOT PUSH!"
  }
  if (bot) {
    imagePath += '&bot=' + bot
    buttonText = "Share"
  }

  return {
    image: imagePath,
    imageOptions: {
      aspectRatio: "1:1"
    },
    buttons: [
      <Button action="post" target = {postRoute}>{buttonText}</Button>
    ]
  }
})

export const GET = handleRequest;
export const POST = handleRequest;