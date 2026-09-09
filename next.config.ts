import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `localhost:3200` est l'adresse canonique du projet — c'est elle qui est
   * déclarée dans `site_url` de supabase/config.toml, donc celle qui reçoit
   * les liens de connexion.
   *
   * `127.0.0.1` est autorisé en développement par confort, mais attention :
   * les deux hôtes ont des cookies SÉPARÉS. Se connecter sur l'un ne
   * connecte pas sur l'autre.
   */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
