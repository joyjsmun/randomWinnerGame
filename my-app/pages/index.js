import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { BigNumber, Contract, ethers,providers,utils} from 'ethers'
import React,{useEffect,useRef,useState} from 'react'
import Web3Modal from "web3modal"
import {abi,RANDOM_GAME_NFT_CONTRACT_ADDRESS} from "../constatns"
import {FETCH_CREATED_GAME} from "../queries";
import {subgraphQuery} from "../utils"

export default function Home() {
  const zero = BigNumber.from("0");
  const [walletConnected,setWalletConnected] = useState(false);
  const [loading,setLoading] = useState(false);
  const [isOwner,setIsOwner] = useState(false);
  const [entryFee,setEntryFee] = useState(zero);
  const [maxPlayers,setMaxPlayers] = useState(0);
  const [gameStated,setGameStarted] = useState(false);
  const [players,setPlayers] = useState([]);
  const [winner,setWinner] = useState();
  const [logs,setLogs] = useState([]);
  // Create a reference to the Web3 Modal (used for connecting to Metamask)
  const web3ModalRef = useRef();

  // This is used to force to re render the page when we want to in our case we will use force update to show new logs
  const forceUpdate = React.useReducer(() => ({}),{}) [1];

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Change the network to Mumbai");
      throw new Error("Change network to Mumbai");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err)
    }
  }

  const startGame = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        signer
      )
      setLoading(true);
      const tx = await randomGameNFTContract.startGame(maxPlayers,entryFee);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err)
    }
  }

  const joinGame = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // we connect to the Contract using a signer because we want the owner sign the contract
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      setLoading(true);
      const tx = await randomGameNFTContract.joinGame({
        value:entryFee,
      });
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }


  const checkIfGameStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const _gameStarted = await randomGameNFTContract.gameStated();
      const _gameArray = await subgraphQuery(FETCH_CREATED_GAME());
      const _game = _gameArray.games[0];
      let _logs = [];
      if (_gameStarted){
        _logs = [`Game has started with ID: ${_game.id}`];
        if(_game.players && _game.players.length >0 ) {
          _logs.push(
            `${_game.players.length} / ${_game.maxPlayers} already joined!!!`
          );
          _game.players.forEach((players) => {
            _logs.push(`${player} joined 🙌`);
          })
        }
        setEntryFee(BigNumber.from(_game.entryFee));
        setMaxPlayers(_game.maxPlayers);
      }else if(!gameStated && _game.winner) {
        _logs = [
          `Last game has ended with ID: ${_game.id}`,
          `Winner is: ${_game.winner} 🎉 `,
          `Waiting for host to start new game....`,
        ];

        setWinner(_game.winner);
      }

      setLogs(_logs);
      setPlayers(_game.players);
      setGameStarted(_gameStarted);
      forceUpdate();
      
    } catch (err) {
      console.error(err);

    }
  }

  // Calls the  contract to retrieve the owner
  const getOwner = async () => {
    try {

      const provider = await getProviderOrSigner();
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _owner = await randomGameNFTContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }
      
    } catch (err) {
      console.error(err.message)
    }
  }

  useEffect(()=> {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"mumbai",
        providerOptions:{},
        disableInjectedProvider:false
      });
      connectWallet();
      getOwner();
      checkIfGameStarted();
      setInterval(() => {
        checkIfGameStarted();
      },2000);
    }
  },[walletConnected]);

  const renderButton = () => {
    if (!walletConnected){
      return(
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if(loading){
      return <button className={styles.button}>Loading...</button>;
    }

    if(gameStated){
      if(players.length === maxPlayers) {
        return (
          <button className={styles.button} disable>
            Choosing Winner...
          </button>
        );
      }
      return (
        <div>
          <button className={styles.button}  onClick={joinGame} >
            Join Game 🚀
          </button>
        </div>
      )
    }
    // Start Game
    if(isOwner && !gameStated) {
      return(
        <div>
          <input
            type="number"
            className={styles.input}
            onChange = {(e) => {
              setEntryFee(
                e.target.value >= 0 
                ? utils.parseEther(e.target.value.toString())
                : zero
              );
            }}
            placeholder='Entry Fee (ETH)'
            />
            <input
              type="number"
              className = {styles.input}
              onChange = {(e) => {
                setMaxPlayers(e.target.value ?? 0);
              }}
              placeholder="Max players"
              />
              <button className={styles.button} onClick={startGame}>
              Start Game 🚀
              </button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>LW3Punks</title>
        <meta name='description' content='LW3Punks-Dapp' />
        <link rel="icon" href='./favicon.ico' />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Random Winner Game!</h1>
          <div className={styles.description}>
          Its a lottery game where a winner is chosen at random and wins the
            entire lottery pool
          </div>
          {renderButton()}
          {logs &&
            logs.map((log,index) => (
              <div className={styles.log} key={index}>
                {log}
              </div>
            ))}
        </div>
        <div>
          <img className={styles.image} src="./randomWinner.png"/>
        </div>
      </div>
    </div>
  )
}
