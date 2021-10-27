import * as web3 from '@solana/web3.js';
import { ID } from './SmartContract.tsx';
import {useEffect, useState} from "react";
import * as nacl from 'tweetnacl';
import * as splToken from '@solana/spl-token';
import bs58 from 'bs58';
import * as borsh from 'borsh';
import Base58 from "base-58";

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
  console.log("smart contract", ID.toString());
  // Connect to cluster
  const connection = new web3.Connection(
    'http://127.0.0.1:8899',
 //   'https://api.testnet.solana.com',
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




const escrowProgramId = Uint8Array.from("4yBTZXsuz7c1X3PJF4PPCJr8G6HnNAgRvzAWVoFZMncH");

//  const initEscrowIx = new web3.TransactionInstruction({           
//    programId: escrowProgramId,                                 
//    keys: [                                                     
//        { pubkey: fromWallet.publicKey, isSigner: true, isWritable: false },
//        {                                                       
//            pubkey: tempXTokenAccountKeypair.publicKey,         
//            isSigner: false,                                    
//            isWritable: true                                    
//        },                                                      
//        {                                                       
//            pubkey: aliceYTokenAccountPubkey,                   
//            isSigner: false,                                    
//            isWritable: false                                   
//        },                                                      
//        { pubkey: escrowKeypair.publicKey, isSigner: false, isWritable: true },
//        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
//        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
//    ],                                                          
//    data: Buffer.from(Uint8Array.of.apply(Uint8Array, __spreadArray([0], new BN(terms.aliceExpectedAmount).toArray("le", 8), false)))
//  });                                                             
//                                                                
//  tx = new web3_js_1.Transaction().add(createTempTokenAccountIx, initTempAccountIx, transferXTokensToTempAccIx, createEscrowAccountIx, initEscrowIx);
//  console.log("Sending Alice's transaction...");
//                  connection.sendTransaction(tx, [aliceKeypair, tempXTokenAccountKeypair, escrowKeypair], 
//                  { skipPreflight: false, preflightCommitment: "confirmed" });

const expectedValue = new Buffer.alloc(2, 1);
const expectedValue58 = Base58.encode(expectedValue);
console.log("58 encoded data", expectedValue58, expectedValue);
const initEscrowIx = new web3.TransactionInstruction({           
  programId: escrowProgramId,                                 
  keys: [                                                     
      { pubkey: WalletX.publicKey, isSigner: true, isWritable: false },
      {                                                       
          pubkey: escrowTokenAccountX.address,         
          isSigner: false,                                    
          isWritable: true                                    
      },                                                      
      {                                                       
          pubkey: TokenAccountY.address,                   
          isSigner: false,                                    
          isWritable: false                                   
      },                                                      
      { pubkey: escrow.publicKey, isSigner: false, isWritable: true },
      { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: splToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ],                                                          
  data: Base58.encode(new Buffer.alloc(2, 1))
});                                                             
                                                              

  //data: Buffer.alloc(2, 1).toBase58() 

const initEscrowtx = new web3.Transaction().add(initEscrowIx);
console.log("Sending Alice's transaction...");
//  const escrow_success = await connection.sendTransaction(initEscrowtx, 
//  [WalletX], 
//  { skipPreflight: false, preflightCommitment: "confirmed" }
//  );
console.log("ESCROW initialized successfully");



//  // Wait for airdrop confirmation
//  const SEED = 'seed';
//
//  class GreetingAccount {
//    counter = 0;
//    constructor(fields: {counter: number} | undefined = undefined) {
//      if (fields) {
//        this.counter = fields.counter;
//      }
//    }
//  }
//
//  const GreetingSchema = new Map([
//    [GreetingAccount, {kind: 'struct', fields: [['counter', 'u32']]}],
//  ]);
//
//  const SIZE = borsh.serialize(
//    GreetingSchema,
//    new GreetingAccount(),
//  ).length;
//
//  const lamports = await connection.getMinimumBalanceForRentExemption(
//    SIZE,
//  ) * 1000;
//
//  //const programId = Uint8Array.from(ID);
//  const secretkey_program = Uint8Array.from(JSON.parse(
//  "[53,75,136,151,193,191,84,181,114,48,224,243,219,90,223,254,4,6,234,32,186,254,201,34,26,239,116,98,36,236,35,141,165,0,168,62,154,131,101,240,232,83,57,189,0,137,230,27,236,91,30,76,96,140,28,101,19,115,222,74,170,205,87,50]"
//  ));
//  const keypair_program = web3.Keypair.fromSecretKey(secretkey_program);
//  console.log("ID", ID.toString());
//  const uint8_ID = keypair_program.publicKey;
//  console.log("Uint8array", uint8_ID.toString());
//  const buffer_account_pubkey = await web3.PublicKey.createWithSeed(
//    window.solana.publicKey,
//    SEED,
//    keypair_program.publicKey,
//  );
//  await connection.requestAirdrop(
//    buffer_account_pubkey,
//    web3.LAMPORTS_PER_SOL,
//  );
//  console.log("buffer account public key", buffer_account_pubkey.toString());
//  console.log("program account public key", keypair_program.publicKey.toString());
//  console.log("program account type", typeof keypair_program);
//  console.log("program account public key type", typeof keypair_program.publicKey);
//
////  await web3.sendAndConfirmTransaction(
////    connection,
////    new web3.Transaction().add(
////      web3.SystemProgram.createAccountWithSeed({
////        fromPubkey: window.solana.publicKey,
////        basePubkey: window.solana.publicKey,
////        seed: SEED,
////        newAccountPubkey: buffer_account_pubkey,
////        lamports: lamports,
////        space: SIZE,
////        programId: Uint8Array.from(keypair_program.publicKey),
////      }),
////    ),
////    [window.solana]
////  );
//  const dummy = new Uint8Array(1);
//  console.log("dummy type = ", typeof dummy);
//  var isUint8 = dummy instanceof Uint8Array;
//  console.log("is u int 8 array ? ", isUint8);
//  const greeting_instruction = await new web3.TransactionInstruction({
//   // keys: [{pubkey: buffer_account_pubkey, isSigner: false, isWritable: true}],
//    keys: [],
//    programId: keypair_program.publicKey,
//   // data: Array.from(dummy),
//  });
//  const greeting_transaction = new web3.Transaction().add(greeting_instruction);
//
//  console.log("greeting smart contract");
//  await web3.sendAndConfirmTransaction(
//    connection,
//    greeting_transaction,
//    [window.solana],
//
//  );

//    greeting_transaction.feePayer = await window.solana.publicKey;
//    let greeting_blockhashObj = await connection.getRecentBlockhash();
//    greeting_transaction.recentBlockhash = await greeting_blockhashObj.blockhash;
//    let greeting_signed = await window.solana.signTransaction(greeting_transaction);
//    await connection.sendRawTransaction(greeting_signed.serialize());


//clone


//TODO check switch
//if (condition) { then }


//TODO use mint to create tokens

  var fract_Wallet = web3.Keypair.generate();
  var airdropSig = await connection.requestAirdrop(
    fract_Wallet.publicKey,
    web3.LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(airdropSig);
  const fract_mint = await splToken.Token.createMint(
    connection,
    fract_Wallet,
    fract_Wallet.publicKey, //publickey??
    fract_Wallet.publicKey,
    1,
    splToken.TOKEN_PROGRAM_ID,
  );
  console.log("fract_mint public key", fract_mint.publicKey.toString());
  // Get the token account of the fract_Wallet Solana address, if it does not exist, create it
  const fract_token_account = await fract_mint.getOrCreateAssociatedAccountInfo(
    fract_Wallet.publicKey,
  );
  const phantom_fract_token_account = await fract_mint.getOrCreateAssociatedAccountInfo(
    window.solana.publicKey,
  );
  console.log("phantom spl-token associated account", phantom_fract_token_account.address.toString());
  
//TODO create mint coins

  console.log("fract_Wallet public key", fract_Wallet.publicKey.toString());
  await fract_mint.mintTo(
    fract_token_account.address,
    fract_Wallet.publicKey,
    [],
    910000,
  );
  console.log("fractional tokens minted to", fract_token_account.address.toString());


//TODO transfer created coins to customer

    // Add token transfer instructions to transaction
    let transfer_to_phantom_tx = new web3.Transaction().add(
      splToken.Token.createTransferInstruction(
        splToken.TOKEN_PROGRAM_ID,
        fract_token_account.address,
        phantom_fract_token_account.address,
        fract_Wallet.publicKey,
        [],
        13,
      ),
    );
  const transfer_tx_signature = await web3.sendAndConfirmTransaction(
  connection,
  transfer_to_phantom_tx,
  [fract_Wallet],
  {commitment: 'confirmed'},
);
console.log("TRANSACTION transfer tokens to phantom", transfer_tx_signature);

// TODO manually check in command line if transfer is visible



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
