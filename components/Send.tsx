import * as web3 from '@solana/web3.js';
import { ID } from './SmartContract.tsx';
import {useEffect, useState} from "react";
import * as nacl from 'tweetnacl';
import * as splToken from '@solana/spl-token';
import bs58 from 'bs58';
import * as borsh from 'borsh';
import Base58 from "base-58";
import KeyPair from '@solana/web3.js';

type Event = "connect" | "disconnect";

interface Phantom {
  connect: () => Promise<void>;
  on: (event: Event, callback: () => void) => void;
  disconnect: () => Promise<void>;
}


export const Send = () => {
  const [conn, setConn] = useState(1);

const generateNFT = () => {
  if(conn){
    setConn(conn + 1);
  }
}


const testAsync = async (): Promise<string> => {
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

const generateMint = async ( authorityWallet: KeyPair): Promise<KeyPair> => {
  // Create new token mint
  const mint = await splToken.Token.createMint(
    connection,
   authorityWallet,
   authorityWallet.publicKey, //publickey??
   authorityWallet.publicKey,
    1,
    splToken.TOKEN_PROGRAM_ID,
  );
  return mint;
}

let WalletA = await generateWallet();

let mintA = await generateMint(WalletA);

const TokenAccountA = await mintA.getOrCreateAssociatedAccountInfo(
  WalletA.publicKey,
);
const PhantomTokenAccountA = await mintA.getOrCreateAssociatedAccountInfo(
  window.solana.publicKey,
);

await mintA.mintTo(
  PhantomTokenAccountA.address,
  WalletA.publicKey,
  [],
  10000,
);

const transactionA = new web3.Transaction();
const transInstA = splToken.Token.createTransferInstruction(
    splToken.TOKEN_PROGRAM_ID,
    PhantomTokenAccountA.address,
    TokenAccountA.address,
    window.solana.publicKey,
    [],
    1,
  )
transactionA.add(transInstA);
// Sign transaction, broadcast, and confirm

transactionA.feePayer = await window.solana.publicKey;
let blockhashObjA = await connection.getRecentBlockhash();
transactionA.recentBlockhash = await blockhashObjA.blockhash;
let signedA = await window.solana.signTransaction(transactionA);
  // The signature is generated
await connection.sendRawTransaction(signedA.serialize());
  // Confirm whether the transaction went through or not

let fromWallet = await generateWallet();
  // Generate a new wallet to receive newly minted token
  const toWallet = web3.Keypair.generate();
  const WalletY = web3.Keypair.generate();
  const WalletX = web3.Keypair.generate();
  const escrow = web3.Keypair.generate();

  console.log("spl token program id", splToken.TOKEN_PROGRAM_ID);
  // Create new token mint
  const mint = await splToken.Token.createMint(
    connection,
    fromWallet,
    fromWallet.publicKey, //publickey??
    fromWallet.publicKey,
    1,
    splToken.TOKEN_PROGRAM_ID,
  );

    //init y accounts
      console.log("wallet y = ", WalletY.publicKey.toString());
      let YAirdropSignature = await connection.requestAirdrop(
        WalletY.publicKey,
        web3.LAMPORTS_PER_SOL,
      );
      const sigY = await connection.confirmTransaction(YAirdropSignature);
     const balY = await connection.getBalance(WalletY.publicKey, "confirmed");
     console.log("Wallet y balance", balY);
      const mintY = await splToken.Token.createMint(
        connection,
        WalletY,
        WalletY.publicKey,
        WalletY.publicKey,
        1,
        splToken.TOKEN_PROGRAM_ID,
        );

      const TokenAccountY = await mintY.getOrCreateAssociatedAccountInfo(
        WalletY.publicKey,
      );

      await mintY.mintTo(
        TokenAccountY.address,
        WalletY.publicKey,
        [],
        10000,
      );

    //init x accounts
      let XAirdropSignature = await connection.requestAirdrop(
        WalletX.publicKey,
        web3.LAMPORTS_PER_SOL,
      );
      const sigX = await connection.confirmTransaction(XAirdropSignature);
      const mintX = await splToken.Token.createMint(
        connection,
        WalletX,
        WalletX.publicKey,
        WalletX.publicKey,
        1,
        splToken.TOKEN_PROGRAM_ID,
        );

      const TokenAccountX = await mintX.getOrCreateAssociatedAccountInfo(
        WalletX.publicKey,
      );

      await mintX.mintTo(
        TokenAccountX.address,
        WalletX.publicKey,
        [],
        10000,
      );

    //init escrow accounts
    //

      let escrowAirdropSignature = await connection.requestAirdrop(
        escrow.publicKey,
        web3.LAMPORTS_PER_SOL,
      );

      const escrowTokenAccountX = await mintX.getOrCreateAssociatedAccountInfo(
        escrow.publicKey,
      );


      const escrowTokenAccountY = await mintY.getOrCreateAssociatedAccountInfo(
        escrow.publicKey,
      );

      // Get the token account of the fromWallet Solana address, if it does not exist, create it
      const fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        fromWallet.publicKey,
      );

  //get the token account of the toWallet Solana address, if it does not exist, create it
  const toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
    window.solana.publicKey,
  );
  console.log("from wallet", fromWallet.publicKey.toString());
  console.log("to wallet", toWallet.publicKey.toString());
  console.log("token account (from)", fromTokenAccount.address.toString());
  console.log("token account (to)", toTokenAccount.address.toString());

  // Minting 1 new token to the "fromTokenAccount" account we just returned/created
  await mint.mintTo(
    fromTokenAccount.address,
    fromWallet.publicKey,
    [],
    10000,
  );
  console.log("attempting to transfer nft to smart contract");
