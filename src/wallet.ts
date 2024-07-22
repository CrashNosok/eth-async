import { ethers } from 'ethers';

import { Client } from './client';
import { TokenAmount, RawContract } from './data/models';


class Wallet {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async balance(token: RawContract | string | null = null, address: string | null = null, decimals: number = 18): Promise<TokenAmount> {
        if (!address)
            address = this.client.signer.address;

        address = ethers.getAddress(address);

        if (!token) {
            const balance = await this.client.provider.getBalance(address);
            return new TokenAmount(balance, decimals, true);
        }

        let tokenAddress = token as string;
        if (token instanceof RawContract) {
            tokenAddress = token.address;
        }

        const contract = await this.client.contracts.defaultToken(tokenAddress);

        const balance = await contract.balanceOf(address);
        const tokenDecimals = await this.client.transactions.getDecimals(token);

        return new TokenAmount(balance, tokenDecimals, true);
    }

    async nonce(address: string | null = null): Promise<number> {
        if (!address) {
            address = this.client.signer.address;
        }
        return await this.client.provider.getTransactionCount(address);
    }
}

export { Wallet };
