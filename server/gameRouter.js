import { Router } from "express";

export const gameRouter = Router();

gameRouter.use("/ws", (req, res) => {
  //connection with the game resides here
});
