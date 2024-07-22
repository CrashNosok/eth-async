import { TransactionRequest, TransactionResponse, FeeData, TransactionReceipt, ethers, InterfaceAbi } from 'ethers';

import { Client } from './client';
import { TokenAmount, RawContract, TxArgs } from './data/models';


export class Transactions {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async feeData(): Promise<FeeData> {
        return await this.client.provider.getFeeData();
    }

    async gasPrice(): Promise<TokenAmount> {
        const feeData = await this.client.provider.getFeeData();
        return new TokenAmount(
            feeData.gasPrice as bigint,
            this.client.network.decimals,
            true
        )
    }

    async maxFeePerGas(): Promise<TokenAmount> {
        const feeData = await this.client.provider.getFeeData();
        return new TokenAmount(
            feeData.maxFeePerGas as bigint,
            this.client.network.decimals,
            true
        )
    }

    async maxPriorityFeePerGas(): Promise<TokenAmount> {
        const feeData = await this.client.provider.getFeeData();
        return new TokenAmount(
            feeData.maxPriorityFeePerGas as bigint,
            this.client.network.decimals,
            true
        )
    }

    async estimateGas(txParams: TransactionRequest): Promise<bigint> {
        return await this.client.provider.estimateGas(txParams);
    }

    async autoAddParams(txParams: TransactionRequest): Promise<TransactionRequest> {
        if (!txParams.chainId)
            txParams.chainId = this.client.network.chainId;

        if (!txParams.nonce)
            txParams.nonce = await this.client.wallet.nonce();

        if (!txParams.from)
            txParams.from = await this.client.signer.address;

        if (!txParams.gasPrice && !txParams.maxFeePerGas) {
            const feeData = await this.feeData();
            if (this.client.network.txType === 2) {
                txParams.maxFeePerGas = feeData.maxFeePerGas;
                txParams.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            } else {
                txParams.gasPrice = feeData.gasPrice;
            }
        }

        if (!txParams.gasLimit)
            txParams.gasLimit = await this.estimateGas(txParams);

        return txParams;
    }

    async signTransaction(txParams: TransactionRequest): Promise<string> {
        return await this.client.signer.signTransaction(txParams);
    }

    async sendTransaction(txParams: TransactionRequest): Promise<TransactionResponse> {
        txParams = await this.autoAddParams(txParams);
        return await this.client.signer.sendTransaction(txParams);
    }

    async waitTransaction(txResponse: TransactionResponse): Promise<TransactionReceipt | null> {
        const txReceipt = await txResponse.wait();
        return txReceipt;
    }

    async sendTransactionAndWait(txParams: TransactionRequest): Promise<TransactionReceipt | null> {
        const txResponse = await this.sendTransaction(txParams);
        const txReceipt = await this.waitTransaction(txResponse);
        return txReceipt;
    }

    async approvedAmount(token: RawContract | string, spender: RawContract | string, owner: string | null = null): Promise<TokenAmount> {
        const [tokenAddress, ] = await this.client.contracts.getContractAttributes(token);
        const tokenContract = await this.client.contracts.defaultToken(tokenAddress);
        const [spenderAddress, ] = await this.client.contracts.getContractAttributes(spender);

        if (!owner)
            owner = this.client.signer.address;

        return new TokenAmount(
            await tokenContract.allowance(owner, spenderAddress),
            await this.getDecimals(token),
            true
        )
    }

    // async approve(token: RawContract | string, spender: RawContract | string, amount: TokenAmount | null = null): Promise<TransactionReceipt | null> {
    //     const [tokenAddress, tokenAbi] = await this.client.contracts.getContractAttributes(token);
    //     const [spenderAddress, ] = await this.client.contracts.getContractAttributes(spender);
    //     const iface = new ethers.Interface(tokenAbi as InterfaceAbi);

    //     if (!amount)
    //         amount = await this.client.wallet.balance(token);

    //     const txArgs = new TxArgs({
    //         spender: spenderAddress,
    //         amount: amount.Wei
    //     })

    //     const txParams: TransactionRequest = {
    //         nonce: await this.client.wallet.nonce(),
    //         to: tokenAddress,
    //         data: iface.encodeFunctionData('approve', txArgs.tuple())
    //     }

    //     return await this.sendTransactionAndWait(txParams);
    // }

    async approve(token: RawContract | string, spender: RawContract | string, amount: TokenAmount | null = null): Promise<TransactionReceipt | null> {
        const [tokenAddress, tokenAbi] = await this.client.contracts.getContractAttributes(token);
        const [spenderAddress, ] = await this.client.contracts.getContractAttributes(spender);
        const tokenContract = await this.client.contracts.defaultToken(tokenAddress);

        if (!amount)
            amount = await this.client.wallet.balance(token);

        return await tokenContract.approve(spenderAddress, amount.Wei);
    }

    async getDecimals(contract: RawContract | string): Promise<bigint> {
        const [contractAddress, ] = await this.client.contracts.getContractAttributes(contract);
        const tokenContract = await this.client.contracts.defaultToken(contractAddress);
        return await tokenContract.decimals();
    }
}
