declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TIME_ZONE: string;
			BINANCE_SESSION_ID: string;
			BINANCE_CSRF_TOKEN: string;
			BYBIT_SECURE_TOKEN: string;
			OKX_AUTHORIZATION: string;
			ACCOUNT_NICK_NAME: string;
			HIDDEN_ACCOUNTS: string;
		}
	}
}

export {};
