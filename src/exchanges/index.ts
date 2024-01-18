import config from "@/config/config";
import { P2PExchange } from "@/types";
import { BinanceP2PExchange } from "./binance";

const exchanges: P2PExchange[] = [];

if (config.binanceCsrfToken && config.binanceSessionId) {
	const binanceExchange = new BinanceP2PExchange(
		config.binanceSessionId,
		config.binanceCsrfToken
	);
	console.log("Binance exchange instance is created");
	exchanges.push(binanceExchange);
}

export default exchanges;
