import { config } from "dotenv";
config();

const timeZone = Number(process.env.TIME_ZONE);

if (!timeZone) {
	throw new Error("TIME_ZONE variable must be number");
}

export default {
	binanceSessionId: process.env.BINANCE_SESSION_ID,
	binanceCsrfToken: process.env.BINANCE_CSRF_TOKEN,
	bybitSecureToken: process.env.BYBIT_SECURE_TOKEN,
	okxAuthorization: process.env.OKX_AUTHORIZATION,
	timeZone,
	nickName: process.env.ACCOUNT_NICK_NAME || "default",
	hiddenAccounts:
		process.env.HIDDEN_ACCOUNTS?.split(",")?.map((account) => account.trim()) ||
		[],
};
