import { create } from "zustand";
import { persist } from "zustand/middleware";

type NetworkState = {
	currentNetwork: string;
	setCurrentNetwork: (network: string) => void;
};

export type IndexerRegistration = {
	url: string;
	address: string;
	registered: boolean;
	location: {
		latitude: number;
		longitude: number;
	};
};

type IndexerRegistrationState = {
	indexerRegistration: IndexerRegistration | null;
	setIndexerRegistration: (data: IndexerRegistration) => void;
};

export const useNetworkStore = create<NetworkState>()(
	persist(
		(set) => ({
			currentNetwork: "arbitrum-one",
			setCurrentNetwork: (network) => set({ currentNetwork: network }),
		}),
		{
			name: "network-storage",
		},
	),
);

export const useIndexerRegistrationStore = create<IndexerRegistrationState>(
	(set) => ({
		indexerRegistration: null,
		setIndexerRegistration: (data) => set({ indexerRegistration: data }),
	}),
);
