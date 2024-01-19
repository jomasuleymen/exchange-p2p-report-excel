import config from "@/config/config";
import { P2PExchange } from "@/types";
import { BinanceP2PExchange } from "./binance";
import { BybitP2PExchange } from "./bybit";

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

export default exchanges;