//smart contract account that will hold token 
  const smartContractTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
    ID,
  );

  // Add token transfer instructions to transaction
  const transaction = new web3.Transaction().add(
    splToken.Token.createTransferInstruction(
      splToken.TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      //may need to create an associated account 
      //before transaction can be executed
      smartContractTokenAccount.address,
      fromWallet.publicKey,
      [],
      100,
    ),
  );
  // Sign transaction, broadcast, and confirm
  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
    {commitment: 'confirmed'},
  );
  console.log("successfully transferred nft to smart contract, trans: ", signature);






  const transaction2 = new web3.Transaction();

  const transInst = splToken.Token.createTransferInstruction(
      splToken.TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      [],
      7,
    )
  transaction2.add(transInst);
  // Sign transaction, broadcast, and confirm
  const signature2 = await web3.sendAndConfirmTransaction(
    connection,
    transaction2,
    [fromWallet],
    {commitment: 'confirmed'},
  );
  console.log("TRANSACTION", signature2);
//clone
//clone
//testToken = createMint
//testAccount = testToken.createAccount(testAccountOwner.publickey)
  const randOwner = await web3.Keypair.generate();
  var airdrop_rand = await connection.requestAirdrop(
    randOwner.publicKey,
    web3.LAMPORTS_PER_SOL,
  );
  // Wait for airdrop confirmation
  await connection.confirmTransaction(airdrop_rand);
  console.log("airdrop to rand");

  const testTokenAccount = await mint.createAccount(randOwner.publicKey);
  console.log("un-owned account", testTokenAccount.toString());

  const newOwner = web3.Keypair.generate();
  const transaction3 = new web3.Transaction().add(
    splToken.Token.createSetAuthorityInstruction(
      splToken.TOKEN_PROGRAM_ID,
      testTokenAccount,
      window.solana.publicKey,
      'AccountOwner',
      randOwner.publicKey,
      [],
    ),
  );


  // Sign transaction, broadcast, and confirm
  const signature3 = await web3.sendAndConfirmTransaction(
    connection,
    transaction3,
    [randOwner],
    {commitment: 'confirmed'},
  );
  console.log("TRANSACTION",signature3);

  const transaction4 = new web3.Transaction().add(
    splToken.Token.createSetAuthorityInstruction(
      splToken.TOKEN_PROGRAM_ID,
      testTokenAccount,
      newOwner.publicKey,
      'AccountOwner',
      window.solana.publicKey,
      [],
    ),
  );
  
  // Setting the variables for the transaction
  transaction4.feePayer = await window.solana.publicKey;
  let blockhashObj = await connection.getRecentBlockhash();
  transaction4.recentBlockhash = await blockhashObj.blockhash;
  let signed = await window.solana.signTransaction(transaction4);
    // The signature is generated
  await connection.sendRawTransaction(signed.serialize());
    // Confirm whether the transaction went through or not




}

  useEffect(() => {
    const isPhantomInstalled = window.solana && window.solana.isPhantom;
    const provider = window.solana;
    window.solana.connect();
    testAsync();
  }, [conn]);

  return (
  <>
      <button
        onClick={generateNFT}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
      franctionalize 
      </button>
  </>
  )


}


export default Send;
