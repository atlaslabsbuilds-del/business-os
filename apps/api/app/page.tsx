export default function ApiHomePage() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>VanderBase API</h1>
      <p>Authentication-ready API shell. Public health: /health</p>
      <p>Protected identity: /auth/me (Bearer token required)</p>
    </main>
  );
}
