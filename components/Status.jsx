export default function Status({ isConnected, players }) {
    // useEffect(() => {
    //     socket.on('playerUpdate', (backendPlayers) => {
    //         console.log(backendPlayers);
    //     })
    // })

  return (
    <div id="menu">
      <p>Is connected?: { isConnected ? "True" : "False"}</p>
      <p>Players connected: { JSON.stringify(players) }</p>
    </div>
  );
}
