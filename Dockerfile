FROM node:18

# Installer wgrib2 (outil NOAA pour lire GRIB2)
RUN apt-get update && apt-get install -y wgrib2 && rm -rf /var/lib/apt/lists/*

# Définir le dossier de travail
WORKDIR /app

# Copier package.json et installer les dépendances Node
COPY package*.json ./
RUN npm install

# Copier tout le reste du projet
COPY . .

# Lancer ton serveur
CMD ["npm", "start"]
