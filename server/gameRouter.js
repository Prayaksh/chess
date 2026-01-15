import express, { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
export const gameRouter = Router();

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

gameRouter.use("/ws", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../user/dist/index.html"));
});
