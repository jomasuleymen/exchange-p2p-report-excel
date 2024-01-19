import config from "@/config/config";
import { P2PExchange } from "@/types";
import { BinanceP2PExchange } from "./binance";
import { BybitP2PExchange } from "./bybit";
import { OkxP2PExchange } from "./okx";

const exchanges: P2PExchange[] = [];

if (config.binanceCsrfToken && config.binanceSessionId) {
	const binanceExchange = new BinanceP2PExchange(
		config.binanceSessionId,
		config.binanceCsrfToken
	);
	console.log("Binance exchange instance is created");
	exchanges.push(binanceExchange);
}

if (config.bybitSecureToken) {
	const bybitExchange = new BybitP2PExchange(config.bybitSecureToken);
	console.log("Bybit exchange instance is created");
	exchanges.push(bybitExchange);
}

if (config.okxAuthorization) {
	const okxExchange = new OkxP2PExchange(config.okxAuthorization);
	console.log("Okx exchange instance is created");
	exchanges.push(okxExchange);
}

export default exchanges;
