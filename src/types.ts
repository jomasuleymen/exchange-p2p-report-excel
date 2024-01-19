export type P2PDateTime = string;

export type P2PRawOrders = {
	exchangeName: string;
	orders: any[];
};

export type P2POrder = {
	url: string;
	orderId: string;
	counterPartyNickname: string;
	counterPartyName: string;
	side: "BUY" | "SELL";
	exchange: string;
	dateAndTime: P2PDateTime;
	price: number;
	count: number;
	amount: number;
	asset: string;
	bankName: string;
	fiat: string;
};

export type P2PExchange = {
	name: string;
	fetchP2POrders(startDate: Date, endDate: Date): Promise<any[]>;
	parseP2POrders(orders: any[]): Promise<P2POrder[]>;
};
