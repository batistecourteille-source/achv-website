#!/bin/bash
cd "$(dirname "$0")"

echo "🧹 Nettoyage du projet..."
# Try to move node_modules to a temp folder to delete in background, or just delete if possible
mkdir -p .trash
mv node_modules .trash/node_modules_$(date +%s) 2>/dev/null || rm -rf node_modules
rm -rf .next
rm package-lock.json

echo "📦 Réinstallation des dépendances..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Installation réussie"
    echo "🚀 Démarrage..."
    # Open browser after a slight delay
    (sleep 5 && open "http://localhost:3000") &
    npm run dev
else
    echo "❌ Erreur lors de l'installation"
    read -p "Appuyez sur Entrée pour quitter..."
fi
