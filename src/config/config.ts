import { config } from "dotenv";
config();

export default {
  binanceSessionId: process.env.BINANCE_SESSION_ID,
  binanceCsrfToken: process.env.BINANCE_CSRF_TOKEN,
  bybitSecureToken: process.env.BYBIT_SECURE_TOKEN,
  okxAuthorization: process.env.OKX_AUTHORIZATION,
  accountNickName: process.env.ACCOUNT_NICK_NAME || "default",
  hiddenAccounts:
    process.env.HIDDEN_ACCOUNTS?.split(",")?.map((account) => account.trim()) ||
    [],
};
