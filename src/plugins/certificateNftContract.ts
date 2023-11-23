import { NFT } from '@/config';
import { ethers } from 'ethers';

import abiContract from '../utils/abi/abi-certificate-nft.json';

const provider = new ethers.JsonRpcProvider(
    'https://celo.grassecon.net'
);

const contract = new ethers.Contract(NFT.CONTRACT, abiContract, provider);

export default contract;
