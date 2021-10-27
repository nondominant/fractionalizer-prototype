import * as web3 from '@solana/web3.js';
import { ID } from './SmartContract.tsx';
import {useEffect, useState} from "react";
import * as nacl from 'tweetnacl';
import * as splToken from '@solana/spl-token';
import bs58 from 'bs58';
import * as borsh from 'borsh';
import Base58 from "base-58";
import {KeyPair, Signer, PublicKey, Transaction} from '@solana/web3.js';

type Event = "connect" | "disconnect";

interface Phantom {
  connect: () => Promise<void>;
  on: (event: Event, callback: () => void) => void;
  disconnect: () => Promise<void>;
}


export const NFT = () => {

  // Connect to cluster
  const connection = new web3.Connection(
    'http://127.0.0.1:8899',
  //   'https://api.testnet.solana.com',
    'confirmed',
  );
const generateWallet = async (): Promise<KeyPair> => {

  let newWallet = web3.Keypair.generate();
  let newAirdropSignature = await connection.requestAirdrop(
    newWallet.publicKey,
    web3.LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(newAirdropSignature);
  return newWallet;
}

const printAccountInfo = (info: web3.AccountInfo) => {
  console.log("{");
  console.log("address:", info.address.toString());
  console.log("owner:", info.owner.toString());
  console.log("tokens:", info.amount.toString());
  console.log("}");
}

const generateMint = async ( authorityWallet: KeyPair): Promise<KeyPair> => {
  // Create new token mint
  const mint = await splToken.Token.createMint(
    connection,
   authorityWallet,
   authorityWallet.publicKey, //publickey??
   authorityWallet.publicKey,
    0,
    splToken.TOKEN_PROGRAM_ID,
  );
  return mint;
}

const [nftaccount, setNftaccount] = useState<PublicKey | undefined>(undefined);
const [tempaccount, setTempaccount] = useState<PublicKey | undefined>(undefined);
const [tempsigner, setTempsigner] = useState("");
const [fractaccount, setFractaccount] = useState<PublicKey | undefined>(undefined);
const [mintaccount, setMintaccount] = useState("");
const [vault, setVault] = useState<PublicKey | undefined>(undefined);
const [vaultsigner, setVaultsigner] = useState("");

const testAsync = async (): Promise<string> => {

//airdrop to the phantom wallet currently connected
var phantomAirdropSignature = await connection.requestAirdrop(
  window.solana.publicKey,
  web3.LAMPORTS_PER_SOL,
);
// Wait for airdrop confirmation
const sig = await connection.confirmTransaction(phantomAirdropSignature);

let WalletA = await generateWallet();
let mintA = await generateMint(WalletA);
const vaultJSON = "[" + WalletA.secretKey.toString() + "]";
setVaultsigner(vaultJSON);

let WalletFractionalizer = await generateWallet();
let mintFractionalizer = await generateMint(WalletFractionalizer);
let tempWallet = await generateWallet();

const vaultAccount = await mintA.getOrCreateAssociatedAccountInfo(
  WalletA.publicKey,
);
setVault(vaultAccount.address);

//save the public key of the temp account to use for creating transfer instructions
const tempAccount = await mintFractionalizer.getOrCreateAssociatedAccountInfo(
  tempWallet.publicKey,
);
setTempaccount(tempAccount.address);
//save the secret key of the temp wallet owner so it can be used to sign transactions
const asJSON = "[" + tempWallet.secretKey.toString() + "]";
setTempsigner(asJSON);

const PhantomFractAccount = await mintFractionalizer.getOrCreateAssociatedAccountInfo(
  window.solana.publicKey,
);
// save the public key into a state variable so it can be 
// used to send tokens to
setFractaccount(PhantomFractAccount.address);


const PhantomTokenAccountA = await mintA.getOrCreateAssociatedAccountInfo(
  window.solana.publicKey,
);


await mintFractionalizer.mintTo(
  tempAccount.address,
  WalletFractionalizer.publicKey,
  [],
  100,
);

await mintA.mintTo(
  PhantomTokenAccountA.address,
  WalletA.publicKey,
  [],
  1,
);
setNftaccount(PhantomTokenAccountA.address)

const nftAccountInfo: web3.AccountInfo = await mintA.getAccountInfo(PhantomTokenAccountA.address);
console.log("------------------------------------------------");
console.log("User Account holding the NFT to be fractionalized");
printAccountInfo(nftAccountInfo);

const fractAccountInfo: web3.AccountInfo = await mintFractionalizer.getAccountInfo(
PhantomFractAccount.address
);
console.log("------------------------------------------------");
console.log("User Account to recieve 100 fractional tokens");
printAccountInfo(fractAccountInfo);

const VaultAccountInfo: web3.AccountInfo = await mintA.getAccountInfo(
vaultAccount.address
);
console.log("------------------------------------------------");
console.log("(Vault) Program Account to store NFT in exchange for fractional tokens");
printAccountInfo(VaultAccountInfo);

const tempAccountInfo: web3.AccountInfo = await mintFractionalizer.getAccountInfo(
tempAccount.address
);
console.log("------------------------------------------------");
console.log("(burn) Program Account to burn fractional tokens when redeeming NFT");
printAccountInfo(tempAccountInfo);

}

const fractionalize = async (): Promise<string> => {
//  const [nftaccount, setNftaccount] = useState("");
//  const [tempaccount, setTempaccount] = useState("");
//  const [tempsigner, setTempsigner] = useState("");
//  const [fractaccount, setFractaccount] = useState("");
//  const [mintaccount, setMintaccount] = useState("");

  const secret = Uint8Array.from(JSON.parse(tempsigner));
  const fromWallet = web3.Keypair.fromSecretKey(secret);
  const fromTokenAccount: PublicKey = tempaccount; 
  const toTokenAccount: PublicKey = fractaccount;

  const nftAccount: PublicKey = nftaccount;
  const vaultAccount: PublicKey = vault;
  const vaultSecret = Uint8Array.from(JSON.parse(vaultsigner));
  const vaultSigner = web3.Keypair.fromSecretKey(vaultSecret);

  //send NFT from nft account to vault
  const tx2 = new web3.Transaction();                                  
  const ix2 = splToken.Token.createTransferInstruction(                   
      splToken.TOKEN_PROGRAM_ID,                                                
      nftAccount,                                                 
      vaultAccount,                                                   
      window.solana.publicKey,                                                     
      [],                                                                       
      1,                                                                        
    )                                                                           
  tx2.add(ix2); 
  // Setting the variables for the transaction                                  
  tx2.feePayer = await window.solana.publicKey;                        
  let blockhashObj2 = await connection.getRecentBlockhash();                     
  tx2.recentBlockhash = await blockhashObj2.blockhash;                     
  let signed = await window.solana.signTransaction(tx2);               
    // The signature is generated                                               
  const sig2 = await connection.sendRawTransaction(signed.serialize());                      
  console.log("TRANSACTION", sig2); 

//send tokens from temp account to fract account
  const tx = new web3.Transaction();                                  
  const ix = splToken.Token.createTransferInstruction(                   
      splToken.TOKEN_PROGRAM_ID,                                                
      fromTokenAccount,                                                 
      toTokenAccount,                                                   
      fromWallet.publicKey,                                                     
      [],                                                                       
      100,                                                                        
    )                                                                           
  tx.add(ix); 
  const sig = await web3.sendAndConfirmTransaction(                      
    connection,                                                                 
    tx,                                                               
    [fromWallet],                                                               
    {commitment: 'confirmed'},                                                  
  );                                                                            
  console.log("TRANSACTION", sig); 
}

const reverse = async (): Promise<string> => {
  const secret = Uint8Array.from(JSON.parse(tempsigner));
  console.log(secret)
  const toWallet = web3.Keypair.fromSecretKey(secret);
  const toTokenAccount: PublicKey = tempaccount; 
  const fromTokenAccount: PublicKey = fractaccount;

  const nftAccount: PublicKey = nftaccount;
  const vaultAccount: PublicKey = vault;
  const vaultSecret = Uint8Array.from(JSON.parse(vaultsigner));
  const vaultSigner = web3.Keypair.fromSecretKey(vaultSecret);

//send tokens from fract account to temp account
  const tx = new web3.Transaction();                                  
  const ix = splToken.Token.createTransferInstruction(                   
      splToken.TOKEN_PROGRAM_ID,                                                
      fromTokenAccount,                                                 
      toTokenAccount,                                                   
      window.solana.publicKey,                                                     
      [],                                                                       
      100,                                                                        
    )                                                                           
  tx.add(ix); 
  // Setting the variables for the transaction                                  
  tx.feePayer = await window.solana.publicKey;                        
  let blockhashObj = await connection.getRecentBlockhash();                     
  tx.recentBlockhash = await blockhashObj.blockhash;                     
  let signed = await window.solana.signTransaction(tx);               
    // The signature is generated                                               
  const sig3 = await connection.sendRawTransaction(signed.serialize());                      
    // Confirm whether the transaction went through or not
  console.log("TRANSACTION", sig3); 

  //send nft from vault to nft account
  const tx2 = new web3.Transaction();                                  
  const ix2 = splToken.Token.createTransferInstruction(                   
      splToken.TOKEN_PROGRAM_ID,                                                
      vaultAccount,                                                 
      nftAccount,                                                   
      vaultSigner.publicKey,                                                     
      [],                                                                       
      1,                                                                        
    )                                                                           
  tx2.add(ix2); 
  const sig2 = await web3.sendAndConfirmTransaction(                      
    connection,                                                                 
    tx2,                                                               
    [vaultSigner],                                                               
    {commitment: 'confirmed'},                                                  
  );                                                                            
  console.log("TRANSACTION", sig2); 
}
  return (
  <>
      <button
        onClick={testAsync}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
      generate test NFT
      </button>
      <button
        onClick={fractionalize}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
      fractionalize NFT
      </button>
      <button
        onClick={reverse}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
      reverse fractionalization
      </button>
  </>
  )


}


export default NFT;
