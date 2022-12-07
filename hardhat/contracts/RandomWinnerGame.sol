// SPDX-License-Identifier : MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumeBase.sol";


contract RandomWinnerGame is VRFConsumeBase, Ownable {
    // ChainLink Variables
    // The amount of LINK to send with the request
    uint256 public fee;
    // ID of public key against which randomness is generated
    bytes32 public keyHash;

    // Address of the players
    addres[] public players;
    //Max number of players in one game
    uint8 maxPlayers;
    //Variable to indicate if the game has started or not
    bool public gameStarted;
    //the fees for entering the game
    uint256 entryFee;
    // current game id
    uint256 public gameId;

    // emitted when the game starts
    event GameStarted(uint256 gameId, uint8 maxPlayers, uint256 entryFee);
    // emitted when someone joins a game
    event PlayerJoined(uint256 gameId, addres player);
    // emitted when the game ends
    event GameEnded(uint256 gameId, addres winner, bytes32 requestId);

    
}