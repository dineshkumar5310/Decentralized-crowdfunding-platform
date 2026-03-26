// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

/// @title CrowdFund - A multi-campaign crowdfunding contract using POL on Polygon
contract CrowdFund {
    uint public campaignCount;

    struct Campaign {
        address owner;
        string title;
        string description;
        string category;
        string imageURL;
        uint goal;
        uint raised;
        uint deadline;
        uint minContribution;
        uint uniqueDonors;
        bool withdrawn;
    }

    mapping(uint => Campaign) public campaigns;
    mapping(uint => mapping(address => uint)) public contributions;

    event CampaignCreated(uint indexed campaignId, address indexed owner, string title, uint goal, uint deadline);
    event Contributed(uint indexed campaignId, address indexed contributor, uint amount, uint timestamp);
    event Withdrawn(uint indexed campaignId, address indexed owner, uint amount);
    event Refunded(uint indexed campaignId, address indexed donor, uint amount);

    /// @notice Create a new crowdfunding campaign
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _imageURL,
        uint _goal,
        uint _deadline,
        uint _minContribution
    ) external {
        require(_goal > 0, "Goal must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_minContribution > 0, "Min contribution must be greater than 0");

        campaignCount++;
        campaigns[campaignCount] = Campaign({
            owner: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            imageURL: _imageURL,
            goal: _goal,
            raised: 0,
            deadline: _deadline,
            minContribution: _minContribution,
            uniqueDonors: 0,
            withdrawn: false
        });

        emit CampaignCreated(campaignCount, msg.sender, _title, _goal, _deadline);
    }

    /// @notice Contribute to a specific campaign
    function contribute(uint _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        require(block.timestamp < campaign.deadline, "Campaign ongoing");
        require(msg.value >= campaign.minContribution, "Below minimum contribution");

        if (contributions[_campaignId][msg.sender] == 0) {
            campaign.uniqueDonors++;
        }
        contributions[_campaignId][msg.sender] += msg.value;
        campaign.raised += msg.value;

        emit Contributed(_campaignId, msg.sender, msg.value, block.timestamp);
    }

    /// @notice Get the progress of a campaign (raised / goal)
    function getProgress(uint _campaignId) external view returns (uint) {
        Campaign storage campaign = campaigns[_campaignId];
        if (campaign.goal == 0) return 0;
        return (campaign.raised * 100) / campaign.goal;
    }

    /// @notice Withdraw funds if goal is reached and deadline passed
    function withdraw(uint _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.owner, "Not owner");
        require(block.timestamp > campaign.deadline, "Campaign ongoing");
        require(campaign.raised >= campaign.goal, "Goal not reached");
        require(!campaign.withdrawn, "Already withdrawn");

        campaign.withdrawn = true;
        payable(campaign.owner).transfer(campaign.raised);

        emit Withdrawn(_campaignId, campaign.owner, campaign.raised);
    }

    /// @notice Refund contributions if goal not reached and deadline passed
    function refund(uint _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp > campaign.deadline, "Campaign ongoing");
        require(campaign.raised < campaign.goal, "Goal reached");

        uint amount = contributions[_campaignId][msg.sender];
        require(amount > 0, "No contributions");

        contributions[_campaignId][msg.sender] = 0;
        campaign.raised -= amount;
        payable(msg.sender).transfer(amount);

        emit Refunded(_campaignId, msg.sender, amount);
    }
}
