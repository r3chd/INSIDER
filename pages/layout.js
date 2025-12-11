export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>My Application</h1>
          <nav>
            {/* Navigation links */}
          </nav>
        </header>
        <main>
          {children} {/* Page content will be rendered here */}
        </main>
        <footer>
          <p>&copy; 2025 My Application</p>
        </footer>
      </body>
    </html>
  );
}
