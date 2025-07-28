import React, { useState } from 'react';
import { ipfsService } from '../utils/ipfs';
import { contractService } from '../utils/contract';

const DocumentUpload = ({ onAgreementSigned, connectedAddress }) => {
    const [document, setDocument] = useState('');
    const [file, setFile] = useState(null);
    const [ipfsHash, setIpfsHash] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileUpload = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');
        setIsUploading(true);

        try {
            const result = await ipfsService.uploadFile(selectedFile);
            setUploadResult(result);
            setIpfsHash(result.hash);
            console.log('File uploaded to IPFS:', result);
        } catch (error) {
            setError('Failed to upload file: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleTextUpload = async () => {
        if (!document.trim()) {
            setError('Please enter document content');
            return;
        }

        setError('');
        setIsUploading(true);

        try {
            const hash = await ipfsService.storeContent(document);
            setUploadResult({
                hash,
                name: 'Document.txt',
                size: document.length,
                type: 'text/plain'
            });
            setIpfsHash(hash);
            console.log('Document uploaded to IPFS:', hash);
        } catch (error) {
            setError('Failed to upload document: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const signAgreement = async () => {
        if (!ipfsHash) {
            setError('No document hash available');
            return;
        }

        if (!connectedAddress) {
            setError('Please connect your wallet first');
            return;
        }

        setError('');
        setIsSigning(true);

        try {
            const txHash = await contractService.signAgreement(ipfsHash);
            onAgreementSigned(ipfsHash, txHash);
            console.log('Agreement signed with transaction:', txHash);
        } catch (error) {
            setError('Failed to sign agreement: ' + error.message);
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="document-upload">
            <h3>Document Upload & Signing</h3>
            
            <div className="upload-section">
                <div className="upload-method">
                    <h4>Method 1: Upload File</h4>
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".txt,.pdf,.doc,.docx"
                        disabled={isUploading}
                    />
                </div>

                <div className="upload-method">
                    <h4>Method 2: Paste Text</h4>
                    <textarea
                        value={document}
                        onChange={(e) => setDocument(e.target.value)}
                        placeholder="Paste your agreement/contract text here..."
                        rows={6}
                        disabled={isUploading}
                    />
                    <button 
                        onClick={handleTextUpload}
                        disabled={isUploading || !document.trim()}
                        className="upload-button"
                    >
                        {isUploading ? 'Uploading...' : 'Upload to IPFS'}
                    </button>
                </div>
            </div>

            {uploadResult && (
                <div className="upload-result">
                    <h4>Upload Successful!</h4>
                    <div className="result-details">
                        <p><strong>File:</strong> {uploadResult.name}</p>
                        <p><strong>Size:</strong> {uploadResult.size} bytes</p>
                        <p><strong>IPFS Hash:</strong> 
                            <code>{uploadResult.hash}</code>
                        </p>
                        <p><strong>Gateway URL:</strong> 
                            <a 
                                href={ipfsService.getGatewayUrl(uploadResult.hash)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                View on IPFS
                            </a>
                        </p>
                    </div>
                </div>
            )}

            {ipfsHash && (
                <div className="signing-section">
                    <button
                        onClick={signAgreement}
                        disabled={isSigning || !connectedAddress}
                        className="sign-button"
                    >
                        {isSigning ? 'Signing Agreement...' : 'Sign Agreement on Blockchain'}
                    </button>
                </div>
            )}

            {error && (
                <div className="error-message">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default DocumentUpload;