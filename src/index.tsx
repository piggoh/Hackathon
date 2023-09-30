import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { Jupiter, RouteInfo, TOKEN_LIST_URL } from "@jup-ag/core";
import { Connection, PublicKey } from "@solana/web3.js";

interface Token {
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI: string;
    tags: string[];
  }
  
  (async () => {
    const ENV = "mainnet-beta";
    const tokens: Token[] = await (await fetch(TOKEN_LIST_URL[ENV])).json();
})();


ReactDOM.render(


    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
