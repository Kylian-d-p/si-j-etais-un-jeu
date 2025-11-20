"use client";

import { useEffect, useRef, useState } from "react";

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
}

export default function Game(props: {
  game: {
    mainCharacterImageUrl: string;
    backgroundImageUrl: string;
    weaponImageUrl: string;
    projectileImageUrl: string | null;
    monstersImageUrl: string;
    bossImageUrl: string;
    groundImageUrl: string;
    petImageUrl: string;
  };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<
    | "playing"
    | "wave-complete"
    | "pet-intro"
    | "boss-intro"
    | "victory"
    | "game-over"
  >("playing");
  const [currentWave, setCurrentWave] = useState(1);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Détecter si le joueur est en mode mêlée (pas d'attaque à distance disponible)
  const isMelee = !props.game.projectileImageUrl;

  const gameStateRef = useRef({
    player: {
      x: 100,
      y: 300,
      width: 65,
      height: 75,
      velocityX: 0,
      velocityY: 0,
      // Si le joueur est mêlée, lui donner plus de points de vie
      health: isMelee ? 150 : 100,
      maxHealth: isMelee ? 150 : 100,
      hitCooldown: 0,
      isOnGround: false,
      isCrouching: false,
      attackCooldown: 0,
      direction: 1, // 1 = droite, -1 = gauche
    },
    monsters: [] as Monster[],
    boss: null as (Entity & { jumpCooldown: number }) | null,
    projectiles: [] as Projectile[],
    pet: null as Pet | null,
    keys: {} as Record<string, boolean>,
    wave: 1,
    state: "playing" as typeof gameState,
    bossIntroProgress: 0,
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
      loadImage(props.game.mainCharacterImageUrl),
      loadImage(props.game.backgroundImageUrl),
      loadImage(props.game.weaponImageUrl),
      props.game.projectileImageUrl
        ? loadImage(props.game.projectileImageUrl)
        : Promise.resolve(null),
      loadImage(props.game.monstersImageUrl),
      loadImage(props.game.bossImageUrl),
      loadImage(props.game.groundImageUrl),
      loadImage(props.game.petImageUrl),
    ])
      .then(
        ([
          player,
          background,
          weapon,
          projectile,
          monster,
          boss,
          ground,
          pet,
        ]) => {
          imagesRef.current = {
            player,
            background,
            weapon,
            projectile,
            monster,
            boss,
            ground,
            pet,
          };
          setImagesLoaded(true);
        }
      )
      .catch((error) => {
        console.error("Erreur lors du chargement des images:", error);
      });
  }, [props.game]);

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
            y: GROUND_Y - 50,
            width: 50,
            height: 50,
            velocityY: 0,
            isOnGround: true,
            targetX: gameStateRef.current.player.x - 80,
            targetY: GROUND_Y - 50,
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
        width: 60,
        height: 70,
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
      width: 100,
      height: 125,
      velocityX: 0,
      velocityY: 0,
      health: 300,
      maxHealth: 300,
      isOnGround: false,
      jumpCooldown: 0,
    };
  };

  // Soigne le joueur après la fin d'une vague (ex: 25% des PV max)
  const healAfterWave = () => {
    const player = gameStateRef.current.player;
    const healAmount = Math.ceil(player.maxHealth * 0.25);
    player.health = Math.min(player.maxHealth, player.health + healAmount);
  };

  // Initialiser le jeu
  useEffect(() => {
    if (imagesLoaded) {
      spawnWave(1);
    }
  }, [imagesLoaded]);

  // Boucle de jeu
  useEffect(() => {
    if (!imagesLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 600;
    const GROUND_Y = 480;
    const GRAVITY = 0.15;
    const CROUCH_FALL_MULTIPLIER = 2.2; // Multiplicateur de gravité quand on s'accroupit en l'air
    const JUMP_FORCE = -8.5;
    const MOVE_SPEED = 3;
    // Inertie / accélération du joueur
    const ACCEL = 0.5; // accélération par unité de frameTime
    const MAX_MOVE_SPEED = 4; // vitesse max atteignable en courant
    const FRICTION = 0.7; // décélération lorsque aucune touche maintenue
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
          CANVAS_HEIGHT
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
            groundHeight
          );
          x += groundWidth;
        }
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
              game.boss.height * scale
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
            100
          );
        }

        ctx.fillStyle = "white";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Vous avez reçu un compagnon !",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 100
        );
        ctx.font = "20px Arial";
        ctx.fillText(
          "Appuyez sur Entrée pour continuer",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 140
        );

        if (game.keys["enter"]) {
          game.state = "boss-intro";
          setGameState("boss-intro");
          spawnBoss();
        }

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
        if (Math.abs(player.velocityX) < 0.05) {
          player.velocityX = 0;
        } else {
          player.velocityX -=
            Math.sign(player.velocityX) * FRICTION * deltaTime;
        }
      }

      // S'accroupir
      player.isCrouching = game.keys["s"] || game.keys["arrowdown"];

      // Sauter
      if (
        (game.keys[" "] || game.keys["z"] || game.keys["arrowup"]) &&
        player.isOnGround
      ) {
        player.velocityY = JUMP_FORCE;
        player.isOnGround = false;
      }

      // Attaquer
      if (game.keys["e"] && player.attackCooldown <= 0) {
        player.attackCooldown = 30;

        if (props.game.projectileImageUrl && imagesRef.current.projectile) {
          // Attaque à distance
          game.projectiles.push({
            x: player.x + (player.direction === 1 ? player.width : 0),
            y: player.y + player.height / 2,
            velocityX: player.direction * 1.7,
            width: 30,
            height: 20,
          });
        } else {
          // Attaque de mêlée
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
        } else {
          monster.velocityX = 0;

          // Attaquer le joueur
          if (monster.attackCooldown <= 0) {
            monster.attackCooldown = 60;
            if (checkCollision(monster, player)) {
              if (player.hitCooldown <= 0) {
                player.health -= 10;
                player.hitCooldown = 12; // ~0.2s en units de frameTime
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
                MAX_SPEED
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

      // Mettre à jour le pet
      if (game.pet) {
        const followDistance = 80;
        const smoothFactor = 0.15; // Facteur d'interpolation pour des mouvements smooth

        // Position cible (suivre le joueur avec une distance)
        game.pet.targetX = player.x - followDistance;
        game.pet.targetY = GROUND_Y - game.pet.height;

        // Interpolation smooth pour le mouvement horizontal
        const dx = game.pet.targetX - game.pet.x;
        const distance = Math.abs(dx);

        if (distance > 5) {
          // Mouvement rapide avec interpolation smooth
          game.pet.x += dx * smoothFactor * deltaTime;
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
            y: GROUND_Y - 50,
            width: 50,
            height: 50,
            velocityY: 0,
            isOnGround: true,
            targetX: player.x - 80,
            targetY: GROUND_Y - 50,
          };
          game.state = "pet-intro";
          setGameState("pet-intro");
        }
      }

      // Game Over
      if (player.health <= 0) {
        game.state = "game-over";
        setGameState("game-over");
      }

      // Dessiner les projectiles
      game.projectiles.forEach((proj) => {
        if (imagesRef.current.projectile) {
          ctx.drawImage(
            imagesRef.current.projectile,
            proj.x,
            proj.y,
            proj.width,
            proj.height
          );
        } else {
          ctx.fillStyle = "yellow";
          ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        }
      });

      // Dessiner les monstres
      game.monsters.forEach((monster) => {
        if (imagesRef.current.monster) {
          ctx.save();
          if (monster.direction === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(
              imagesRef.current.monster,
              -monster.x - monster.width,
              monster.y,
              monster.width,
              monster.height
            );
          } else {
            ctx.drawImage(
              imagesRef.current.monster,
              monster.x,
              monster.y,
              monster.width,
              monster.height
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
          5
        );
      });

      // Dessiner le boss
      if (game.boss && imagesRef.current.boss) {
        ctx.drawImage(
          imagesRef.current.boss,
          game.boss.x,
          game.boss.y,
          game.boss.width,
          game.boss.height
        );

        // Barre de vie du boss
        ctx.fillStyle = "darkred";
        ctx.fillRect(game.boss.x, game.boss.y - 15, game.boss.width, 8);
        ctx.fillStyle = "red";
        ctx.fillRect(
          game.boss.x,
          game.boss.y - 15,
          (game.boss.health / game.boss.maxHealth) * game.boss.width,
          8
        );
      }

      // Dessiner le pet
      if (game.pet && imagesRef.current.pet) {
        ctx.drawImage(
          imagesRef.current.pet,
          game.pet.x,
          game.pet.y,
          game.pet.width,
          game.pet.height
        );
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

        if (player.direction === -1) {
          ctx.scale(-1, 1);
          ctx.drawImage(
            imagesRef.current.player,
            -player.x - player.width,
            playerY,
            player.width,
            playerHeight
          );
        } else {
          ctx.drawImage(
            imagesRef.current.player,
            player.x,
            playerY,
            player.width,
            playerHeight
          );
        }
        ctx.restore();

        // Dessiner l'arme (toujours visible)
        if (imagesRef.current.weapon) {
          const weaponX =
            player.x + (player.direction === 1 ? player.width : -40);
          ctx.drawImage(
            imagesRef.current.weapon,
            weaponX,
            player.y + 25,
            40,
            40
          );
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
    };
  }, [imagesLoaded, props.game.projectileImageUrl]);

  const restartGame = () => {
    gameStateRef.current = {
      player: {
        x: 100,
        y: 300,
        width: 65,
        height: 75,
        velocityX: 0,
        velocityY: 0,
        health: isMelee ? 150 : 100,
        maxHealth: isMelee ? 150 : 100,
        hitCooldown: 0,
        isOnGround: false,
        isCrouching: false,
        attackCooldown: 0,
        direction: 1,
      },
      monsters: [],
      boss: null,
      projectiles: [],
      pet: null,
      keys: {},
      wave: 1,
      state: "playing",
      bossIntroProgress: 0,
    };
    setGameState("playing");
    setCurrentWave(1);
    spawnWave(1);
  };

  const nextWave = () => {
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
  };

  if (!imagesLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">Chargement du jeu...</div>
          <div className="animate-spin text-4xl">⚔️</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="border-4 border-gray-700 rounded-lg"
        />

        {gameState === "wave-complete" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">
                Vague {currentWave - 1} terminée !
              </h2>
              <button
                onClick={nextWave}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
              >
                Vague suivante
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <h2 className="text-5xl font-bold mb-4 text-yellow-400">
                🎉 VICTOIRE ! 🎉
              </h2>
              <p className="text-xl mb-6">Vous avez vaincu le boss final !</p>
              <button
                onClick={restartGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
              >
                Rejouer
              </button>
            </div>
          </div>
        )}

        {gameState === "game-over" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <h2 className="text-5xl font-bold mb-4 text-red-500">
                GAME OVER
              </h2>
              <p className="text-xl mb-6">Vous avez été vaincu...</p>
              <button
                onClick={restartGame}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-800 text-white p-4 rounded-lg max-w-2xl">
        <h3 className="font-bold text-xl mb-2">Contrôles :</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>⬅️ Q ou Flèche Gauche : Reculer</div>
          <div>➡️ D ou Flèche Droite : Avancer</div>
          <div>⬆️ Z ou Espace : Sauter</div>
          <div>⬇️ S ou Flèche Bas : S&apos;accroupir</div>
          <div>⚔️ E : Attaquer</div>
          <div className="text-yellow-400">
            🎮 N : Passer à la vague suivante (Cheat)
          </div>
        </div>
      </div>
    </div>
  );
}
