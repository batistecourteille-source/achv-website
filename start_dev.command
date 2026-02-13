#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Lancement du site ACHV en cours..."

# Tuer le processus sur le port 3000 s'il existe
PID=$(lsof -ti:3000)
if [ ! -z "$PID" ]; then
  echo "⚠️  Le port 3000 est occupé. Libération du port..."
  kill -9 $PID
fi

# Vérifier si les node_modules existent
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Ouvrir le navigateur après 5 secondes
(sleep 5 && open "http://localhost:3000") &

# Lancer le serveur de développement
echo "🌍 Démarrage du serveur..."
npm run dev
