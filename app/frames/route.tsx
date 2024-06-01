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

  if (top) {
    imagePath += '&top=' + top
    postRoute = baseRoute + `&top=${top}&mid=${timestamp}`
  }
  if (mid) {
    imagePath += '&mid=' + mid
    postRoute = baseRoute + `&top=${top}&mid=${mid}&bot=${timestamp}`
  }
  if (bot) {
    imagePath += '&bot=' + bot
  }

  return {
    image: imagePath,
    imageOptions: {
      aspectRatio: "1:1"
    },
    buttons: [
      <Button action="post" target = {postRoute}>👹</Button>
    ]
  }
})

export const GET = handleRequest;
export const POST = handleRequest;