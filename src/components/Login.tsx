import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, isAuthenticated } from '../service/AuthService';
import Button from '@mui/material/Button';
import { TextField } from '@mui/material';


const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // URL de la imagen de ImgBB - REEMPLAZA ESTA URL con tu enlace directo de ImgBB
  const imageUrl = "https://i.imgur.com/ruT91KC.jpg";; // Reemplazar con tu URL

  // Verificar si hay un mensaje de sesión expirada en los parámetros de la URL
  const sessionExpiredParam = new URLSearchParams(location.search).get('sessionExpired');
  const [sessionExpired, setSessionExpired] = useState(sessionExpiredParam === 'true');

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setImageLoaded(true);
  }, [imageUrl]);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/business');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    setSessionExpired(false); // Limpiar mensaje de sesión expirada cuando se intenta un nuevo login

    try {
      const userData = await login(email, password);
      console.log('Inicio de sesión exitoso como:', userData.firstName, userData.lastName);
      navigate('/business');
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error al conectar con el servidor. Por favor intente más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Lado izquierdo - Fondo con logo */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: imageLoaded ? `url("${imageUrl}")` : 'none',
            backgroundColor: !imageLoaded ? '#000' : 'transparent',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1)',
            transformOrigin: 'center',
            transition: 'background-color 0.3s ease'
          }}
        />
      </div>

      {/* Lado derecho - Formulario de login */}
      <div className="w-[500px] flex flex-col justify-center px-16 bg-black">
        <h2 className="text-3xl font-bold text-white mb-2">Iniciar sesión</h2>
        <p className="text-gray-400 mb-8">Inicia sesión para acceder a tu cuenta</p>

        {/* Mensaje de sesión expirada */}
        {sessionExpired && (
          <div className="bg-yellow-500 text-black p-3 rounded-md mb-6 text-sm">
            Tu sesión ha expirado por inactividad. Por favor inicia sesión nuevamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <TextField
              id="email"
              type="email"
              label="Correo"
              placeholder="driver@grupogranaauto.com.mx"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1f2937', // bg-gray-800
                  '& fieldset': {
                    borderColor: '#374151', // border-gray-700
                  },
                  '&:hover fieldset': {
                    borderColor: '#6b7280', // hover state
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6', // focus color (azul)
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#ffffff', // blanco brillante para mejor visibilidad
                  fontWeight: '500', // un poco más bold para que resalte
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffffff', // blanco cuando está en focus
                  fontWeight: '600', // más bold en focus
                },
                '& .MuiInputLabel-shrink': {
                  color: '#ffffff', // blanco cuando está shrunk (flotando arriba)
                  fontWeight: '600', // más bold cuando flota
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', // fondo SOLO cuando flota arriba
                  padding: '0 4px', // padding SOLO cuando flota
                  borderRadius: '4px', // esquinas SOLO cuando flota
                },
                '& .MuiOutlinedInput-input': {
                  color: '#ffffff', // text color white
                  padding: '12px', // p-3 equivalent
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: '#9ca3af', // placeholder color
                  opacity: 1,
                },
              }}
            />
          </div>

          <div>
            <TextField
              id="password"
              type="password"
              label="Contraseña"
              placeholder="****************"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1f2937', // bg-gray-800
                  '& fieldset': {
                    borderColor: '#374151', // border-gray-700
                  },
                  '&:hover fieldset': {
                    borderColor: '#6b7280', // hover state
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6', // focus color (azul)
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#ffffff', // blanco brillante para mejor visibilidad
                  fontWeight: '500', // un poco más bold para que resalte
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffffff', // blanco cuando está en focus
                  fontWeight: '600', // más bold en focus
                },
                '& .MuiInputLabel-shrink': {
                  color: '#ffffff', // blanco cuando está shrunk (flotando arriba)
                  fontWeight: '600', // más bold cuando flota
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', // fondo SOLO cuando flota arriba
                  padding: '0 4px', // padding SOLO cuando flota
                  borderRadius: '4px', // esquinas SOLO cuando flota
                },
                '& .MuiOutlinedInput-input': {
                  color: '#ffffff', // text color white
                  padding: '12px', // p-3 equivalent
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: '#9ca3af', // placeholder color
                  opacity: 1,
                },
              }}
            />
          </div>

          {errorMessage && (
            <div className="text-red-400 text-center">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
            disabled={isLoading}
            sx={{
              py: 1.5,
              borderRadius: '12px',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textTransform: 'none',
            }}
          >
            {isLoading ? 'Procesando...' : 'Iniciar sesión'}
          </Button>
        </form>

        <div className="text-center text-gray-500 text-sm mt-8">
          AUTO INSIGHTS © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Login;