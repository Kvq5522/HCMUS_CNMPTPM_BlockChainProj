// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CrowdFunding {
    IERC20 private immutable token =
        IERC20(0x335E93300b7e8C0E8527E46F128B4a5D2c354245);
    address tokenAddress = 0x335E93300b7e8C0E8527E46F128B4a5D2c354245;

    constructor() {
        token.approve(
            address(this),
            1000000000000000000000000000000000000000000000000
        );
    }

    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string category;
        string image;
        address[] contributors;
        uint256[] donations;
        bool isSuccessful;
        bool isWithdrawable;
        bool hasWithdrawed;
        address[] withdrawers;
        uint256 tokenPrice;
        uint256 tokensForSale;
        uint256 tokensSold;
    }

    mapping(uint256 => Campaign) private campaigns;

    uint256 public numberOfCampaigns = 0;
    uint256 public numberOfSuccessCampaigns = 0;
    uint256 public numberOfFailedCampaigns = 0;

    function checkAccountBalance(
        address account
    ) public view returns (uint256) {
        return token.balanceOf(account);
    }

    function transferToken() public {
        require(token.transfer(msg.sender, 1), "Token transfer failed");
    }

    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _category,
        string memory _image,
        uint256 _tokensForSale
    ) public returns (uint256) {
        Campaign storage campaign = campaigns[numberOfCampaigns];

        require(
            campaign.deadline < block.timestamp,
            "Deadline must be date in future"
        );

        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.category = _category;
        campaign.image = _image;
        campaign.isSuccessful = false;
        campaign.isWithdrawable = false;
        campaign.hasWithdrawed = false;
        campaign.tokenPrice = (_target * 1e18) / _tokensForSale;
        campaign.tokensForSale = _tokensForSale;
        campaign.tokensSold = 0;

        require(
            token.transfer(campaign.owner, _tokensForSale),
            string(
                abi.encodePacked(
                    "Contract tokens: ",
                    Strings.toString(token.balanceOf(tokenAddress)),
                    Strings.toString(_tokensForSale)
                )
            )
        );

        numberOfCampaigns++;

        return numberOfCampaigns - 1;
    }

    function donateToCampaign(uint256 _id) public payable {
        uint256 amount = msg.value;

        Campaign storage campaign = campaigns[_id];

        require(campaign.owner != address(0), "Campaign not found");
        require(
            campaign.deadline > block.timestamp,
            "Campaign can't be donated anymore "
        );

        uint256 tokensToBuy = amount / campaign.tokenPrice;
        require(
            campaign.tokensSold + tokensToBuy <= campaign.tokensForSale,
            "Not enough tokens left"
        );

        (bool sent, ) = payable(address(this)).call{value: amount}("");
        require(sent, "Fail to donate");
        require(token.approve(campaign.owner, tokensToBuy), "Can't send token");
        require(
            token.transferFrom(campaign.owner, msg.sender, tokensToBuy),
            "Token transfer failed"
        );

        campaign.amountCollected += amount;
        campaign.tokensSold += tokensToBuy;

        bool hasAddress = false;
        uint256 contributorIndex = 0;

        for (uint i = 0; i < campaign.contributors.length; i++) {
            if (campaign.contributors[i] == msg.sender) {
                hasAddress = true;
                contributorIndex = i;
                break;
            }
        }

        if (!hasAddress) {
            campaign.contributors.push(msg.sender);
            campaign.donations.push(amount);
        } else {
            campaign.donations[contributorIndex] += amount;
        }
    }

    function getDonators(
        uint256 _id
    ) public view returns (address[] memory, uint256[] memory) {
        return (campaigns[_id].contributors, campaigns[_id].donations);
    }

    function getCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for (uint i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];

            allCampaigns[i] = item;
        }

        return allCampaigns;
    }

    function getCampaignById(
        uint256 _id
    ) public view returns (Campaign memory) {
        return campaigns[_id];
    }

    function endCampaign(uint _id) public {
        Campaign storage campaign = campaigns[_id];

        require(campaign.owner == msg.sender, "Only owner can end campaign");

        bool _isSuccessful = campaign.amountCollected >= campaign.target;

        campaign.isWithdrawable = true;

        if (_isSuccessful) {
            numberOfSuccessCampaigns++;
            campaign.isSuccessful = _isSuccessful;
            return;
        }

        numberOfFailedCampaigns++;
        uint256 campaignPercentage = (campaign.amountCollected * 100) /
            campaign.target;

        for (uint i = 0; i < campaign.contributors.length; i++) {
            uint256 refundValue = campaignPercentage <= 25
                ? campaign.donations[i]
                : campaignPercentage <= 50
                    ? (campaign.donations[i] * 90) / 100
                    : campaignPercentage <= 75
                        ? (campaign.donations[i] * 80) / 100
                        : (campaign.donations[i] * 70) / 100;
            (bool sent, ) = payable(campaign.contributors[i]).call{
                value: refundValue
            }("");
            campaign.amountCollected -= refundValue;
            require(sent, "Refund failed");
            token.approve(
                campaign.contributors[i],
                campaign.donations[i] / (campaign.tokenPrice)
            );
            token.transferFrom(
                campaign.contributors[i],
                tokenAddress,
                campaign.donations[i] / (campaign.tokenPrice)
            );
        }
    }

    function withdrawCampaignMoney(uint256 _id) public {
        Campaign storage campaign = campaigns[_id];

        require(
            campaign.owner == msg.sender,
            "Only owner can withdraw campaign"
        );

        require(campaign.isWithdrawable, "Can't withdraw now");

        require(!campaign.hasWithdrawed, "Has withdrawed money already");

        (bool sent, ) = payable(campaign.owner).call{
            value: campaign.amountCollected
        }("");
        require(sent, "Withdraw failed");
        campaign.hasWithdrawed = true;
    }

    function withdrawDonation(uint256 _id) public payable {
        Campaign storage campaign = campaigns[_id];

        require(campaign.isWithdrawable, "Campaign is not withdrawable");

        bool hasAddress = false;
        uint256 contributorIndex = 0;

        for (uint i = 0; i < campaign.contributors.length; i++) {
            if (campaign.contributors[i] == msg.sender) {
                hasAddress = true;
                contributorIndex = i;
                break;
            }
        }

        require(hasAddress, "Contributor address is invalid");

        require(
            campaign.donations[contributorIndex] >= msg.value,
            "Donation amount is invalid"
        );

        (bool sent, ) = payable(msg.sender).call{value: msg.value}("");

        if (sent) {
            campaign.amountCollected -= msg.value;
            campaign.withdrawers.push(msg.sender);

            if (msg.value == campaign.donations[contributorIndex]) {
                for (
                    uint i = contributorIndex;
                    i < campaign.donations.length - 1;
                    i++
                ) {
                    campaign.donations[i] = campaign.donations[i + 1];
                    campaign.contributors[i] = campaign.contributors[i + 1];
                }
                campaign.donations.pop();
                campaign.contributors.pop();
            } else {
                campaign.donations[contributorIndex] -= msg.value;
            }
        }
    }
}
