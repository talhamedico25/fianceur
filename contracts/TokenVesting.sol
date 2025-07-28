// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenVesting is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 vestingDuration;
        uint256 releasedAmount;
        bool isActive;
    }
    
    struct Agreement {
        string ipfsHash;
        address signer;
        uint256 timestamp;
        bool isSigned;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => Agreement) public agreements;
    
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 vestingDuration
    );
    
    event TokensReleased(
        address indexed beneficiary,
        uint256 amount
    );
    
    event AgreementSigned(
        address indexed signer,
        string ipfsHash,
        uint256 timestamp
    );
    
    modifier onlyBeneficiary() {
        require(vestingSchedules[msg.sender].beneficiary == msg.sender, "Not a beneficiary");
        require(vestingSchedules[msg.sender].isActive, "Vesting schedule not active");
        _;
    }
    
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        token = IERC20(_token);
    }
    
    /**
     * @dev Creates a vesting schedule for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @param _totalAmount Total amount of tokens to vest
     * @param _startTime Start time of vesting (timestamp)
     * @param _vestingDuration Duration of vesting in seconds
     */
    function createVestingSchedule(
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _startTime,
        uint256 _vestingDuration
    ) external onlyOwner {
        require(_beneficiary != address(0), "Beneficiary cannot be zero address");
        require(_totalAmount > 0, "Total amount must be greater than 0");
        require(_vestingDuration > 0, "Vesting duration must be greater than 0");
        require(_startTime >= block.timestamp, "Start time cannot be in the past");
        require(!vestingSchedules[_beneficiary].isActive, "Vesting schedule already exists");
        
        // Transfer tokens to contract
        require(token.transferFrom(msg.sender, address(this), _totalAmount), "Token transfer failed");
        
        vestingSchedules[_beneficiary] = VestingSchedule({
            beneficiary: _beneficiary,
            totalAmount: _totalAmount,
            startTime: _startTime,
            vestingDuration: _vestingDuration,
            releasedAmount: 0,
            isActive: true
        });
        
        emit VestingScheduleCreated(_beneficiary, _totalAmount, _startTime, _vestingDuration);
    }
    
    /**
     * @dev Signs an agreement by storing its IPFS hash
     * @param _ipfsHash IPFS hash of the agreement document
     */
    function signAgreement(string memory _ipfsHash) external {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(vestingSchedules[msg.sender].isActive, "No active vesting schedule");
        
        agreements[msg.sender] = Agreement({
            ipfsHash: _ipfsHash,
            signer: msg.sender,
            timestamp: block.timestamp,
            isSigned: true
        });
        
        emit AgreementSigned(msg.sender, _ipfsHash, block.timestamp);
    }
    
    /**
     * @dev Calculates the amount of tokens that can be released
     * @param _beneficiary Address of the beneficiary
     * @return Amount of tokens that can be released
     */
    function calculateReleasableAmount(address _beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];
        
        if (!schedule.isActive || block.timestamp < schedule.startTime) {
            return 0;
        }
        
        uint256 elapsedTime = block.timestamp - schedule.startTime;
        
        if (elapsedTime >= schedule.vestingDuration) {
            return schedule.totalAmount - schedule.releasedAmount;
        }
        
        uint256 vestedAmount = (schedule.totalAmount * elapsedTime) / schedule.vestingDuration;
        return vestedAmount - schedule.releasedAmount;
    }
    
    /**
     * @dev Releases vested tokens to the beneficiary
     */
    function releaseTokens() external onlyBeneficiary nonReentrant {
        require(agreements[msg.sender].isSigned, "Agreement not signed");
        
        uint256 releasableAmount = calculateReleasableAmount(msg.sender);
        require(releasableAmount > 0, "No tokens to release");
        
        vestingSchedules[msg.sender].releasedAmount += releasableAmount;
        
        require(token.transfer(msg.sender, releasableAmount), "Token transfer failed");
        
        emit TokensReleased(msg.sender, releasableAmount);
    }
    
    /**
     * @dev Gets vesting schedule information for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @return VestingSchedule struct
     */
    function getVestingSchedule(address _beneficiary) external view returns (VestingSchedule memory) {
        return vestingSchedules[_beneficiary];
    }
    
    /**
     * @dev Gets agreement information for a signer
     * @param _signer Address of the signer
     * @return Agreement struct
     */
    function getAgreement(address _signer) external view returns (Agreement memory) {
        return agreements[_signer];
    }
    
    /**
     * @dev Emergency function to withdraw tokens (only owner)
     * @param _amount Amount of tokens to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(token.transfer(owner(), _amount), "Token transfer failed");
    }
}