import React, { useState, useEffect } from 'react';
import WalletConnection from './components/WalletConnection';
import DocumentUpload from './components/DocumentUpload';
import VestingDashboard from './components/VestingDashboard';
import './App.css';

function App() {
    const [connectedAddress, setConnectedAddress] = useState('');
    const [agreementSigned, setAgreementSigned] = useState(false);

    const handleWalletConnect = (address) => {
        setConnectedAddress(address);
    };

    const handleAgreementSigned = (ipfsHash, txHash) => {
        setAgreementSigned(true);
        console.log('Agreement signed:', { ipfsHash, txHash });
    };

    // Check if wallet is already connected on page load
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        setConnectedAddress(accounts[0]);
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                }
            }
        };

        checkConnection();
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Token Vesting dApp</h1>
                <p>Secure token vesting with IPFS document signing</p>
            </header>

            <main className="App-main">
                <div className="container">
                    <section className="wallet-section">
                        <WalletConnection 
                            onConnect={handleWalletConnect}
                            connectedAddress={connectedAddress}
                        />
                    </section>

                    {connectedAddress && (
                        <>
                            <section className="document-section">
                                <DocumentUpload 
                                    onAgreementSigned={handleAgreementSigned}
                                    connectedAddress={connectedAddress}
                                />
                            </section>

                            <section className="dashboard-section">
                                <VestingDashboard 
                                    connectedAddress={connectedAddress}
                                    agreementSigned={agreementSigned}
                                />
                            </section>
                        </>
                    )}
                </div>
            </main>

            <footer className="App-footer">
                <p>Built with React, Solidity, and IPFS</p>
            </footer>
        </div>
    );
}

export default App;