

export default function Menu({ onStartGame }) {
  // We'll attach the start logic here, likely listening for the SPACE key
  // You would typically use a useEffect hook and a state handler here 
  // to manage key presses, but for simplicity, we keep the UI structure.

  return (
    <div id="menu" className="active">
      <h1>hm</h1>
      <p>Press SPACE to start</p>
    </div>
  );
}
