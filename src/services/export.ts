import { P2POrder } from "@/types";
import { ExcelP2PService } from "./excel/excel";
import { P2POrdersFetchOptions } from "./p2p-orders";

export async function exportP2POrdersToExcel(
	orders: P2POrder[],
	fetchOptions: P2POrdersFetchOptions
) {
	const excelService = new ExcelP2PService();
	await excelService.exportOrdersToExcel(orders, fetchOptions);
}
