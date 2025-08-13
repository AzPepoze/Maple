import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: "../../dist/frontend",
			assets: "../../dist/frontend",
			fallback: "index.html",
		}),
	},
};

export default config;
