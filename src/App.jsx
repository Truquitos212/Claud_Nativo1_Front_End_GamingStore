import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Configuración con tus credenciales de AWS Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX', // Reemplaza con tu User Pool ID
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Reemplaza con tu Client ID
    }
  }
});

function App({ signOut, user }) {
  const [videojuegos, setVideojuegos] = useState([]);

  useEffect(() => {
    // Obtener el token de acceso JWT
    const token = user?.signInDetails?.accessToken || '';

    // Consumir tu Backend en Java de Videojuegos
    fetch('http://localhost:8080/api/videojuegos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setVideojuegos(data))
      .catch(err => console.error('Error al cargar juegos:', err));
  }, [user]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🎮 Tienda de Videojuegos</h1>
      <p>Usuario autenticado: <strong>{user?.username}</strong></p>
      <button onClick={signOut} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>

      <hr style={{ margin: '20px 0' }} />

      <h2>Lista de Videojuegos</h2>
      {videojuegos.length === 0 ? (
        <p>Cargando juegos o no hay elementos disponibles...</p>
      ) : (
        <ul>
          {videojuegos.map(juego => (
            <li key={juego.id}>
              <strong>{juego.titulo}</strong> - ${juego.precio}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default withAuthenticator(App);