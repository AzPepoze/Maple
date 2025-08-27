import { EdgeTTS } from "@andresaya/edge-tts";
import { createWriteStream } from "fs";
import { logger } from "../utils/logger";

// Initialize the EdgeTTS service
const pureTTS = new EdgeTTS();

class TTSService {
	private tts;
	private defaultVoice = "th-TH-PremwadeeNeural";

	constructor() {
		this.tts = new EdgeTTS();
	}

	async getVoices(language: string, gender: "Male" | "Female") {
		const allVoices = await this.tts.getVoicesByLanguage(language);
		const filteredVoices = allVoices.filter((voice) => voice.Gender === gender);
		logger.info(JSON.stringify(filteredVoices, null, 2));
		return filteredVoices;
	}

	async genVoice(text: string) {
		const outputFilePath = `output.mp3`;
		let name = process.env.VOICE;

		if (!name) {
			logger.info(`Using default voice: ${this.defaultVoice}`);
			name = this.defaultVoice;
		}

		const audio = await pureTTS.synthesizeStream(
			`
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts"
       xml:lang="th-TH">
    <voice name="${name}">
        <prosody pitch="+20Hz" rate="-10%">
            ${text}
        </prosody>
    </voice>
</speak>`.trim(),
			name,
			{
				inputType: "ssml",
			}
		);

		const writeStream = createWriteStream(outputFilePath);

		for await (const chunk of audio) {
			writeStream.write(chunk);
		}

		writeStream.end();
		return audio;
	}
}

(async () => {
	const tts = new TTSService();
	const voices = await tts.getVoices("th", "Female");

	for (const voice of voices) {
		logger.log(`Voice Name: ${voice.Name}`);
	}
})();

export default TTSService;
