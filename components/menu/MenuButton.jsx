export default function MenuButton({ children, onClick }) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}