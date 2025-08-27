import { Client } from "discord.js";
import { logger } from "../utils/logger";

export async function sendDM(
	discordClient: Client,
	userId: string,
	message: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await discordClient.users.fetch(userId);
		if (!user) {
			logger.warn(`User with ID ${userId} not found.`);
			return { success: false, error: `User with ID ${userId} not found.` };
		}
		await user.send(message);
		logger.log(`Successfully sent DM to user ${userId}`);
		return { success: true };
	} catch (error) {
		logger.error(`Failed to send DM to user ${userId}:`, error);
		return {
			success: false,
			error: `Failed to send DM to user ${userId}. Error: ${
				error instanceof Error ? error.message : String(error)
			}`,
		};
	}
}
