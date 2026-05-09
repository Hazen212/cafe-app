import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Kiểm tra xem element có tồn tại không trước khi render
const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  console.error("Không tìm thấy thẻ div với id là 'root' trong file index.html bạn ơi!");
}
