import {
    WalletAdapterNetwork,
    WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import {
    ConnectionProvider,
    WalletProvider,
    useConnection,
    useWallet,
} from "@solana/wallet-adapter-react";
import {
    WalletModalProvider,
    WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { Button } from "@solana/wallet-adapter-react-ui/lib/types/Button";

import "../src/css/bootstrap.css";
import {
    GlowWalletAdapter,
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import fs from "fs";

import {
    clusterApiUrl,
    Transaction,
    SystemProgram,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Connection,
} from "@solana/web3.js";
import React, {
    FC,
    ReactNode,
    useMemo,
    useCallback,
    useState,
    useEffect,
} from "react";
import { actions, utils, programs, NodeWallet } from "@metaplex/js"; //Connection
import {
    Token,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    AccountInfo,
} from "@solana/spl-token";
import {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
} from "@metaplex-foundation/js";
import expect from "expect";
require("./App.css");
require("@solana/wallet-adapter-react-ui/styles.css");
let thelamports = 0;
let theWallet = "9m5kFDqgpf7Ckzbox91RYcADqcmvxW4MmuNvroD5H2r9";
function getWallet() {}
const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};

export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new LedgerWalletAdapter(),
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolletExtensionWalletAdapter(),
            new SolletWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content: FC = () => {
    const { publicKey, connected, connect, disconnect } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [nfts, setNFTs] = useState<any[]>([]);
    const [additionalData, setAdditionalData] = useState<any[]>([]);

    // const connection = new Connection("https://api.devnet.solana.com");
    // const metaplex = Metaplex.make(connection);
    const memoizedConnection = useMemo(() => {
        return new Connection("https://api.devnet.solana.com");
    }, []);

    // Memoize the Metaplex instance
    const metaplex = useMemo(() => {
        return Metaplex.make(memoizedConnection);
    }, [memoizedConnection]);

    useEffect(() => {
        // Fetch the wallet balance when the publicKey changes (wallet connects)
        const fetchData = async () => {
            try {
                if (publicKey) {
                    const balance = await memoizedConnection.getBalance(
                        publicKey
                    );
                    // Convert balance from lamports to SOL
                    const solBalance = balance / LAMPORTS_PER_SOL;
                    setBalance(solBalance);

                    const owner = publicKey;
                    const allNFTs = await metaplex
                        .nfts()
                        .findAllByOwner({ owner });
                    // Set the NFTs state only once with initial data
                    if (nfts.length === 0) {
                        setNFTs(allNFTs);
                    }

                    // Fetch additional data only if additionalData is empty
                    if (additionalData.length === 0) {
                        fetchMetadata(allNFTs);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        const fetchMetadata = async (nfts: any[]) => {
            const nftCache: Record<string, any> = {};
            const newData: any[] = [];

            for (const nft of nfts) {
                try {
                    const nftName = nft.name; // Convert NFT ID to a string

                    if (nftCache[nftName]) {
                        // Data is already in cache, use it
                        newData.push(nftCache[nftName]);
                    } else {
                        const response = await fetch(nft.uri);
                        if (response.ok) {
                            const data = await response.json();
                            newData.push(data);

                            // Cache the fetched data
                            nftCache[nftName] = data;
                        } else {
                            console.error(
                                `Failed to fetch data from ${nft.uri}`
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error fetching data from ${nft.uri}: ${error}`
                    );
                }
            }

            // Update the state with the fetched data
            setAdditionalData(newData);
        };

        if (connected && publicKey) {
            fetchData(); // Fetch data only when connected, publicKey is available, and additionalData is empty
        }
    }, [connected, publicKey, nfts, memoizedConnection, additionalData]);

    const renderNFTs = () => {
        if (nfts.length === 0) {
            return <p>No NFTs found.</p>;
        }

        return additionalData.map((nft, index) => (
            
            <div key={index}>
                <div className="breaker"></div>
                <ul className="supply-list">
                    <li className="supply-item">
                        <h5>Assets</h5>
                        <img
                            className="nft-image"
                            src={nft.image}
                            alt={""}
                        />
                        <h6>{nft.name}</h6>
                    </li>
                    <li className="supply-item">
                        <h5>Amount</h5>
                        <h6>20.5151 SOL($453.00)</h6>
                        <div className="blank"></div>
                        
                        
                    </li>
                    <li className="supply-item">
                        <h5>APY</h5>
                        <h6>2.35%</h6>
                        <div className="blank"></div>
                        
                    </li>
                    <li className="supply-item">
                        <button>Repay</button>
                    </li>
                </ul>
                
            </div>
        ));
    };
    console.log("NFTS", nfts);
    console.log("METADATA", additionalData);
    return (
        <div className="App">
            <div className="navbar">
                <div className="navbar-inner">
                    <a id="title" className="brand" href="/">
                        ABUBAWEH
                    </a>
                    <a className="brand" href="/">
                        Dashboard
                    </a>
                    <a className="brand" href="/">
                        Portfolio
                    </a>
                    <a className="brand" href="/">
                        Markets
                    </a>
                    <ul className="nav pull-right">
                        <li>
                            <WalletMultiButton />
                        </li>
                    </ul>
                </div>
            </div>
            <div className="headerbar">
                <ul className="headerbar-list">
                    <li className="headerbar-item">
                        <h3>Appx. Net Worth</h3>
                        <h4>$500,000.00</h4>
                    </li>
                    <li className="headerbar-item">
                        <h3>Total Staked</h3>
                        <h4>$10,000.00</h4>
                    </li>
                    <li className="headerbar-item">
                        <h3>APY</h3>
                        <h4>2.35%</h4>
                    </li>
                </ul>
            </div>
            <hr />
            <br></br>
            <div></div>
            <div>
                {!connected ? (
                    <div>
                        <p>Wallet not connected</p>
                    </div>
                ) : (
                    <div>
                        <p>Wallet connected</p>
                        {balance !== null && (
                            <p>Wallet Balance: {balance.toFixed(5)} SOL</p>
                        )}

                        {renderNFTs()}
                    </div>
                )}
            </div>
            {connected && (
                <div className="bottombar">
                    <div className="row">
                        <div className="column">
                            <ul className="btmbar-list">
                                <li className="btmbar-item">
                                    <h3>Your Supplies:</h3>
                                    <ul className="supply-list">
                                        <li className="supply-item">
                                            <h5>Assets</h5>
                                            <h6> token name</h6>
                                        </li>
                                        <li className="supply-item">
                                            <h5>Amount Supply</h5>
                                            <h6>20.5151 ($453.00)</h6>
                                        </li>
                                        <li className="supply-item">
                                            <h5>APY</h5>
                                            <h6>2.35%</h6>
                                        </li>
                                        <li className="supply-item">
                                            <button>Withdraw</button>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div className="column">
                            <ul className="btmbar-list">
                                <li className="btmbar-item">
                                    <h3>Your Borrows:</h3>
                                    <ul className="supply-list">
                                        <li className="supply-item">
                                            <h5>Assets</h5>
                                            <h6> token name</h6>
                                        </li>
                                        <li className="supply-item">
                                            <h5>Amount Borrowed</h5>
                                            <h6>20.5151 ($453.00)</h6>
                                        </li>
                                        <li className="supply-item">
                                            <h5>APY</h5>
                                            <h6>2.35%</h6>
                                        </li>
                                        <li className="supply-item">
                                            <button>Repay</button>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="row">
                        <div className="column">
                            <ul className="btmbar-list">
                                <li className="btmbar-item">
                                    <h3>Asset to Supply:</h3>
                                    <ul className="supply-list">
                                        <li className="supply-item">
                                            <h5>Assets</h5>
                                            <h6> token name</h6>
                                        </li>
                                        <li className="supply-item">
                                            <h5>Amount Supply</h5>
                                            <h6>20.5151 ($453.00)</h6>
                                        </li>
                                        <li className="supply-item">
                                            <h5>APY</h5>
                                            <h6>2.35%</h6>
                                        </li>
                                        <li className="supply-item">
                                            <button>Supply</button>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div className="column">
                            <ul className="btmbar-list">
                                <li className="btmbar-item">
                                    <h3>Assets to borrow:</h3>
                                    {renderNFTs()}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
