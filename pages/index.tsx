import ConnectToPhantom from "../components/ConnectToPhantom";
import MyComp from "../components/ConnectToCluster.tsx";
import NFT from "../components/NFT.tsx";
import Send from "../components/Send.tsx";
export default function Home() {
  return (
  <>
    <div className="h-screen flex items-center justify-center">
      <ConnectToPhantom />
      <NFT />
    </div>
  </>
  );
}
