import express, { Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { Client } from "discord.js";
import { logger } from "../logger";
import { sendDM } from "../discord/command";

interface ServerOptions {
	port: number;
	discordClient: Client;
}

export function startWebServer(options: ServerOptions) {
	const app = express();
	const httpServer = createServer(app);

	app.use(express.static(path.join(__dirname, "public")));
	app.use(express.json()); // Enable JSON body parsing

	app.get('/log.log', (req: Request, res: Response) => {
		res.sendFile(path.join(process.cwd(), 'log.log'));
	});

	app.post('/send-dm', async (req: Request, res: Response) => {
		const { userId, message } = req.body;
		if (!userId || !message) {
			return res.status(400).json({ status: 'Error', error: 'User ID and message are required.' });
		}

		const result = await sendDM(options.discordClient, userId, message);
		if (result.success) {
			res.json({ status: 'DM sent successfully.' });
		} else {
			res.status(500).json({ status: 'Error', error: result.error });
		}
	});

	httpServer.listen(options.port, () => {
		logger.log(`Web interface listening on http://localhost:${options.port}`);
	});
}
