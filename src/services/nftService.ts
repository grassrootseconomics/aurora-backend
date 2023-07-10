import certificateNftContract from '@/plugins/certificateNftContract';

export const getTokenMetadata = (tokenId: string) => {
    return certificateNftContract.getNFTData(tokenId);
};
