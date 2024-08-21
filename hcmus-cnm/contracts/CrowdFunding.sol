// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract CrowdFunding {
    constructor() {}

    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] contributors;
        uint256[] donations;
        bool isSuccessful;
        bool isWithdrawable;
        address[] withdrawers;
    }

    mapping(uint256 => Campaign) public campaigns;

    uint256 public numberOfCampaigns = 0;
    uint256 public numberOfSuccessCampaigns = 0;
    uint256 public numberOfFailedCampaigns = 0;

    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
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
        campaign.image = _image;
        campaign.isSuccessful = false;
        campaign.isWithdrawable = true;

        numberOfCampaigns++;

        return numberOfCampaigns - 1;
    }

    function donateToCampaign(uint256 _id) public payable {
        uint256 amount = msg.value;

        Campaign storage campaign = campaigns[_id];

        require(campaign.owner != address(0), "Campaign not found");

        require(
            campaign.isWithdrawable || campaign.deadline < block.timestamp,
            string(
                abi.encodePacked(
                    "Campaign can't be donated anymore ",
                    string(abi.encodePacked(campaign.deadline)),
                    " ",
                    string(abi.encodePacked(block.timestamp))
                )
            )
        );

        (bool sent, ) = payable(campaign.owner).call{value: amount}("");

        if (sent) {
            campaign.amountCollected += amount;

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

    function endCampaign(uint _id, bool _isSuccessful) public {
        Campaign storage campaign = campaigns[_id];

        require(campaign.owner == msg.sender, "Only owner can end campaign");

        campaign.isSuccessful = _isSuccessful;
        campaign.isWithdrawable = false;

        if (_isSuccessful) {
            numberOfSuccessCampaigns++;
        } else {
            numberOfFailedCampaigns++;
        }
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
            campaign.donations[contributorIndex] < msg.value,
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
