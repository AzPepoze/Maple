import express, { Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { Client } from "discord.js";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { logger } from "./utils/logger";
import { sendDM } from "./discord/command";

interface ServerOptions {
	port: number;
	discordClient: Client;
}

export function startWebServer(options: ServerOptions) {
	const app = express();
	const httpServer = createServer(app);

	app.use(express.static(path.join(__dirname, "..", "..", "dist", "frontend")));
	app.use(express.json()); // Enable JSON body parsing

	const swaggerOptions = {
		swaggerDefinition: {
			openapi: "3.0.0",
			info: {
				title: "Maple Backend API",
				version: "1.0.0",
				description: "API documentation for the Maple Backend.",
			},
			servers: [
				{ url: "http://localhost:3000" }, // Assuming default port 3000
			],
		},
		apis: ["dist/backend/server.js"], // Path to the API routes file
	};

	const swaggerSpec = swaggerJSDoc(swaggerOptions);

	app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

	/**
	 * @swagger
	 * /log.log:
	 *   get:
	 *     summary: Get application logs
	 *     description: Retrieves the content of the application log file.
	 *     responses:
	 *       200:
	 *         description: Successfully retrieved log file.
	 *         content:
	 *           text/plain:
	 *             schema:
	 *               type: string
	 *               example: |
	 *                 [2025-08-13 10:00:00] INFO: Server started.
	 *                 [2025-08-13 10:01:00] ERROR: Something went wrong.
	 *       500:
	 *         description: Internal server error.
	 */
	app.get("/log.log", (req: Request, res: Response) => {
		res.sendFile(path.join(process.cwd(), "log.log"));
	});

	/**
	 * @swagger
	 * /send-dm:
	 *   post:
	 *     summary: Send a direct message to a user
	 *     description: Sends a direct message to a specified Discord user.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               userId:
	 *                 type: string
	 *                 description: The ID of the Discord user to send the message to.
	 *                 example: "123456789012345678"
	 *               message:
	 *                 type: string
	 *                 description: The message content to send.
	 *                 example: "Hello from Maple Backend!"
	 *             required:
	 *               - userId
	 *               - message
	 *     responses:
	 *       200:
	 *         description: DM sent successfully.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                   example: "DM sent successfully."
	 *       400:
	 *         description: Bad request, missing userId or message.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                   example: "Error"
	 *                 error:
	 *                   type: string
	 *                   example: "User ID and message are required."
	 *       500:
	 *         description: Internal server error, DM failed to send.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                   example: "Error"
	 *                 error:
	 *                   type: string
	 *                   example: "Failed to send DM due to internal error."
	 */
	app.post("/send-dm", async (req: Request, res: Response) => {
		const { userId, message } = req.body;
		if (!userId || !message) {
			return res.status(400).json({ status: "Error", error: "User ID and message are required." });
		}

		const result = await sendDM(options.discordClient, userId, message);
		if (result.success) {
			res.json({ status: "DM sent successfully." });
		} else {
			res.status(500).json({ status: "Error", error: result.error });
		}
	});

	// SPA fallback
	// app.get("*", (req: Request, res: Response) => {
	// 	res.sendFile(path.join(__dirname, "..", "..", "dist", "frontend", "index.html"));
	// });

	httpServer.listen(options.port, () => {
		logger.log(`Web interface listening on http://localhost:${options.port}`);
	});
}
