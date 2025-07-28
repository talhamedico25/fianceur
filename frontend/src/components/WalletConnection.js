import React, { useState, useEffect } from 'react';
import { contractService } from '../utils/contract';

const WalletConnection = ({ onConnect, connectedAddress }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const connectWallet = async () => {
        setIsConnecting(true);
        setError('');
        
        try {
            const address = await contractService.connectWallet();
            onConnect(address);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsConnecting(false);
        }
    };

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="wallet-connection">
            <div className="wallet-status">
                {connectedAddress ? (
                    <div className="connected">
                        <div className="status-indicator connected"></div>
                        <span>Connected: {formatAddress(connectedAddress)}</span>
                    </div>
                ) : (
                    <div className="disconnected">
                        <div className="status-indicator disconnected"></div>
                        <span>Not Connected</span>
                    </div>
                )}
            </div>
            
            {!connectedAddress && (
                <button 
                    onClick={connectWallet} 
                    disabled={isConnecting}
                    className="connect-button"
                >
                    {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                </button>
            )}
            
            {error && (
                <div className="error-message">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default WalletConnection;