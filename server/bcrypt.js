import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const password = "723097@Lumas";

const hashedPassword = await bcrypt.hash(password, 10);

console.log(process.env.GOOGLE_CLIENT_ID);
