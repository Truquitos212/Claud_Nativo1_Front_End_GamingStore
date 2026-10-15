import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Configuracion de Cognito (pool de CLIENTES) leida desde el archivo .env
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
      loginWith: { email: true },
    },
  },
});

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Token de acceso de la sesion actual (Amplify lo renueva solo si vencio)
async function obtenerToken() {
  const session = await fetchAuthSession();
  return session.tokens?.accessToken?.toString();
}

// Envia la compra al backend, que la deja en la cola SQS (responde 202 al tiro)
async function comprar(videojuegoId, cliente) {
  const token = await obtenerToken();
  const res = await fetch(`${API_URL}/api/ordenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ videojuegoId, cantidad: 1, cliente }),
  });
  if (!res.ok) throw new Error(`El backend respondio ${res.status}`);
  return res.json();
}

function formatearPrecio(valor) {
  return `$${Number(valor ?? 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })}`;
}

function App({ signOut, user }) {
  const [juegos, setJuegos] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [comprando, setComprando] = useState(null);

  const cargar = async () => {
    try {
      const token = await obtenerToken();
      const res = await fetch(`${API_URL}/api/videojuegos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`El backend respondio ${res.status}`);
      setJuegos(await res.json());
      setEstado('listo');
    } catch (e) {
      setError(e.message);
      setEstado('error');
    }
  };

  useEffect(() => { cargar(); }, []);

  const correo = user?.signInDetails?.loginId ?? user?.username;

  const alComprar = async (juego) => {
    setComprando(juego.id);
    setAviso('');
    try {
      const r = await comprar(juego.id, correo);
      setAviso(`✅ ${r.mensaje} (orden ${r.ordenId.slice(0, 8)})`);
      // La orden se procesa en segundo plano: recargamos el stock en unos segundos
      setTimeout(cargar, 4000);
    } catch (e) {
      setAviso(`❌ No se pudo enviar la compra: ${e.message}`);
    } finally {
      setComprando(null);
    }
  };

  return (
    <div style={styles.pagina}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>🎮 GamingStore</h1>
        <div style={styles.usuario}>
          <span>{correo}</span>
          <button onClick={signOut} style={styles.boton}>Cerrar sesión</button>
        </div>
      </header>

      {aviso && <p style={styles.aviso}>{aviso}</p>}
      {estado === 'cargando' && <p>Cargando catálogo…</p>}
      {estado === 'error' && <p style={styles.error}>No se pudo cargar el catálogo: {error}</p>}
      {estado === 'listo' && juegos.length === 0 && <p>No hay videojuegos en el catálogo todavía.</p>}

      <div style={styles.grilla}>
        {juegos.map((juego) => {
          const descuento = juego.descuento ?? 0;
          const precioFinal = (juego.precio ?? 0) * (1 - descuento / 100);
          return (
            <article key={juego.id} style={styles.tarjeta}>
              {juego.imagenUrl && <img src={juego.imagenUrl} alt={juego.titulo} style={styles.portada} />}
              <div style={{ padding: '12px' }}>
                <h3 style={{ margin: '0 0 6px' }}>{juego.titulo}</h3>
                <p style={styles.meta}>{juego.genero}{juego.desarrollador ? ` · ${juego.desarrollador}` : ''}</p>
                <p style={{ margin: '6px 0' }}>
                  {descuento > 0 && <s style={{ opacity: 0.6, marginRight: 6 }}>{formatearPrecio(juego.precio)}</s>}
                  <strong>{formatearPrecio(precioFinal)}</strong>
                  {descuento > 0 && <span style={styles.badge}>-{descuento}%</span>}
                </p>
                <p style={{ margin: 0, color: juego.stock > 0 ? '#2e7d32' : '#c62828' }}>
                  {juego.stock > 0 ? `${juego.stock} en stock` : 'Agotado'}
                </p>
                <button
                  onClick={() => alComprar(juego)}
                  disabled={comprando === juego.id}
                  style={styles.comprar}
                >
                  {comprando === juego.id ? 'Enviando…' : 'Comprar'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  pagina: { padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: 1200, margin: '0 auto', textAlign: 'left' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' },
  usuario: { display: 'flex', alignItems: 'center', gap: 12 },
  boton: { padding: '8px 16px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#dc3545', color: 'white', fontWeight: 'bold' },
  error: { color: '#c62828' },
  aviso: { padding: '10px 14px', borderRadius: 8, background: '#eef6ee', color: '#1b5e20', border: '1px solid #c8e6c9' },
  comprar: { marginTop: 10, width: '100%', padding: '8px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#1f6feb', color: 'white', fontWeight: 'bold' },
  grilla: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  tarjeta: { border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' },
  portada: { width: '100%', height: 280, objectFit: 'cover', display: 'block' },
  meta: { margin: 0, opacity: 0.7, fontSize: 14 },
  badge: { marginLeft: 8, background: '#2e7d32', color: 'white', borderRadius: 4, padding: '1px 6px', fontSize: 12 },
};

export default withAuthenticator(App);