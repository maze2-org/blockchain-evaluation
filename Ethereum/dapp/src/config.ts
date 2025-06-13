import { sepolia } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';


const { connectors } = getDefaultWallets({
    appName: 'IABS DApp',
    projectId: '72bd56727759d3cf28dcf803d10a5709',
});

export const config = createConfig({
    chains: [sepolia],
    connectors,
    transports: {
        [sepolia.id]: http(),
    },
    ssr: false,
});
