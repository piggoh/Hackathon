pragma solidity ^0.8.0;

import 'solana';
import 'libraries/spl_token.sol';

contract Hackathon2 {
    // Declare state variables
    mapping(uint => uint) public idToLastUpdate;
    mapping(uint => uint) public idToBorrowedAmount;
    mapping(uint => uint) public idToTokenPrice;
    mapping(uint => bool) public idHasBeenRepaid;
    uint256 public interestPerEthPerDay = 3000;

    @payer(payer)
    constructor() {
        print("Hello, World!");

    }

    // Transfer tokens from one token account to another via Cross Program Invocation to Token Program
    function transferTokens(
        address from, // token account to transfer from
        address to, // token account to transfer to
        uint64 amount // amount to transfer
    ) public {
        SplToken.TokenAccountData from_data = SplToken.get_token_account_data(from);
        SplToken.transfer(from, to, from_data.owner, amount);

    }

    function getId(
        address nftContract, 
        uint nftId, 
        uint endTime, 
        uint borrowCeiling, 
        uint interest
    ) pure public returns (uint id){
        return uint256(keccak256(abi.encodePacked(nftContract, nftId, endTime, borrowCeiling, interest)));
    }

    function applyInterest(
        uint id
    ) internal returns (uint newBorrowedAmount) {
        uint elapsedTime;
        unchecked {
            elapsedTime = block.timestamp - idToLastUpdate[id];
        }
        idToLastUpdate[id] = block.timestamp;
        uint oldBorrowedAmount = idToBorrowedAmount[id];
        if(oldBorrowedAmount == 0){
        return 0;
        }
        newBorrowedAmount = oldBorrowedAmount + ((oldBorrowedAmount*interestPerEthPerDay*elapsedTime)/(1 days * 1e18));
        idToTokenPrice[id] = (idToTokenPrice[id]*newBorrowedAmount)/oldBorrowedAmount;
    }

    function repay(
        address nftContract, 
        uint nftId, 
        uint endTime, 
        uint borrowCeiling, 
        uint256 _interestPerEthPerDay, 
        bool isERC721
        ) external payable {
        // only allow repayment before expiration?
        uint id = getId(nftContract, nftId, endTime, borrowCeiling, interestPerEthPerDay);
        uint amountToRepay = applyInterest(id);
        SplToken.transferTokens(from, address(this), amount - amountToRepay);
        idHasBeenRepaid[id] = true;
    }

    function lend(
        address nftContract,
        uint nftId, 
        uint endTime, 
        uint borrowCeiling, 
        uint _interestPerEthPerDay, 
        address payable currentOwner
        ) external payable {
        uint id = getId(nftContract, nftId, endTime, borrowCeiling, interestPerEthPerDay);
        uint newBorrowedAmount = applyInterest(id) + SplToken.transferTokens(amount);
        require(newBorrowedAmount < borrowCeiling, "max borrow");
        idToBorrowedAmount[id] = newBorrowedAmount;
        currentOwner.sendValue(msg.value);

        require(balanceOf(currentOwner, id) == 1, "wrong owner");
        _mint(msg.sender, lenderTokenId(id), (msg.value*1e18)/idToTokenPrice[id], "");
    }

    function getUnderlyingBalance(uint id, address account) public view returns (uint depositTokensOwned, uint ethWithInterest){
        depositTokensOwned = balanceOf(account, lenderTokenId(id));
        ethWithInterest = (depositTokensOwned * idToTokenPrice[id])/1e18;
    }

    function recoverEth(uint id) external {
        require(idHasBeenRepaid[id] == true, "not repaid");
        (uint depositTokensOwned, uint ethWithInterest) = getUnderlyingBalance(id, msg.sender);
        _burn(msg.sender, lenderTokenId(id), depositTokensOwned);
        payable(msg.sender).sendValue(ethWithInterest);
    }
}