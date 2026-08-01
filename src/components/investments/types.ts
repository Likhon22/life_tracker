export type Category = { id: string; name: string; icon: string };

export type Transaction = {
    id: string;
    type: 'invest' | 'withdraw';
    amount: number;
    date: string;
    note?: string;
};

export type InvestmentItem = {
    id: string;
    name: string;
    categoryId: Category | string;
    note?: string;
    transactions: Transaction[];
    totalInvested: number;
    totalWithdrawn: number;
    activeCapital: number;
    pnl: number;
    firstEntryDate: string | null;
    latestEntryDate: string | null;
};
