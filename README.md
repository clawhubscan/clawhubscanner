# DYOR Code Analyzer - RepoMind Style

Frontend de análisis de repositorios GitHub con estilo RepoMind, convertido de Next.js a React + Vite.

## 🚀 Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus keys:
# GITHUB_TOKEN=ghp_xxx
# OPENAI_API_KEY=sk-xxx

# 3. Iniciar desarrollo
npm run dev
```

## ✅ NO requiere Tailwind

Este proyecto usa **CSS puro con scope** para no interferir con tus estilos existentes. Los estilos del Code Analyzer están aislados dentro de `.code-analyzer-scope`.

## 📁 Estructura del Proyecto

```
├── api/code-analyzer/          # Vercel Serverless Functions
│   ├── fetch.js                # Fetch repo con Git Trees API
│   ├── chat.js                 # Chat streaming con GPT-4o-mini
│   ├── analyze.js              # Selección de archivos relevantes
│   ├── scan.js                 # Security scanning
│   ├── search.js               # Búsqueda text/regex/AST
│   ├── quality.js              # Análisis de calidad
│   ├── generate.js             # Generación de docs/tests
│   └── fix-mermaid.js          # AI fix para diagramas
│
├── src/
│   ├── components/code-analyzer/
│   │   ├── ChatInterface.jsx   # Chat principal
│   │   ├── CodeBlock.jsx       # Syntax highlighting
│   │   ├── Mermaid.jsx         # Diagramas con export PNG
│   │   ├── DevTools.jsx        # Search/Quality/Generate
│   │   ├── RepoSidebar.jsx     # File tree con stats
│   │   ├── RepoLayout.jsx      # Layout principal
│   │   ├── FilePreview.jsx     # Preview de archivos
│   │   └── ...más componentes
│   │
│   ├── lib/code-analyzer/      # Utilidades
│   │   ├── tokens.js
│   │   ├── storage.js
│   │   ├── diagram-utils.js
│   │   └── markdown-utils.js
│   │
│   ├── pages/
│   │   ├── CodeAnalyzer.jsx    # Router wrapper (importa CSS)
│   │   ├── CodeAnalyzerHome.jsx # Landing page
│   │   └── CodeAnalyzerChat.jsx # Chat page
│   │
│   └── styles/
│       └── code-analyzer-styles.css  # CSS aislado con scope
│
└── vercel.json
```

## 🔧 Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# GitHub Personal Access Token (para aumentar rate limit)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# OpenAI API Key
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

## 🎨 Features

- ✅ Chat con streaming SSE
- ✅ Diagramas Mermaid con export PNG
- ✅ DevTools: Search, Quality Analysis, Generate
- ✅ Security scanning
- ✅ File preview modal
- ✅ Sidebar con file tree y stats
- ✅ Smart Links (auto-render GitHub cards)
- ✅ Token counter con warnings
- ✅ Persistencia de conversaciones

## 📝 Rutas

- `/code-analyzer` - Landing page
- `/code-analyzer/:owner/:repo` - Chat de repositorio

## 🚀 Deploy en Vercel

1. Conectar repo a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Deploy automático

## 🔄 Integración con Proyecto Existente

Para integrar en tu proyecto DYOR Scanner existente:

1. Copia la carpeta `src/components/code-analyzer/`
2. Copia la carpeta `src/lib/code-analyzer/`
3. Copia la carpeta `api/code-analyzer/`
4. Copia `src/styles/code-analyzer-styles.css`
5. Copia las páginas de `src/pages/CodeAnalyzer*.jsx`
6. En tu `App.jsx`, agrega las rutas:
   ```jsx
   import CodeAnalyzer from './pages/CodeAnalyzer';
   
   // En tus Routes:
   <Route path="/code-analyzer" element={<CodeAnalyzer />} />
   <Route path="/code-analyzer/:owner/:repo" element={<CodeAnalyzer />} />
   ```

## 📦 Dependencias Clave

```json
{
  "dependencies": {
    "framer-motion": "^12.x",
    "lucide-react": "^0.469.x",
    "mermaid": "^11.x",
    "html2canvas-pro": "^1.x",
    "react-markdown": "^9.x",
    "react-syntax-highlighter": "^15.x",
    "remark-gfm": "^4.x"
  }
}
```

## 💡 Cómo funciona el scope

Los estilos del Code Analyzer están todos dentro de `.code-analyzer-scope`, lo que significa que NO afectarán a tu sitio existente.

Cada componente raíz tiene esta clase:
- `CodeAnalyzerHome.jsx` → `<div className="code-analyzer-scope ...">`
- `RepoLoader.jsx` → `<div className="code-analyzer-scope ...">`
- `RepoLayout.jsx` → `<div className="code-analyzer-scope ...">`
- Todos los modales → `<div className="code-analyzer-scope ...">`

El archivo `code-analyzer-styles.css` contiene todas las clases necesarias con el prefijo `.code-analyzer-scope`.
