"use client";

import { useEffect, useRef, useState } from "react";

// Styles pour les animations personnalisées
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scale-in {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  .animate-scale-in {
    animation: scale-in 0.4s ease-out;
  }
`;

// Injecter les styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  health: number;
  maxHealth: number;
  isOnGround: boolean;
}

interface Monster extends Entity {
  direction: number;
  attackCooldown: number;
}

interface Projectile {
  x: number;
  y: number;
  velocityX: number;
  width: number;
  height: number;
}

interface Pet {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isOnGround: boolean;
  targetX: number;
  targetY: number;
  direction: number; // 1 = droite, -1 = gauche
}

interface DamageParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  size: number;
}

export default function Game(props: {
  game: {
    id: string;
    mainCharacterImageUrl: string;
    mainCharacterNeedsFlipping: boolean;
    backgroundImageUrl: string;
    weaponImageUrl: string;
    weaponNeedsFlipping: boolean;
    weaponType: string;
    monstersImageUrl: string;
    monstersNeedsFlipping: boolean;
    bossImageUrl: string;
    bossNeedsFlipping: boolean;
    groundImageUrl: string;
    petImageUrl: string;
    petNeedsFlipping: boolean;
  };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<
    | "intro"
    | "playing"
    | "wave-complete"
    | "pet-intro"
    | "boss-intro"
    | "victory"
    | "game-over"
  >("intro");
  const [currentWave, setCurrentWave] = useState(1);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [gameData, setGameData] = useState(props.game);
  const [forceReload, setForceReload] = useState(0);

  // Détecter si le joueur est en mode mêlée
  const isMelee = gameData.weaponType === "melee";

  // Fonction pour refetch les données du jeu
  const refetchGameData = async () => {
    try {
      const response = await fetch(`/api/game/${props.game.id}`);
      if (response.ok) {
        const data = await response.json();
        // Créer une nouvelle référence d'objet pour forcer le re-render
        setGameData({ ...data });
        // Forcer le rechargement pour appliquer les nouveaux flips
        setForceReload((prev) => prev + 1);
        return data;
      }
    } catch (error) {
      console.error("Failed to refetch game data:", error);
    }
    return gameData;
  };

  const gameStateRef = useRef({
    player: {
      x: 100,
      y: 300,
      width: 180,
      height: 210,
      velocityX: 0,
      velocityY: 0,
      // Si le joueur est mêlée, lui donner plus de points de vie
      health: isMelee ? 180 : 100,
      maxHealth: isMelee ? 180 : 100,
      hitCooldown: 0,
      isOnGround: false,
      isCrouching: false,
      attackCooldown: 0,
      direction: 1, // 1 = droite, -1 = gauche
      weaponRotation: 0, // Rotation de l'arme pour l'animation d'attaque
    },
    monsters: [] as Monster[],
    boss: null as (Entity & { jumpCooldown: number }) | null,
    projectiles: [] as Projectile[],
    pet: null as Pet | null,
    damageParticles: [] as DamageParticle[],
    keys: {} as Record<string, boolean>,
    wave: 1,
    state: "intro" as typeof gameState,
    bossIntroProgress: 0,
    waveCompleteTimer: 0,
  });

  const imagesRef = useRef({
    player: null as HTMLImageElement | null,
    background: null as HTMLImageElement | null,
    weapon: null as HTMLImageElement | null,
    projectile: null as HTMLImageElement | null,
    monster: null as HTMLImageElement | null,
    boss: null as HTMLImageElement | null,
    ground: null as HTMLImageElement | null,
    pet: null as HTMLImageElement | null,
  });

  // Soigne le joueur après la fin d'une vague (ex: 25% des PV max)
  const healAfterWave = () => {
    const player = gameStateRef.current.player;
    const healAmount = Math.ceil(player.maxHealth * 0.25);
    player.health = Math.min(player.maxHealth, player.health + healAmount);
  };

  // Charger les images
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all([
      loadImage(gameData.mainCharacterImageUrl),
      loadImage(gameData.backgroundImageUrl),
      loadImage(gameData.weaponImageUrl),
      loadImage(gameData.monstersImageUrl),
      loadImage(gameData.bossImageUrl),
      loadImage(gameData.groundImageUrl),
      loadImage(gameData.petImageUrl),
    ])
      .then(([player, background, weapon, monster, boss, ground, pet]) => {
        imagesRef.current = {
          player,
          background,
          weapon,
          projectile: weapon,
          monster,
          boss,
          ground,
          pet,
        };
        setImagesLoaded(true);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des images:", error);
      });
  }, [gameData]);

  // Gestion des touches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = true;

      // Cheat code: N pour passer à la vague suivante
      if (
        e.key.toLowerCase() === "n" &&
        gameStateRef.current.state === "playing"
      ) {
        if (gameStateRef.current.wave < 3) {
          // Passer à la vague suivante
          gameStateRef.current.monsters = [];
          gameStateRef.current.projectiles = [];
          gameStateRef.current.wave++;
          // Soigner le joueur après la vague
          healAfterWave();
          gameStateRef.current.state = "wave-complete";
          setGameState("wave-complete");
          setCurrentWave(gameStateRef.current.wave);
        } else if (!gameStateRef.current.boss) {
          // Déclencher l'intro du pet et du boss
          gameStateRef.current.monsters = [];
          gameStateRef.current.projectiles = [];
          const GROUND_Y = 450;
          gameStateRef.current.pet = {
            x: gameStateRef.current.player.x - 80,
            y: GROUND_Y - 70,
            width: 140,
            height: 140,
            velocityY: 0,
            isOnGround: true,
            targetX: gameStateRef.current.player.x - 80,
            targetY: GROUND_Y - 70,
            direction: 1,
          };
          // Soigner le joueur après la vague finale
          healAfterWave();
          gameStateRef.current.state = "pet-intro";
          setGameState("pet-intro");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Initialiser les monstres pour une vague
  const spawnWave = (waveNumber: number) => {
    const monstersCount = 3 + waveNumber;
    const monsters: Monster[] = [];

    for (let i = 0; i < monstersCount; i++) {
      monsters.push({
        x: 400 + i * 150,
        y: 300,
        width: 168,
        height: 196,
        velocityX: 0,
        velocityY: 0,
        health: 30 + waveNumber * 10,
        maxHealth: 30 + waveNumber * 10,
        isOnGround: false,
        direction: -1,
        attackCooldown: 0,
      });
    }

    gameStateRef.current.monsters = monsters;
  };

  // Initialiser le boss
  const spawnBoss = () => {
    gameStateRef.current.boss = {
      x: 900,
      y: 250,
      width: 280,
      height: 350,
      velocityX: 0,
      velocityY: 0,
      health: 300,
      maxHealth: 300,
      isOnGround: false,
      jumpCooldown: 0,
    };
  };

  // Initialiser le jeu
  useEffect(() => {
    // Ne rien faire automatiquement, attendre que le joueur clique sur Start
  }, [imagesLoaded]);

  // Boucle de jeu
  useEffect(() => {
    if (!imagesLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fonction pour redimensionner le canvas selon la taille de l'écran
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Ratio 5:3 pour le canvas
      const aspectRatio = 5 / 3;

      let newWidth = containerWidth;
      let newHeight = containerWidth / aspectRatio;

      if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = containerHeight * aspectRatio;
      }

      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const CANVAS_WIDTH = 1600;
    const CANVAS_HEIGHT = 960;
    const GROUND_Y = 768;
    const GRAVITY = 0.15;
    const CROUCH_FALL_MULTIPLIER = 2.2; // Multiplicateur de gravité quand on s'accroupit en l'air
    const JUMP_FORCE = -11.5;
    // Inertie / accélération du joueur
    const ACCEL = 0.5; // accélération par unité de frameTime
    const MAX_MOVE_SPEED = 4; // vitesse max atteignable en courant
    const FRICTION = 0.3; // décélération lorsque aucune touche maintenue
    const ATTACK_RANGE = 60;
    // Dégâts et PV du joueur selon son type (mêlée vs distance)
    const MELEE_DAMAGE = isMelee ? 35 : 20;
    const MELEE_BOSS_DAMAGE = isMelee ? 25 : 15;

    let animationFrameId: number;
    let lastTime = performance.now();
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const checkCollision = (a: Entity, b: Entity): boolean => {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    };

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / frameTime, 2);
      lastTime = currentTime;

      const game = gameStateRef.current;

      // Effacer le canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dessiner le fond
      if (imagesRef.current.background) {
        ctx.drawImage(
          imagesRef.current.background,
          0,
          0,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
        );
      }

      // Dessiner le sol
      if (imagesRef.current.ground) {
        // Le sol a un ratio de 2:1 (2048x1024)
        const groundHeight = CANVAS_HEIGHT - GROUND_Y;
        const groundWidth = groundHeight * 2; // Respecter le ratio 2:1

        // Dessiner le sol en le répétant si nécessaire pour couvrir toute la largeur
        let x = 0;
        while (x < CANVAS_WIDTH) {
          ctx.drawImage(
            imagesRef.current.ground,
            x,
            GROUND_Y - 5,
            groundWidth,
            groundHeight,
          );
          x += groundWidth;
        }
      }

      // Écran d'intro avec bouton Start
      if (game.state === "intro") {
        // Dessiner un écran d'accueil
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Appuyez sur Entrée ou Espace",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 20,
        );
        ctx.font = "bold 40px Arial";
        ctx.fillText(
          "pour commencer",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 40,
        );

        if (game.keys["enter"] || game.keys[" "]) {
          // Empêcher les touches multiples
          game.keys["enter"] = false;
          game.keys[" "] = false;

          // Refetch les données avant de commencer
          refetchGameData().then(() => {
            game.state = "playing";
            setGameState("playing");
            spawnWave(1);
          });
        }

        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Animation d'intro du boss
      if (game.state === "boss-intro") {
        game.bossIntroProgress += 0.003 * deltaTime; // Ralenti pour une animation plus longue

        if (game.bossIntroProgress < 1 && game.boss) {
          // Fond sombre qui s'intensifie
          ctx.fillStyle = `rgba(0, 0, 0, ${game.bossIntroProgress * 0.8})`;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // Animation de tremblement intense
          const shake =
            Math.sin(game.bossIntroProgress * 30) *
            (10 * game.bossIntroProgress);
          const scale = 0.5 + game.bossIntroProgress * 1.5;

          // Éclairs rouges aléatoires
          if (Math.random() < 0.3 * game.bossIntroProgress) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + Math.random() * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(Math.random() * CANVAS_WIDTH, 0);
            ctx.lineTo(Math.random() * CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.stroke();
          }

          ctx.save();
          ctx.translate(shake, shake);

          if (imagesRef.current.boss && game.boss) {
            const centerX = CANVAS_WIDTH / 2 - (game.boss.width * scale) / 2;
            const centerY = CANVAS_HEIGHT / 2 - (game.boss.height * scale) / 2;

            ctx.globalAlpha = game.bossIntroProgress;
            ctx.drawImage(
              imagesRef.current.boss,
              centerX,
              centerY,
              game.boss.width * scale,
              game.boss.height * scale,
            );
          }

          ctx.restore();

          // Texte "BOSS FINAL" avec effet de pulsation et ombre
          const textPulse = Math.sin(game.bossIntroProgress * 8) * 10 + 60;
          ctx.shadowColor = "red";
          ctx.shadowBlur = 20 * game.bossIntroProgress;
          ctx.fillStyle = `rgba(255, 0, 0, ${game.bossIntroProgress})`;
          ctx.font = `bold ${textPulse}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText("BOSS FINAL", CANVAS_WIDTH / 2, 100);
          ctx.shadowBlur = 0;

          // Message d'avertissement qui apparaît progressivement
          if (game.bossIntroProgress > 0.5) {
            const warningAlpha = (game.bossIntroProgress - 0.5) * 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${warningAlpha})`;
            ctx.font = "bold 25px Arial";
            ctx.fillText("Préparez-vous au combat !", CANVAS_WIDTH / 2, 500);
          }
        } else {
          game.state = "playing";
          game.bossIntroProgress = 0;
          setGameState("playing");
        }

        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Animation d'intro du pet
      if (game.state === "pet-intro" && game.pet) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (imagesRef.current.pet) {
          ctx.drawImage(
            imagesRef.current.pet,
            CANVAS_WIDTH / 2 - 50,
            CANVAS_HEIGHT / 2 - 50,
            100,
            100,
          );
        }

        ctx.fillStyle = "white";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Vous avez reçu un compagnon !",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 100,
        );
        ctx.font = "20px Arial";
        ctx.fillText(
          "Appuyez sur Entrée ou Espace pour continuer",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 140,
        );

        if (game.keys["enter"] || game.keys[" "]) {
          game.state = "boss-intro";
          setGameState("boss-intro");
          spawnBoss();
        }

        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Si on est dans l'écran de fin de vague et qu'on appuie sur Entrée ou Espace
      if (
        game.state === "wave-complete" &&
        (game.keys["enter"] || game.keys[" "])
      ) {
        // Empêcher les touches multiples
        game.keys["enter"] = false;
        game.keys[" "] = false;

        // Refetch les données avant de passer à la vague suivante
        refetchGameData().then(() => {
          spawnWave(game.wave);
          // Réinitialiser la position du joueur
          game.player.x = 100;
          game.player.y = 300;
          game.player.velocityX = 0;
          game.player.velocityY = 0;
          game.player.isOnGround = false;
          game.player.direction = 1;
          game.waveCompleteTimer = 0; // Réinitialiser le timer
          game.state = "playing";
          setGameState("playing");
        });
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Mettre à jour le joueur
      const player = game.player;

      // Contrôles (avec inertie / accélération)
      const inputLeft = !!game.keys["q"] || !!game.keys["arrowleft"];
      const inputRight = !!game.keys["d"] || !!game.keys["arrowright"];
      let inputDir = 0;
      if (inputLeft) inputDir -= 1;
      if (inputRight) inputDir += 1;

      if (inputDir !== 0) {
        // Accélérer vers la direction souhaitée
        player.velocityX += inputDir * ACCEL * deltaTime;
        // Clamp à la vitesse max
        if (player.velocityX > MAX_MOVE_SPEED)
          player.velocityX = MAX_MOVE_SPEED;
        if (player.velocityX < -MAX_MOVE_SPEED)
          player.velocityX = -MAX_MOVE_SPEED;
        player.direction = inputDir > 0 ? 1 : -1;
      } else {
        // Appliquer friction/décélération lorsque aucune touche n'est pressée
        if (Math.abs(player.velocityX) < 0.1) {
          player.velocityX = 0;
        } else {
          player.velocityX *= Math.pow(FRICTION, deltaTime);
        }
      }

      // S'accroupir
      player.isCrouching = game.keys["s"] || game.keys["arrowdown"];

      // Sauter
      if ((game.keys["z"] || game.keys["arrowup"]) && player.isOnGround) {
        player.velocityY = JUMP_FORCE;
        player.isOnGround = false;
      }

      // Attaquer
      if ((game.keys["e"] || game.keys[" "]) && player.attackCooldown <= 0) {
        player.attackCooldown = 30;

        if (!isMelee && imagesRef.current.projectile) {
          // Attaque à distance
          game.projectiles.push({
            x: player.x + (player.direction === 1 ? player.width : 0),
            y: player.y + player.height / 2,
            velocityX: player.direction * 1.7,
            width: 50,
            height: 35,
          });
        } else {
          // Attaque de mêlée avec animation de rotation
          player.weaponRotation = player.direction * 45; // Rotation de 45° vers l'avant
          const attackX =
            player.x + (player.direction === 1 ? player.width : -ATTACK_RANGE);
          const attackBox = {
            x: attackX,
            y: player.y,
            width: ATTACK_RANGE,
            height: player.height,
          };

          // Toucher les monstres
          game.monsters.forEach((monster) => {
            if (checkCollision(attackBox as Entity, monster)) {
              monster.health -= MELEE_DAMAGE;
            }
          });

          // Toucher le boss
          if (game.boss && checkCollision(attackBox as Entity, game.boss)) {
            game.boss.health -= MELEE_BOSS_DAMAGE;
          }
        }
      }

      if (player.attackCooldown > 0) player.attackCooldown -= deltaTime;
      if (player.hitCooldown > 0) player.hitCooldown -= deltaTime;

      // Faire revenir l'arme à sa position de base progressivement
      if (player.weaponRotation !== 0) {
        const rotationSpeed = 8 * deltaTime;
        if (Math.abs(player.weaponRotation) < rotationSpeed) {
          player.weaponRotation = 0;
        } else {
          player.weaponRotation -=
            Math.sign(player.weaponRotation) * rotationSpeed;
        }
      }

      // Physique du joueur
      // Appliquer une gravité plus importante si le joueur s'accroupit en l'air
      const gravityMultiplier =
        player.isCrouching && !player.isOnGround ? CROUCH_FALL_MULTIPLIER : 1.5;
      player.velocityY += GRAVITY * gravityMultiplier * deltaTime;
      player.x += player.velocityX * deltaTime;
      player.y += player.velocityY * deltaTime;

      // Collision avec le sol
      if (player.y + player.height >= GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.isOnGround = true;
      }

      // Limites de l'écran
      player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));

      // Mettre à jour les projectiles
      game.projectiles = game.projectiles.filter((proj) => {
        proj.x += proj.velocityX * deltaTime;

        // Vérifier collision avec monstres
        game.monsters.forEach((monster) => {
          if (
            proj.x < monster.x + monster.width &&
            proj.x + proj.width > monster.x &&
            proj.y < monster.y + monster.height &&
            proj.y + proj.height > monster.y
          ) {
            monster.health -= 15;
            proj.velocityX = 0; // Marquer pour suppression
          }
        });

        // Vérifier collision avec boss
        if (game.boss) {
          if (
            proj.x < game.boss.x + game.boss.width &&
            proj.x + proj.width > game.boss.x &&
            proj.y < game.boss.y + game.boss.height &&
            proj.y + proj.height > game.boss.y
          ) {
            game.boss.health -= 20;
            proj.velocityX = 0;
          }
        }

        return proj.x > 0 && proj.x < CANVAS_WIDTH && proj.velocityX !== 0;
      });

      // Mettre à jour les monstres
      game.monsters = game.monsters.filter((monster) => {
        if (monster.health <= 0) return false;

        // IA du monstre
        const distanceToPlayer = player.x - monster.x;

        if (Math.abs(distanceToPlayer) > 50) {
          monster.direction = distanceToPlayer > 0 ? 1 : -1;
          monster.velocityX = monster.direction * 1.5;

          // Petits sauts aléatoires pendant le déplacement
          if (monster.isOnGround && Math.random() < 0.02 * deltaTime) {
            monster.velocityY = JUMP_FORCE * 0.4; // Saut plus petit que le joueur
            monster.isOnGround = false;
          }
        } else {
          monster.velocityX = 0;

          // Attaquer le joueur
          if (monster.attackCooldown <= 0) {
            monster.attackCooldown = 60;
            if (checkCollision(monster, player)) {
              if (player.hitCooldown <= 0) {
                player.health -= 10;
                player.hitCooldown = 12; // ~0.2s en units de frameTime
                // Créer des particules de dégâts
                for (let i = 0; i < 8; i++) {
                  game.damageParticles.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    velocityX: (Math.random() - 0.5) * 6,
                    velocityY: (Math.random() - 0.5) * 6 - 2,
                    life: 30,
                    maxLife: 30,
                    size: 3 + Math.random() * 3,
                  });
                }
              }
            }
          }
        }

        if (monster.attackCooldown > 0) monster.attackCooldown -= deltaTime;

        // Physique
        monster.velocityY += GRAVITY * deltaTime;
        monster.x += monster.velocityX * deltaTime;
        monster.y += monster.velocityY * deltaTime;

        if (monster.y + monster.height >= GROUND_Y) {
          monster.y = GROUND_Y - monster.height;
          monster.velocityY = 0;
          monster.isOnGround = true;
        }

        return true;
      });

      // Mettre à jour le boss
      if (game.boss) {
        if (game.boss.health <= 0) {
          game.state = "victory";
          setGameState("victory");
        } else {
          const distanceToPlayer = player.x - game.boss.x;

          if (Math.abs(distanceToPlayer) > 10) {
            // Augmente la vitesse du boss en fonction de la distance au joueur
            const absDist = Math.abs(distanceToPlayer);
            const MIN_DIST = 10;
            const BASE_SPEED = 1.2;
            const SPEED_FACTOR = 0.01; // vitesse additionnelle par pixel de distance
            const MAX_SPEED = 2; // plafond de vitesse

            if (absDist > MIN_DIST) {
              const speed = Math.min(
                BASE_SPEED + absDist * SPEED_FACTOR,
                MAX_SPEED,
              );
              game.boss.velocityX = distanceToPlayer > 0 ? speed : -speed;
            } else {
              game.boss.velocityX = 0;
            }
          } else {
            game.boss.velocityX = 0;
          }

          if (checkCollision(game.boss, player)) {
            if (player.hitCooldown <= 0) {
              player.health -= 10;
              player.hitCooldown = 12; // ~0.2s
              // Créer des particules de dégâts
              for (let i = 0; i < 8; i++) {
                game.damageParticles.push({
                  x: player.x + player.width / 2,
                  y: player.y + player.height / 2,
                  velocityX: (Math.random() - 0.5) * 6,
                  velocityY: (Math.random() - 0.5) * 6 - 2,
                  life: 30,
                  maxLife: 30,
                  size: 3 + Math.random() * 3,
                });
              }
            }
          }

          // Saut aléatoire du boss
          if (game.boss.jumpCooldown > 0) {
            game.boss.jumpCooldown -= deltaTime;
          } else if (game.boss.isOnGround && Math.random() < 0.05 * deltaTime) {
            // Chance de sauter ajustée avec deltaTime
            game.boss.velocityY = JUMP_FORCE * 1.1; // Saute un peu plus haut que le joueur
            game.boss.isOnGround = false;
            game.boss.jumpCooldown = 250; // Cooldown avant le prochain saut possible
          }

          game.boss.velocityY += GRAVITY * deltaTime;
          game.boss.x += game.boss.velocityX * deltaTime;
          game.boss.y += game.boss.velocityY * deltaTime;

          if (game.boss.y + game.boss.height >= GROUND_Y) {
            game.boss.y = GROUND_Y - game.boss.height;
            game.boss.velocityY = 0;
            game.boss.isOnGround = true;
          }
        }
      }

      // Mettre à jour les particules de dégâts
      game.damageParticles = game.damageParticles.filter((particle) => {
        particle.life -= deltaTime;
        particle.x += particle.velocityX * deltaTime;
        particle.y += particle.velocityY * deltaTime;
        particle.velocityY += GRAVITY * 0.5 * deltaTime; // Gravité plus faible pour les particules
        return particle.life > 0;
      });

      // Mettre à jour le pet
      if (game.pet) {
        const followDistance = 80;
        const smoothFactor = 0.15; // Facteur d'interpolation pour des mouvements smooth

        // Position cible (suivre le joueur avec une distance)
        game.pet.targetX = player.x - followDistance;
        game.pet.targetY = player.y; // Suivre la hauteur du joueur

        // Interpolation smooth pour le mouvement horizontal
        const dx = game.pet.targetX - game.pet.x;
        const distance = Math.abs(dx);

        if (distance > 5) {
          // Mouvement rapide avec interpolation smooth
          game.pet.x += dx * smoothFactor * deltaTime;
          // Mettre à jour la direction selon le mouvement
          game.pet.direction = dx > 0 ? 1 : -1;
        }

        // Sauter si le joueur est en l'air et que le pet est au sol
        const verticalDistance = player.y - game.pet.y;
        if (game.pet.isOnGround && verticalDistance < -50) {
          // Le joueur est beaucoup plus haut, le pet saute pour suivre
          game.pet.velocityY = JUMP_FORCE * 0.6; // Saut un peu plus faible que le joueur
          game.pet.isOnGround = false;
        }

        // Petits sauts aléatoires quand le pet est au sol
        if (game.pet.isOnGround && Math.random() < 0.015 * deltaTime) {
          game.pet.velocityY = JUMP_FORCE * 0.4; // Petit saut mignon
          game.pet.isOnGround = false;
        }

        // Physique verticale (gravité)
        game.pet.velocityY += GRAVITY * deltaTime;
        game.pet.y += game.pet.velocityY * deltaTime;

        // Collision avec le sol
        if (game.pet.y + game.pet.height >= GROUND_Y) {
          game.pet.y = GROUND_Y - game.pet.height;
          game.pet.velocityY = 0;
          game.pet.isOnGround = true;
        } else {
          game.pet.isOnGround = false;
        }
      }

      // Vérifier fin de vague
      if (
        game.monsters.length === 0 &&
        !game.boss &&
        game.state === "playing"
      ) {
        // Démarrer le timer de fin de vague
        if (game.waveCompleteTimer === 0) {
          game.waveCompleteTimer = 60; // 60 frames à 60 FPS = 1 seconde
        }
      }

      // Traiter le timer de fin de vague
      if (game.waveCompleteTimer > 0) {
        game.waveCompleteTimer -= deltaTime;
        if (game.waveCompleteTimer <= 0) {
          game.waveCompleteTimer = 0;
          if (game.wave < 3) {
            game.wave++;
            game.projectiles = []; // Supprimer tous les projectiles
            // Soigner le joueur après la vague
            healAfterWave();
            game.state = "wave-complete";
            setGameState("wave-complete");
            setCurrentWave(game.wave);
          } else {
            // Donner le pet avant le boss
            game.projectiles = []; // Supprimer tous les projectiles
            // Soigner le joueur après la vague finale
            healAfterWave();
            game.pet = {
              x: player.x - 80,
              y: GROUND_Y - 70,
              width: 70,
              height: 70,
              velocityY: 0,
              isOnGround: true,
              targetX: player.x - 80,
              targetY: GROUND_Y - 70,
              direction: 1,
            };
            game.state = "pet-intro";
            setGameState("pet-intro");
          }
        }
      }

      // Game Over
      if (player.health <= 0) {
        game.state = "game-over";
        setGameState("game-over");
      }

      // Dessiner les particules de dégâts
      game.damageParticles.forEach((particle) => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Dessiner les projectiles
      game.projectiles.forEach((proj) => {
        if (imagesRef.current.projectile) {
          ctx.save();
          if (gameData.weaponNeedsFlipping) {
            ctx.scale(-1, 1);
            ctx.drawImage(
              imagesRef.current.projectile,
              -proj.x - proj.width,
              proj.y,
              proj.width,
              proj.height,
            );
          } else {
            ctx.drawImage(
              imagesRef.current.projectile,
              proj.x,
              proj.y,
              proj.width,
              proj.height,
            );
          }
          ctx.restore();
        } else {
          ctx.fillStyle = "yellow";
          ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        }
      });

      // Dessiner les monstres
      game.monsters.forEach((monster) => {
        if (imagesRef.current.monster) {
          ctx.save();
          // Combiner la direction du monstre avec le flip de la BDD
          const shouldFlip = gameData.monstersNeedsFlipping
            ? monster.direction === 1
            : monster.direction === -1;
          if (shouldFlip) {
            ctx.scale(-1, 1);
            ctx.drawImage(
              imagesRef.current.monster,
              -monster.x - monster.width,
              monster.y,
              monster.width,
              monster.height,
            );
          } else {
            ctx.drawImage(
              imagesRef.current.monster,
              monster.x,
              monster.y,
              monster.width,
              monster.height,
            );
          }
          ctx.restore();
        }

        // Barre de vie du monstre
        ctx.fillStyle = "red";
        ctx.fillRect(monster.x, monster.y - 10, monster.width, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(
          monster.x,
          monster.y - 10,
          (monster.health / monster.maxHealth) * monster.width,
          5,
        );
      });

      // Dessiner le boss
      if (game.boss && imagesRef.current.boss) {
        ctx.save();
        if (gameData.bossNeedsFlipping) {
          ctx.scale(-1, 1);
          ctx.drawImage(
            imagesRef.current.boss,
            -game.boss.x - game.boss.width,
            game.boss.y,
            game.boss.width,
            game.boss.height,
          );
        } else {
          ctx.drawImage(
            imagesRef.current.boss,
            game.boss.x,
            game.boss.y,
            game.boss.width,
            game.boss.height,
          );
        }
        ctx.restore();

        // Barre de vie du boss
        ctx.fillStyle = "darkred";
        ctx.fillRect(game.boss.x, game.boss.y - 15, game.boss.width, 8);
        ctx.fillStyle = "red";
        ctx.fillRect(
          game.boss.x,
          game.boss.y - 15,
          (game.boss.health / game.boss.maxHealth) * game.boss.width,
          8,
        );
      }

      // Dessiner le pet
      if (game.pet && imagesRef.current.pet) {
        ctx.save();
        // Combiner la direction du pet avec le flip de la BDD
        const shouldFlip = gameData.petNeedsFlipping
          ? game.pet.direction === 1
          : game.pet.direction === -1;
        if (shouldFlip) {
          // Inverser l'image horizontalement
          ctx.scale(-1, 1);
          ctx.drawImage(
            imagesRef.current.pet,
            -game.pet.x - game.pet.width,
            game.pet.y,
            game.pet.width,
            game.pet.height,
          );
        } else {
          ctx.drawImage(
            imagesRef.current.pet,
            game.pet.x,
            game.pet.y,
            game.pet.width,
            game.pet.height,
          );
        }
        ctx.restore();
      }

      // Dessiner le joueur
      if (imagesRef.current.player) {
        ctx.save();
        const playerHeight = player.isCrouching
          ? player.height * 0.7
          : player.height;
        const playerY = player.isCrouching
          ? player.y + player.height * 0.3
          : player.y;

        // Combiner la direction du joueur avec le flip de la BDD
        const shouldFlip = gameData.mainCharacterNeedsFlipping
          ? player.direction === 1
          : player.direction === -1;
        if (shouldFlip) {
          ctx.scale(-1, 1);
          ctx.drawImage(
            imagesRef.current.player,
            -player.x - player.width,
            playerY,
            player.width,
            playerHeight,
          );
        } else {
          ctx.drawImage(
            imagesRef.current.player,
            player.x,
            playerY,
            player.width,
            playerHeight,
          );
        }
        ctx.restore();

        // Dessiner l'arme (uniquement pour les joueurs mêlée)
        if (isMelee && imagesRef.current.weapon) {
          const weaponX =
            player.x + (player.direction === 1 ? player.width - 10 : -30);
          const weaponY = player.y + 25;
          const weaponCenterX = weaponX + 20;
          const weaponCenterY = weaponY + 20;

          ctx.save();
          // Appliquer la rotation autour du centre de l'arme
          ctx.translate(weaponCenterX, weaponCenterY);
          ctx.rotate((player.weaponRotation * Math.PI) / 180);
          if (gameData.weaponNeedsFlipping) {
            ctx.scale(-1, 1);
          }
          ctx.drawImage(imagesRef.current.weapon, -20, -20, 40, 40);
          ctx.restore();
        }
      }

      // Barre de vie du joueur
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(10, 10, 204, 24);
      ctx.fillStyle = "darkred";
      ctx.fillRect(12, 12, 200, 20);
      ctx.fillStyle = "red";
      ctx.fillRect(12, 12, (player.health / player.maxHealth) * 200, 20);
      ctx.strokeStyle = "white";
      ctx.strokeRect(12, 12, 200, 20);

      // Texte de la vague
      ctx.fillStyle = "white";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "left";
      if (game.boss) {
        ctx.fillText("BOSS FINAL", 10, 60);
      } else {
        ctx.fillText(`Vague ${game.wave}/3`, 10, 60);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesLoaded, isMelee, forceReload]);

  const restartGame = () => {
    gameStateRef.current = {
      player: {
        x: 100,
        y: 300,
        width: 90,
        height: 105,
        velocityX: 0,
        velocityY: 0,
        health: isMelee ? 150 : 100,
        maxHealth: isMelee ? 150 : 100,
        hitCooldown: 0,
        isOnGround: false,
        isCrouching: false,
        attackCooldown: 0,
        direction: 1,
        weaponRotation: 0,
      },
      monsters: [],
      boss: null,
      projectiles: [],
      pet: null,
      damageParticles: [],
      keys: {},
      wave: 1,
      state: "intro",
      bossIntroProgress: 0,
      waveCompleteTimer: 0,
    };
    setGameState("intro");
    setCurrentWave(1);
  };

  const nextWave = () => {
    refetchGameData().then(() => {
      spawnWave(gameStateRef.current.wave);
      // Réinitialiser la position du joueur
      gameStateRef.current.player.x = 100;
      gameStateRef.current.player.y = 300;
      gameStateRef.current.player.velocityX = 0;
      gameStateRef.current.player.velocityY = 0;
      gameStateRef.current.player.isOnGround = false;
      gameStateRef.current.player.direction = 1;
      gameStateRef.current.state = "playing";
      setGameState("playing");
    });
  };

  if (!imagesLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-purple-600 via-pink-500 to-orange-400">
        <div className="text-center">
          <div className="text-3xl mb-6 text-white font-bold animate-pulse">
            Chargement du jeu...
          </div>
          <div className="text-6xl animate-spin">⚔️</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-linear-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Effets d'arrière-plan animés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-bounce">
          ⚔️
        </div>
        <div className="absolute top-20 right-20 text-5xl opacity-20 animate-pulse">
          🛡️
        </div>
        <div
          className="absolute bottom-20 left-20 text-6xl opacity-20 animate-spin"
          style={{ animationDuration: "8s" }}
        >
          ✨
        </div>
        <div
          className="absolute bottom-10 right-10 text-4xl opacity-20 animate-bounce"
          style={{ animationDelay: "1s" }}
        >
          🎮
        </div>
        <div
          className="absolute top-1/2 left-1/4 text-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        >
          👾
        </div>
        <div
          className="absolute top-1/3 right-1/3 text-4xl opacity-10 animate-bounce"
          style={{ animationDelay: "1.5s" }}
        >
          💎
        </div>
      </div>

      {/* Conteneur du canvas - prend tout l'espace */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Canvas du jeu */}
          <div className="relative w-full h-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={1600}
              height={960}
              className="border-4 border-white/30 rounded-2xl shadow-2xl transition-all duration-300 hover:border-white/50"
              style={{
                imageRendering: "pixelated",
                boxShadow: "0 0 30px rgba(236, 72, 153, 0.3)",
              }}
            />

            {/* Overlays de jeu */}
            {gameState === "intro" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl">
                <div className="text-center text-white transform transition-all duration-500">
                  <h1 className="text-7xl font-bold mb-8 bg-linear-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                    ⚔️ PRÊT POUR L&apos;AVENTURE ? ⚔️
                  </h1>
                  <button
                    onClick={() => {
                      refetchGameData().then(() => {
                        gameStateRef.current.state = "playing";
                        setGameState("playing");
                        spawnWave(1);
                      });
                    }}
                    className="bg-linear-to-r cursor-pointer from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 px-12 rounded-xl text-3xl shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 transform animate-bounce"
                  >
                    🎮 START 🎮
                  </button>
                  <p className="text-sm mt-6 text-white/60">
                    Appuyez sur Entrée ou Espace pour commencer
                  </p>
                </div>
              </div>
            )}

            {gameState === "wave-complete" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl">
                <div className="text-center text-white transform transition-all duration-500">
                  <h2 className="text-5xl font-bold mb-6 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse py-4">
                    ✨ Vague {currentWave - 1} terminée ! ✨
                  </h2>
                  <button
                    onClick={nextWave}
                    className="bg-linear-to-r cursor-pointer from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform"
                  >
                    Vague suivante →
                  </button>
                  <p className="text-sm mt-4 text-white/60">
                    Appuyez sur Entrée ou Espace pour continuer
                  </p>
                </div>
              </div>
            )}

            {gameState === "victory" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl">
                <div className="text-center text-white transform transition-all duration-500">
                  <h2 className="text-6xl font-bold mb-4 animate-bounce">
                    🎉 VICTOIRE ! 🎉
                  </h2>
                  <p className="text-2xl mb-8 bg-linear-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent font-bold">
                    Vous avez vaincu le boss final !
                  </p>
                  <button
                    onClick={restartGame}
                    className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform"
                  >
                    🔄 Rejouer
                  </button>
                </div>
              </div>
            )}

            {gameState === "game-over" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl">
                <div className="text-center text-white transform transition-all duration-500">
                  <h2 className="text-6xl font-bold mb-4 text-red-500 animate-pulse">
                    💀 GAME OVER 💀
                  </h2>
                  <p className="text-xl mb-8 text-gray-300">
                    Vous avez été vaincu...
                  </p>
                  <button
                    onClick={restartGame}
                    className="bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform"
                  >
                    ⚔️ Réessayer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bouton Régénérer */}
          <button
            onClick={() => (window.location.href = "/")}
            className="absolute cursor-pointer bottom-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 md:p-4 rounded-xl shadow-2xl transition-all duration-300 hover:bg-white/20 hover:scale-110 hover:border-white/40 z-10"
            style={{ boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)" }}
          >
            <span className="text-xl">🔄 Régénérer</span>
          </button>

          {/* Bouton pour afficher/masquer les contrôles */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="absolute cursor-pointer bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 md:p-4 rounded-xl shadow-2xl transition-all duration-300 hover:bg-white/20 hover:scale-110 hover:border-white/40 z-10"
            style={{ boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)" }}
          >
            <span className="text-xl">Commandes</span>
          </button>

          {/* Menu de contrôles dépliable */}
          {showControls && (
            <div
              className="absolute bottom-20 right-4 w-[90vw] max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 md:p-6 rounded-2xl shadow-2xl transition-all duration-300 animate-fade-in z-10"
              style={{ boxShadow: "0 0 20px rgba(236, 72, 153, 0.2)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl md:text-2xl bg-linear-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  🎮 Contrôles
                </h3>
                <button
                  onClick={() => setShowControls(false)}
                  className="text-white/60 hover:text-white text-2xl transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                <div className="flex items-center gap-2 bg-white/5 p-2 md:p-3 rounded-lg backdrop-blur-sm">
                  <span className="text-xl md:text-2xl">⬅️</span>
                  <span>Q / ← : Reculer</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 md:p-3 rounded-lg backdrop-blur-sm">
                  <span className="text-xl md:text-2xl">➡️</span>
                  <span>D / → : Avancer</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 md:p-3 rounded-lg backdrop-blur-sm">
                  <span className="text-xl md:text-2xl">⬆️</span>
                  <span>Z / Espace : Sauter</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 md:p-3 rounded-lg backdrop-blur-sm">
                  <span className="text-xl md:text-2xl">⬇️</span>
                  <span>S / ↓ : Accroupir</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 md:p-3 rounded-lg backdrop-blur-sm">
                  <span className="text-xl md:text-2xl">⚔️</span>
                  <span>E : Attaquer</span>
                </div>
                <div className="flex items-center gap-2 bg-yellow-400/20 p-2 md:p-3 rounded-lg backdrop-blur-sm border border-yellow-400/30">
                  <span className="text-xl md:text-2xl">🎮</span>
                  <span className="text-yellow-300">N : Vague suivante</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
