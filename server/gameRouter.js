import { Router } from "express";
export const gameRouter = Router();
import dotenv from "dotenv";
dotenv.config();
import pool from "./database.js";

//to find the ongoing game and send the gameID
gameRouter.get("/active", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id,endat FROM "Game" WHERE status = 'ONGOING' AND (whiteplayerid = $1 OR blackplayerid = $1) ORDER BY startat DESC`,
    [req.session.user.userId],
  );

  if (!rows.length) {
    res.status(400).json({ success: false, message: "Game not found" });
    return;
  }

  const ongoingGame = rows[0];

  if (Date.now() >= new Date(ongoingGame.endat).getTime()) {
    return res
      .status(400)
      .json({ success: false, message: "Game ended already" });
  }

  return res.status(200).json({
    success: true,
    gameID: ongoingGame.id,
  });
});
