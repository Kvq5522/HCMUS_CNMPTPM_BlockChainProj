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
        bool hasEnded;
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
        campaign.hasEnded = false;
        campaign.category = _category;
        campaign.image = _image;
        campaign.isSuccessful = false;
        campaign.isWithdrawable = false;
        campaign.hasWithdrawed = false;
        campaign.tokenPrice = (_target) / (_tokensForSale);
        campaign.tokensForSale = _tokensForSale * 1e18;
        campaign.tokensSold = 0;

        require(
            token.transfer(campaign.owner, _tokensForSale * 1e18),
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

    receive() external payable {}

    function donateToCampaign(uint256 _id) public payable {
        Campaign storage campaign = campaigns[_id];
        uint256 amount = msg.value / campaign.tokenPrice;

        require(campaign.owner != address(0), "Campaign not found");
        require(
            campaign.deadline > block.timestamp,
            "Campaign can't be donated anymore "
        );

        require(
            campaign.tokensSold + amount * 1e18 <= campaign.tokensForSale,
            "Not enough tokens left"
        );

        require(token.approve(msg.sender, amount), "Not enough tokens");
        require(token.approve(campaign.owner, amount), "Not enough tokens");
        require(token.approve(address(this), amount), "Not enough tokens");
        require(
            token.allowance(address(this), campaign.owner) >= amount,
            string(
                abi.encodePacked(
                    "Allowance: ",
                    Strings.toString(
                        token.allowance(campaign.owner, address(this))
                    ),
                    " Campaign owner balance: ",
                    Strings.toString(token.balanceOf(campaign.owner)),
                    " Amount: ",
                    Strings.toString(amount)
                )
            )
        );
        require(
            token.transferFrom(campaign.owner, msg.sender, amount),
            "Token transfer failed"
        );

        campaign.amountCollected += campaign.tokenPrice * amount;
        campaign.tokensSold += amount * 1e18;

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
            campaign.donations.push(campaign.tokenPrice * amount);
        } else {
            campaign.donations[contributorIndex] +=
                // (campaign.tokenPrice / 1e18) *
                campaign.tokenPrice *
                amount;
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
        campaign.hasEnded = true;

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

            payable(campaign.contributors[i]).transfer(refundValue);
            campaign.amountCollected -= refundValue;

            token.approve(
                campaign.contributors[i],
                campaign.donations[i] / (campaign.tokenPrice)
            );
            token.transferFrom(
                campaign.contributors[i],
                address(this),
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

        payable(campaign.owner).transfer(campaign.amountCollected);
        campaign.hasWithdrawed = true;
    }

    function refundDonation(uint256 _id) public payable {
        Campaign storage campaign = campaigns[_id];

        require(!campaign.hasEnded, "Campaign has ended, can't refund");

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
        uint256 refundValue = campaign.donations[contributorIndex];

        payable(msg.sender).transfer(refundValue);

        campaign.amountCollected -= refundValue;
        campaign.tokensSold -= ((refundValue * 1e18) / campaign.tokenPrice);
        campaign.withdrawers.push(msg.sender);

        require(
            token.transferFrom(
                msg.sender,
                campaign.owner,
                campaign.donations[contributorIndex]
            ),
            "Fail to transfer from owner to contributor"
        );

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
    }
}
