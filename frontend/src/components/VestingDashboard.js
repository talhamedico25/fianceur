import React, { useState, useEffect } from 'react';
import { contractService } from '../utils/contract';

const VestingDashboard = ({ connectedAddress, agreementSigned }) => {
    const [vestingSchedule, setVestingSchedule] = useState(null);
    const [agreement, setAgreement] = useState(null);
    const [releasableAmount, setReleasableAmount] = useState('0');
    const [tokenBalance, setTokenBalance] = useState('0');
    const [isReleasing, setIsReleasing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    useEffect(() => {
        if (connectedAddress) {
            loadVestingData();
        }
    }, [connectedAddress, agreementSigned, lastUpdate]);

    const loadVestingData = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [schedule, agreementData, releasable, balance] = await Promise.all([
                contractService.getVestingSchedule(connectedAddress),
                contractService.getAgreement(connectedAddress),
                contractService.calculateReleasableAmount(connectedAddress),
                contractService.getTokenBalance(connectedAddress)
            ]);

            setVestingSchedule(schedule);
            setAgreement(agreementData);
            setReleasableAmount(releasable);
            setTokenBalance(balance);
        } catch (error) {
            setError('Failed to load vesting data: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const releaseTokens = async () => {
        setIsReleasing(true);
        setError('');

        try {
            const txHash = await contractService.releaseTokens();
            console.log('Tokens released with transaction:', txHash);
            // Refresh data after successful release
            setTimeout(() => {
                setLastUpdate(Date.now());
            }, 2000);
        } catch (error) {
            setError('Failed to release tokens: ' + error.message);
        } finally {
            setIsReleasing(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        return `${days} days, ${hours} hours`;
    };

    const calculateProgress = () => {
        if (!vestingSchedule || !vestingSchedule.isActive) return 0;
        
        const now = Date.now() / 1000;
        const startTime = vestingSchedule.startTime;
        const endTime = startTime + vestingSchedule.vestingDuration;
        
        if (now < startTime) return 0;
        if (now >= endTime) return 100;
        
        return ((now - startTime) / vestingSchedule.vestingDuration) * 100;
    };

    const getVestingStatus = () => {
        if (!vestingSchedule || !vestingSchedule.isActive) return 'No vesting schedule';
        
        const now = Date.now() / 1000;
        const startTime = vestingSchedule.startTime;
        const endTime = startTime + vestingSchedule.vestingDuration;
        
        if (now < startTime) return 'Not started';
        if (now >= endTime) return 'Fully vested';
        return 'Vesting in progress';
    };

    if (!connectedAddress) {
        return (
            <div className="vesting-dashboard">
                <h3>Vesting Dashboard</h3>
                <p>Please connect your wallet to view vesting information.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="vesting-dashboard">
                <h3>Vesting Dashboard</h3>
                <p>Loading vesting data...</p>
            </div>
        );
    }

    return (
        <div className="vesting-dashboard">
            <h3>Vesting Dashboard</h3>
            
            <div className="dashboard-grid">
                <div className="info-card">
                    <h4>Token Balance</h4>
                    <div className="balance-amount">{parseFloat(tokenBalance).toFixed(4)} VTK</div>
                </div>

                <div className="info-card">
                    <h4>Releasable Amount</h4>
                    <div className="releasable-amount">{parseFloat(releasableAmount).toFixed(4)} VTK</div>
                </div>

                {vestingSchedule && vestingSchedule.isActive ? (
                    <>
                        <div className="info-card">
                            <h4>Vesting Status</h4>
                            <div className="status">{getVestingStatus()}</div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${calculateProgress()}%` }}
                                ></div>
                            </div>
                            <div className="progress-text">{calculateProgress().toFixed(1)}% Complete</div>
                        </div>

                        <div className="info-card">
                            <h4>Vesting Details</h4>
                            <div className="detail-row">
                                <span>Total Amount:</span>
                                <span>{parseFloat(vestingSchedule.totalAmount).toFixed(4)} VTK</span>
                            </div>
                            <div className="detail-row">
                                <span>Released:</span>
                                <span>{parseFloat(vestingSchedule.releasedAmount).toFixed(4)} VTK</span>
                            </div>
                            <div className="detail-row">
                                <span>Start Date:</span>
                                <span>{formatDate(vestingSchedule.startTime)}</span>
                            </div>
                            <div className="detail-row">
                                <span>Duration:</span>
                                <span>{formatDuration(vestingSchedule.vestingDuration)}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="info-card">
                        <h4>No Vesting Schedule</h4>
                        <p>You don't have an active vesting schedule.</p>
                    </div>
                )}

                {agreement && agreement.isSigned ? (
                    <div className="info-card">
                        <h4>Agreement Status</h4>
                        <div className="agreement-signed">
                            ✅ Agreement Signed
                        </div>
                        <div className="detail-row">
                            <span>Signed on:</span>
                            <span>{formatDate(agreement.timestamp)}</span>
                        </div>
                        <div className="detail-row">
                            <span>IPFS Hash:</span>
                            <span className="hash-display">{agreement.ipfsHash.slice(0, 20)}...</span>
                        </div>
                    </div>
                ) : (
                    <div className="info-card">
                        <h4>Agreement Status</h4>
                        <div className="agreement-not-signed">
                            ❌ Agreement Not Signed
                        </div>
                        <p>You need to sign an agreement before releasing tokens.</p>
                    </div>
                )}
            </div>

            <div className="actions">
                <button
                    onClick={releaseTokens}
                    disabled={
                        isReleasing || 
                        parseFloat(releasableAmount) <= 0 || 
                        !agreement?.isSigned ||
                        !vestingSchedule?.isActive
                    }
                    className="release-button"
                >
                    {isReleasing ? 'Releasing...' : `Release ${parseFloat(releasableAmount).toFixed(4)} VTK`}
                </button>

                <button
                    onClick={loadVestingData}
                    disabled={isLoading}
                    className="refresh-button"
                >
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default VestingDashboard;