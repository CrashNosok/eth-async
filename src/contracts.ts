import { ethers, Contract } from 'ethers';

import { Client } from './client';
import { DefaultABIs, RawContract } from './data/models';


export class Contracts {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async defaultToken(contractAddress: string): Promise<Contract> {
        const checksumAddress = ethers.getAddress(contractAddress);
        return new ethers.Contract(checksumAddress, DefaultABIs.Token, this.client.signer);
    }

    async getContractAttributes(contract: RawContract | string): Promise<[string, any[] | null]> {
        if (contract instanceof RawContract) 
            return [contract.address, contract.abi];

        return [ethers.getAddress(contract), null];
    }

    // todo: можно ли abi передавать строкой?
    async get(contractAddress: RawContract | string, abi: any[] | string | null = null): Promise<Contract> {
        const [address, contractAbi] = await this.getContractAttributes(contractAddress);
        if (!abi && !contractAbi) {
            throw new Error('Cannot get ABI for contract');
        }

        const finalAbi = abi || contractAbi;

        if (finalAbi) {
            return new ethers.Contract(address, finalAbi, this.client.provider);
        }

        return new ethers.Contract(address, [], this.client.provider);
    }
}
