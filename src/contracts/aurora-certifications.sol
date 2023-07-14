// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract AuroraCertification is ERC721, Ownable {
    struct NFTData {
        string name;
        string description;
        string[] certifications;
    }

    mapping(uint256 => NFTData) private nftData;

    constructor() ERC721('Aurora Batch Certificate', 'ABatchCo') {}

    function mintTo(
        address receiver,
        uint256 tokenId,
        string memory name,
        string memory description,
        string[] memory certifications
    ) public {
        _safeMint(receiver, tokenId);
        nftData[tokenId] = NFTData(name, description, certifications);
    }

    function getNFTData(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory name,
            string memory description,
            string[] memory certifications
        )
    {
        NFTData memory data = nftData[tokenId];
        name = data.name;
        description = data.description;
        certifications = data.certifications;
    }
}
