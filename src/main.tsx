// src/main.tsx
import { createRoot } from 'react-dom/client'
import App from './app.tsx'
import '@jappyjan/even-realities-ui/styles.css'

createRoot(document.getElementById('root')!).render(<App />)