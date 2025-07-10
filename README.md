
````markdown
# Nuvem – Interface Web (Frontend)

Este repositório contém o **frontend** do projeto **Nuvem**, um sistema acadêmico e experimental de **armazenamento seguro de arquivos**, com funcionalidades de upload, compartilhamento e gerenciamento de arquivos na nuvem. Esta interface foi desenvolvida com **React.js**, integrando-se ao backend via **API RESTful**.

---

## 🌐 Funcionalidades do Frontend

- Interface amigável e responsiva (React)
- Login com autenticação em duas etapas (2SV)
- Upload e visualização de arquivos
- Compartilhamento por link
- Alternância entre arquivos públicos e privados
- Barra de ações contextuais
- Navegação com breadcrumb
- Suporte a pré-visualização de imagens, PDF e mais
- Suporte a HTTPS local com certificados SSL
- Ícones interativos com React Icons

---

## 🧱 Estrutura Técnica

| Camada      | Tecnologias principais                              |
|-------------|-----------------------------------------------------|
| UI/UX       | React.js, CSS Modules                               |
| Roteamento  | React Router Dom                                    |
| Requisições | Axios                                                |
| Criptografia local | CryptoJS                                     |
| Armazenamento local | Dexie.js (IndexedDB)                        |
| Ícones      | react-icons                                          |
| Ambiente    | Variáveis via `.env` com suporte a HTTPS            |

---

## ⚙️ Scripts Disponíveis

Você pode rodar os seguintes comandos no terminal:

### `npm start`

Inicia o frontend em modo de desenvolvimento.  
Requer que o backend esteja ativo em `https://localhost:5000`.

### `npm run build`

Compila o projeto para produção, gerando os arquivos otimizados na pasta `/build`.

---

## 📦 Requisitos

- Node.js 18+
- npm 9+
- Backend rodando em `https://localhost:5000` (ajustável via `.env`)
- Certificados SSL válidos (para HTTPS local)

---

## ⚙️ Configuração do `.env`

Este projeto utiliza variáveis de ambiente para definir parâmetros como URL da API e certificados SSL.

> Um arquivo `.env.example` está disponível no repositório.

### Passos:

```bash
cp .env.example .env
````

### Exemplo de conteúdo:

```env
REACT_APP_API_URL=https://localhost:5000/api
REACT_APP_ENCRYPTION_KEY=your-secure-encryption-key
HTTPS=true
SSL_CRT_FILE=./ssl/cert.pem
SSL_KEY_FILE=./ssl/key.pem
```

Você pode usar `mkcert` ou `openssl` para gerar os arquivos de certificado para desenvolvimento.

---

## 🔐 Segurança na Interface

* Integração com JWT (gerenciado no backend)
* Criptografia local opcional com `crypto-js`
* Validação visual de ações do usuário
* Suporte a controle de permissões (ocultar/mostrar arquivos)

---

## 🧪 Principais Bibliotecas

```
react
react-dom
react-router-dom
axios
crypto-js
dexie
react-icons
web-vitals
```

---

## 📁 Organização do Projeto

```bash
frontend/
├── public/
├── src/
│   ├── api/           # Conexão com o backend via Axios
│   ├── context/       # Contextos globais de autenticação e arquivos
│   ├── pages/         # Páginas principais
│   ├── components/    # Componentes reutilizáveis
│   ├── style/         # CSS modularizado
│   └── App.js         # Estrutura geral
├── ssl/               # Certificados SSL (para HTTPS local)
├── .env.example
└── package.json
```

---

## 🧷 Git e Segurança

### `.gitignore` já protege:

* `node_modules/`
* `build/`
* `.env`
* `ssl/` (certificados)

---

## 👨‍💻 Autor

**Everton Hian dos Santos Pinheiro**
Desenvolvimento completo da interface web e integração com API de backend segura.

---

```

```
