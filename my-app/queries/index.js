export function FETCH_CREATED_GAME(){
    return `query{
        games(oderBy:id, orderDirection:desc, first:1){
            id
            maxPlayers
            entryFee
            winner
            players
            
        }
    }`;
}