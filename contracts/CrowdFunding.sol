// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

/// @title CrowdFund - A simple crowdfunding contract using POL on Polygon
contract CrowdFund {
    address public owner;
    uint public goal;
    uint public deadline;

    mapping(address => uint) public contributions;

    event Contributed(address indexed contributor, uint amount, uint timestamp);
    event Withdrawn(address indexed owner, uint amount, uint timestamp);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Accepts POL contributions via direct transfer
    receive() external payable {
        contributions[msg.sender] += msg.value;
        emit Contributed(msg.sender, msg.value, block.timestamp);
    }

    /// @notice Accepts POL contributions via function call
    function contribute() external payable {
        contributions[msg.sender] += msg.value;
        emit Contributed(msg.sender, msg.value, block.timestamp);
    }

    /// @notice Fallback function to accept POL and log contribution
    fallback() external payable {
        contributions[msg.sender] += msg.value;
        emit Contributed(msg.sender, msg.value, block.timestamp);
    }

    /// @notice Owner can withdraw all collected POL
    function withdraw() public {
        require(msg.sender == owner, "Not owner");
        uint balance = address(this).balance;
        payable(owner).transfer(balance);
        emit Withdrawn(owner, balance, block.timestamp);
    }

    /// @notice Optional: Set campaign goal and deadline
    function setCampaign(uint _goal, uint _durationInSeconds) external {
        require(msg.sender == owner, "Not owner");
        goal = _goal;
        deadline = block.timestamp + _durationInSeconds;
    }

    /// @notice Check if funding goal is reached
    function isGoalReached() public view returns (bool) {
        return address(this).balance >= goal;
    }

    /// @notice Check if campaign deadline has passed
    function isDeadlinePassed() public view returns (bool) {
        return block.timestamp > deadline;
    }
}
