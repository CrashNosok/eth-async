import { HttpsProxyAgent } from 'https-proxy-agent';
import { ethers } from 'ethers';
import axios from 'axios';
const UserAgent = require('user-agents');

import { getProxyConfigAxios } from './utils';
import { Networks, Network } from './data/models';
import { Contracts } from './contracts';
import { Transactions } from './transactions';
import { Wallet } from './wallet';
import * as exceptions from './exceptions';


class Client {
    network: Network;
    proxy: string;
    provider: ethers.JsonRpcProvider;
    signer: ethers.Wallet;
    contracts: Contracts;
    transactions: Transactions;
    wallet: Wallet;

    constructor(
        privateKey: string | null = null,
        network: Network = Networks.Goerli,
        proxy: string = '',
        checkProxy: boolean = true
    ) {
        this.network = network;

        this.proxy = proxy;

        let fetchRequest = new ethers.FetchRequest(this.network.rpc);

        if (this.proxy) {
            if (!this.proxy.includes('://')) {
                this.proxy = `http://${this.proxy}`;
            }

            if (checkProxy) {
                const proxyConfig = getProxyConfigAxios(this.proxy);
                axios.get('http://eth0.me/', proxyConfig)
                .then(response => {
                    const yourIp = response.data.trim();
                    console.log(yourIp);
                    
                    if (!this.proxy?.includes(yourIp)) {
                        throw new exceptions.InvalidProxy(`Proxy doesn't work! Your IP is ${yourIp}.`);
                    }
                })
                .catch(error => {
                    throw new exceptions.InvalidProxy(`Proxy doesn't work! Error: ${error.message}`);
                });
            }

            const agent = new HttpsProxyAgent(proxy);
            fetchRequest.getUrlFunc = ethers.FetchRequest.createGetUrlFunc({ agent: agent });
        }

        const userAgent = new UserAgent({
            deviceCategory: 'desktop',
        }).toString();

        fetchRequest.setHeader('user-agent', userAgent);
        fetchRequest.setHeader('accept', '*/*');
        fetchRequest.setHeader('accept-language', 'en-US,en;q=0.9');
        fetchRequest.setHeader('content-type', 'application/json');

        this.provider = new ethers.JsonRpcProvider(fetchRequest);

        if (!privateKey)
            privateKey = ethers.Wallet.createRandom().privateKey;
            
        this.signer = new ethers.Wallet(privateKey, this.provider);

        this.contracts = new Contracts(this);
        this.transactions = new Transactions(this);
        this.wallet = new Wallet(this);
    }
}

export { Client };
