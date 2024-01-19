import { P2PExchange, P2POrder } from "@/types";
import { readJsonFile, writeJsonFile } from "@/utils/file.util";
import { getDate, sleep } from "@/utils/time.util";
import axios from "axios";
import * as fs from "fs";
import path from "path";

export class BybitP2PExchange implements P2PExchange {
	name: string = "Bybit";
	p2pOrdersUrl: string = "https://api2.bybit.com/fiat/otc/order/list";

	constructor(private readonly secureToken: string) {
		if (!secureToken)
			throw new Error(`"secureToken" for ${this.name} not provided`);
	}

	getHeaders(content?: any) {
		return {
			Host: "api2.bybit.com",
			"Content-Length": content
				? JSON.stringify(content).length.toString()
				: "0",
			"Content-Type": "application/json",
			"Accept-Encoding": "gzip, deflate, br",
			Accept: "*/*",
			Cookie: `secure-token=${this.secureToken};`,
		};
	}

	getRequestPayload(startDate: Date, endDate: Date, page: number) {
		const startDateStr = startDate.getTime().toString();
		const endDateStr = endDate.getTime().toString();

		const body = {
			page,
			size: 30,
			beginTime: startDateStr,
			endTime: endDateStr,
			status: 50,
		};

		const headers = this.getHeaders(body);

		return {
			body,
			headers,
		};
	}

	async fetchP2POrders(startDate: Date, endDate: Date): Promise<any[]> {
		try {
			let page = 1;
			const orders: any[] = [];

			while (true) {
				console.log(`Fetching ${this.name} P2P Orders page ${page}`);
				const { body, headers } = this.getRequestPayload(
					startDate,
					endDate,
					page
				);

				const res = await axios.post(this.p2pOrdersUrl, body, { headers });

				const {
					result: { items: fetchedOrders },
				} = res.data;

				if (!fetchedOrders || !fetchedOrders?.length) break;

				orders.push(...fetchedOrders);
				page++;

				await sleep(1500);
			}

			return orders;
		} catch (err) {
			throw new Error(
				`Some error while fetching P2POrders of ${this.name}: ${err}`
			);
		}
	}

	async getAllPaymentList(): Promise<any[]> {
		const cachePath = path.join(__dirname, "cache", "paymentList.json");
		if (fs.existsSync(cachePath)) {
			const paymentList = readJsonFile(cachePath);
			return paymentList;
		}

		console.log("Fetching all payment list in", this.name, "exchange");
		const url =
			"https://api2.bybit.com/fiat/otc/configuration/queryAllPaymentList";

		const headers = this.getHeaders();
		const res = await axios.post(url, null, { headers });
		const paymentList = res.data.result.paymentConfigVo;
		writeJsonFile(cachePath, paymentList);

		return paymentList;
	}

	async parseP2POrders(fetchedOrders: any[]): Promise<P2POrder[]> {
		const orders: P2POrder[] = [];

		const getOrderUrl = (orderId: string) =>
			`https://www.bybit.com/fiat/trade/otc/orderList/${orderId}`;

		const getBankName = async (order: any) => {
			const selectedPaymentType = order.paymentType;
			const paymentList = await this.getAllPaymentList();
			let selectedPayment = paymentList.find(
				(payment: any) => payment.paymentType == selectedPaymentType
			);

			if (!selectedPayment) {
				selectedPayment = order.paymentTermList.find(
					(payment: any) => payment.paymentType == selectedPaymentType
				);
			}

			return selectedPayment?.paymentName;
		};

		for (let order of fetchedOrders) {
			orders.push({
				url: getOrderUrl(order.id),
				orderId: order.id,
				counterPartyNickname: order.targetNickName || "?",
				counterPartyName:
					order.side == 1 ? order.buyerRealName : order.sellerRealName,
				side: order.side == 1 ? "SELL" : "BUY",
				exchange: this.name,
				dateAndTime: getDate(order.createDate),
				price: parseFloat(order.price),
				count: parseFloat(order.quantity),
				amount: parseFloat(order.amount),
				asset: (order.tokenId || order.tokenName).toUpperCase(),
				bankName: (await getBankName(order)) || "?",
				fiat: order.currencyId.toUpperCase(),
			});
		}

		return orders;
	}
}
