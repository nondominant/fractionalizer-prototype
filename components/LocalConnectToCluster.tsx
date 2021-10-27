import * as web3 from '@solana/web3.js';
import {useEffect, useState} from "react";
import * as nacl from 'tweetnacl';
import * as splToken from '@solana/spl-token';
import bs58 from 'bs58';

type Event = "connect" | "disconnect";

interface Phantom {
  connect: () => Promise<void>;
  on: (event: Event, callback: () => void) => void;
  disconnect: () => Promise<void>;
}


export const MyComp = () => {
  const [fraction, setFraction] = useState(false);
  const [apple, setApple] = useState(false);

  const fractionalizeHandler = () => {
    setFraction(true);
    console.log("fractionalizing!!!");
  }
  const appleHandler = () => {
    if(apple){
      setApple(false);
    } else {
      setApple(true);
    }
  }
  const testAsync = async (): Promise<string> => {
  // Connect to cluster
  const connection = new web3.Connection(
//    'https://api.testnet.solana.com',
    'http://127.0.0.1:8899',
    'confirmed',
  );

  // Generate a new wallet keypair and airdrop SOL
  var fromWallet = web3.Keypair.generate();
  var fromAirdropSignature = await connection.requestAirdrop(
    fromWallet.publicKey,
    web3.LAMPORTS_PER_SOL,
  );
  //airdrop to the phantom wallet currently connected
  var phantomAirdropSignature = await connection.requestAirdrop(
    window.solana.publicKey,
    web3.LAMPORTS_PER_SOL,
  );
  // Wait for airdrop confirmation
  await connection.confirmTransaction(fromAirdropSignature);
  const sig = await connection.confirmTransaction(phantomAirdropSignature);
  console.log("airdrop to phantom: transaction signature", window.solana.balance);

  // Generate a new wallet to receive newly minted token
  const toWallet = web3.Keypair.generate();

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
  console.log("mint successful, now transferring to phantom wallet");

  // Add token transfer instructions to transaction
  const transaction = new web3.Transaction().add(
    splToken.Token.createTransferInstruction(
      splToken.TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      toTokenAccount.address,
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

//clone
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
  console.log("first transfer");

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


//  const newOwner = Keypair.generate();                                 
//     await testToken.setAuthority(
//       testAccount,
//       newOwner.publicKey,                                                
//       'AccountOwner',                                                    
//       testAccountOwner,                                                  
//       [],                                                                
//     );
//    async setAuthority(
//    account: PublicKey,
//    newAuthority: PublicKey | null,
//    authorityType: AuthorityType,
//    currentAuthority: any,
//    multiSigners: Array<Signer>,
//clone
  console.log('SIGNATURE', signature);
  console.log("transfer complete, phantom wallet now has tokens");
  //deploying smart contract to local testnet


}
//      const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
//
//      let slot = await connection.getSlot();
//
//      console.log("slot",slot);
//
//      console.log("sign with public key", window.solana.publicKey.toBase58());
//
//      const bal = await connection.getBalance(window.solana.publicKey, "confirmed");
//
//      console.log("balance", bal);
//
//      const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey(
//        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
//      );
//
//      const payerAccount = new solanaWeb3.Account();
//
//      const SECRET_KEY = new Uint8Array([
//      37, 21, 197, 185, 105, 201, 212, 148, 164, 108, 251, 159, 174, 252, 43, 246,
//      225, 156, 38, 203, 99, 42, 244, 73, 252, 143, 34, 239, 15, 222, 217, 91, 132,
//      167, 105, 60, 17, 211, 120, 243, 197, 99, 113, 34, 76, 127, 190, 18, 91, 246,
//      121, 93, 189, 55, 165, 129, 196, 104, 25, 157, 209, 168, 165, 149,
//      ]);
//
//  // Construct wallet keypairs
//  var fromWallet = solanaWeb3.Keypair.fromSecretKey(SECRET_KEY);
//  var toWallet = solanaWeb3.Keypair.generate();
//  // Construct my token class
//  var myMint = new solanaWeb3.PublicKey("DLWFjMcMgd4HmLxWWfxebC96DepDGHJY3L4dGHwAS7Qi");
//  var myToken = new splToken.Token(
//    connection,
//    myMint,
//    splToken.TOKEN_PROGRAM_ID,
//    fromWallet
//  );
//  // Create associated token accounts for my token if they don't exist yet
//  var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
//    fromWallet.publicKey
//  )
//  var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
//    toWallet.publicKey
//  )
//  // Add token transfer instructions to transaction
//  var transaction = new solanaWeb3.Transaction()
//    .add(
//      splToken.Token.createTransferInstruction(
//        splToken.TOKEN_PROGRAM_ID,
//        fromTokenAccount.address,
//        toTokenAccount.address,
//        fromWallet.publicKey,
//        [],
//        0
//      )
//    );
//  // Sign transaction, broadcast, and confirm
//  var signature = await solanaWeb3.sendAndConfirmTransaction(
//    connection,
//    transaction,
//    [fromWallet]
//  );
//  console.log("SIGNATURE", signature);
//  console.log("SUCCESS");
//  }
  


  useEffect(() => {
    const isPhantomInstalled = window.solana && window.solana.isPhantom;
    console.log("phantom is installed ? ", isPhantomInstalled);
    const provider = window.solana;
    window.solana.connect();
    window.solana.on("connect", () => console.log("connected!!!!"));
    if(fraction){
      console.log(fraction);
      console.log("public key", window.solana.publicKey.toString());
    }
    if(apple){
      testAsync();
    }
  }, [fraction, apple]);

  return (
  <>
      <button
        onClick={appleHandler}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
        Apple me baby
      </button>
      <button
        onClick={fractionalizeHandler}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
        Fractionalize
      </button>
  </>
  )
}

export default MyComp;
