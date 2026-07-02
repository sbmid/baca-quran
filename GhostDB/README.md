# 👻 GhostDB

GhostDB is a zero-configuration, lightweight, and blazing fast schemaless JSON database built for developers who hate over-engineering. Forget complex migrations, forget docker containers for small apps, and forget rigid schemas. 

GhostDB operates entirely on local JSON files, acting as a direct persistence layer with an elegant built-in dashboard.

## 🌟 Features
- **Schemaless JSON Storage**: Save anything. No constraints.
- **RESTful API**: Universal support. Connect from Python, Go, PHP, or Next.js easily.
- **Built-in Security**: API and Dashboard are protected by Bearer Token authentication.
- **Two Execution Modes**: 
  - `UI + API` Mode for visual management.
  - `API Only` Mode for pure headless backend performance.
- **Premium Dashboard**: Dark/Light mode, responsive design, data search, and an interactive physics-based Graph View.
- **Auto-Config**: Instantly generates `ghost-config.json` with a secure token and a custom port (9969) on first run.

## 🚀 Installation & Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/sbmid/GhostDB.git
   cd GhostDB
   npm install
   ```

2. **Run the Database**
   To run with the Web Dashboard:
   ```bash
   npm run ui
   ```
   To run in Headless API mode (no UI served):
   ```bash
   npm start
   ```

3. **Access the Dashboard**
   Open your browser and navigate to `http://localhost:9969`.
   - **Default Password:** `12345678`
   *(You can change this password later via the Settings menu in the Dashboard)*

## 🌐 API Documentation

GhostDB is completely language-agnostic. You can interact with it using any HTTP client.

### Authentication
All endpoints require a Bearer token.
- **Header:** `Authorization: Bearer <your_token_from_config>`

### Endpoints
- `GET /api/collections` - List all collections.
- `GET /api/:collection` - Get all documents in a collection.
- `GET /api/:collection/:id` - Get a specific document.
- `POST /api/:collection` - Create or update a document (Body must contain `id`).
- `DELETE /api/:collection/:id` - Delete a document.
- `GET /api/graph-data` - Get physics graph visualization payload.

## 🛠️ Built With
- Express.js
- Tailwind CSS
- Force Graph (D3 Physics)
- Pure JavaScript (No heavy bundlers)

## 💡 Philosophy
*The best code is no code. The best schema is no schema. Ship faster.*
