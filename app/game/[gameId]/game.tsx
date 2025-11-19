"use client";

import { Boss } from "@/components/game/Boss";
import { Camera } from "@/components/game/Camera";
import { Chest } from "@/components/game/Chest";
import { DamageNumber } from "@/components/game/DamageNumber";
import { Enemy } from "@/components/game/Enemy";
import { ParticleSystem } from "@/components/game/ParticleSystem";
import { Pet } from "@/components/game/Pet";
import { Platform } from "@/components/game/Platform";
import { Player } from "@/components/game/Player";
import { Star } from "@/components/game/Star";
import { GameState } from "@/components/game/types";
import { useEffect, useRef, useState } from "react";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.WAVE);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [healthText, setHealthText] = useState("100/100");
  const [waveInfo, setWaveInfo] = useState("Vague: 1");
  const [scoreInfo, setScoreInfo] = useState("Score: 0");
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const [victoryMessage, setVictoryMessage] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adapter le canvas à toute la largeur et hauteur de l'écran
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Initialisation du jeu
    const player = new Player(100, canvas.height - 30 - 60); // 60 = hauteur approximative du joueur
    let enemies: Enemy[] = [];
    let boss: Boss | null = null;
    let chest: Chest | null = null;
    let pet: Pet | null = null;
    let platforms: Platform[] = [];
    let star: Star | null = null;
    let currentWave = 1;
    let score = 0;
    let combo = 0;
    let comboMultiplier = 1;
    let comboTimer = 0;
    let state = GameState.WAVE;
    const particleSystem = new ParticleSystem();
    const camera = new Camera();
    const damageNumbers: DamageNumber[] = [];
    let stateTransitionTimer = 0;
    let fadeAlpha = 0;

    // Charger l'image de fond
    const backgroundImage = new Image();
    let backgroundLoaded = false;
    backgroundImage.onload = () => {
      backgroundLoaded = true;
    };
    backgroundImage.onerror = () => {
      console.warn("Impossible de charger decor.gif");
      backgroundLoaded = false;
    };
    backgroundImage.src = "/assets/decor.gif";
    const keys: { [key: string]: boolean } = {};
    const easterEggSequence: string[] = [];
    const petSequence: string[] = [];
    let easterEggActive = false;
    let mouseClick = false;
    let isMouseDown = false;
    let gameAnimationFrame = 0;

    // Gestion des touches
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      checkEasterEggs(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    // Gestion du clic souris pour le tir
    const handleMouseClick = () => {
      mouseClick = true;
      setTimeout(() => {
        mouseClick = false;
      }, 50);
    };

    // Gestion du tir continu avec la souris
    const handleMouseDown = () => {
      isMouseDown = true;
    };
    const handleMouseUp = () => {
      isMouseDown = false;
    };

    let petSequenceTimeout: ReturnType<typeof setTimeout> | null = null;

    const checkEasterEggs = (key: string) => {
      // Konami Code
      const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
      easterEggSequence.push(key);
      if (easterEggSequence.length > konamiCode.length) {
        easterEggSequence.shift();
      }
      if (easterEggSequence.join(",") === konamiCode.join(",")) {
        player.heal(50);
        easterEggActive = true;
        setTimeout(() => {
          easterEggActive = false;
        }, 3000);
      }

      // PET easter egg
      if (key.toLowerCase() === "p" || key.toLowerCase() === "e" || key.toLowerCase() === "t") {
        petSequence.push(key.toLowerCase());
        if (petSequence.length > 3) petSequence.shift();
        if (petSequence.join("") === "pet") {
          score += 1000;
          easterEggActive = true;
          setTimeout(() => {
            easterEggActive = false;
          }, 3000);
        }
        if (petSequenceTimeout) clearTimeout(petSequenceTimeout);
        petSequenceTimeout = setTimeout(() => {
          petSequence.length = 0;
        }, 1000);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("click", handleMouseClick);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    const startWave = () => {
      enemies = [];
      const enemyCount = 3 + currentWave;

      if (currentWave === 2) {
        // Vague 2 : ennemis des deux côtés
        const enemiesPerSide = Math.ceil(enemyCount / 2);

        // Ennemis à droite
        for (let i = 0; i < enemiesPerSide; i++) {
          const x = canvas.width - 100 - i * 60;
          const y = canvas.height - 150;
          enemies.push(new Enemy(x, y));
        }

        // Ennemis à gauche
        for (let i = 0; i < enemyCount - enemiesPerSide; i++) {
          const x = 100 + i * 60;
          const y = canvas.height - 150;
          enemies.push(new Enemy(x, y));
        }
      } else {
        // Vague 1 : ennemis seulement à droite
        for (let i = 0; i < enemyCount; i++) {
          const x = canvas.width - 100 - i * 60;
          const y = canvas.height - 150;
          enemies.push(new Enemy(x, y));
        }
      }
    };

    const spawnChest = () => {
      const x = canvas.width / 2 - 25;
      const y = canvas.height - 140;
      chest = new Chest(x, y);
      state = GameState.CHEST;
      setGameState(GameState.CHEST);
    };

    const spawnBoss = () => {
      const x = canvas.width - 150;
      const y = canvas.height - 200;
      boss = new Boss(x, y);
      state = GameState.BOSS;
      setGameState(GameState.BOSS);
      setWaveInfo("BOSS");
    };

    const createPlatformCourse = () => {
      platforms = [];
      const groundY = canvas.height - 30;
      const startX = 100;
      const goalX = canvas.width - 250;

      // Plateforme de départ
      platforms.push(new Platform(startX, groundY - 50, 150, 30));

      // Parcours DIFFICILE avec plateformes variées et aléatoires
      let currentX = startX + 200;
      let currentY = groundY - 50;

      // Paramètres aléatoires pour un parcours PLUS DIFFICILE
      const platformWidth = 80 + Math.random() * 40; // Entre 80 et 120 (plus petites)
      const platformSpacing = 200 + Math.random() * 100; // Entre 200 et 300 (plus espacées)
      const maxHeight = canvas.height - 400 + Math.random() * 150; // Plus haut
      const minHeight = groundY - 100 - Math.random() * 150; // Plus bas
      const heightVariationRange = 100 + Math.random() * 100; // Entre 100 et 200 (grands sauts)

      // Nombre de plateformes variable (moins de plateformes = plus difficile)
      const numPlatforms = 3 + Math.floor(Math.random() * 3); // Entre 3 et 5 plateformes

      for (let i = 0; i < numPlatforms && currentX < goalX - 100; i++) {
        // Variation de hauteur plus aléatoire et plus extrême
        const heightVariation = Math.random() * heightVariationRange * 2 - heightVariationRange;
        currentY = Math.max(maxHeight, Math.min(minHeight, currentY + heightVariation));

        // Largeur de plateforme variable (souvent plus petites)
        const currentPlatformWidth = platformWidth + (Math.random() * 30 - 15);

        platforms.push(new Platform(currentX, currentY, currentPlatformWidth, 30));

        // Espacement variable (souvent plus grand)
        const currentSpacing = platformSpacing + (Math.random() * 60 - 30);
        currentX += currentSpacing;
      }

      // Plateforme d'arrivée
      platforms.push(new Platform(goalX, groundY - 50, 150, 30));

      // Créer l'étoile tout à droite de l'écran, en l'air (position variable)
      const starX = canvas.width - 100;
      const starY = canvas.height - 200 - Math.random() * 150; // Entre 200 et 350 pixels du sol
      star = new Star(starX, starY);

      // Réinitialiser la position du joueur
      player.x = startX + 30;
      player.y = groundY - 110;
    };

    const startPlatformCourse = () => {
      createPlatformCourse();
      state = GameState.PLATFORM;
      setGameState(GameState.PLATFORM);
      setWaveInfo("Parcours");
    };

    interface Rect {
      x: number;
      y: number;
      width: number;
      height: number;
    }

    const checkCollision = (rect1: Rect, rect2: Rect) => {
      return (
        rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y
      );
    };

    const updateWave = () => {
      enemies.forEach((enemy) => {
        enemy.update(player, canvas);

        // Les ennemis font des dégâts quand ils attaquent
        if (enemy.isAttacking) {
          const attackBox = enemy.getAttackBox();
          if (checkCollision(player, attackBox)) {
            // Dégâts infligés par l'ennemi
            const damage = 8;
            player.takeDamage(damage);
            particleSystem.createHitEffect(player.x + player.width / 2, player.y + player.height / 2, "#ff0000");
            camera.addShake(3);

            damageNumbers.push(new DamageNumber(player.x + player.width / 2, player.y, damage, "#ff0000"));
          }
        }

        // Dégâts de contact si l'ennemi est très proche (collision directe)
        const distance = Math.abs(player.x - enemy.x);
        if (distance < 20 && !enemy.isAttacking) {
          // Petit dégât de contact continu (seulement si très proche)
          if (gameAnimationFrame % 30 === 0) {
            // Toutes les 30 frames
            const damage = 2;
            player.takeDamage(damage);
            particleSystem.createHitEffect(player.x + player.width / 2, player.y + player.height / 2, "#ff6666");
            camera.addShake(1);

            damageNumbers.push(new DamageNumber(player.x + player.width / 2, player.y, damage, "#ff6666"));
          }
        }
      });

      // Attaque au corps à corps
      if (player.isAttacking) {
        const attackBox = player.getAttackBox();
        enemies.forEach((enemy, index) => {
          if (checkCollision(enemy, attackBox)) {
            const damage = 20;
            enemy.takeDamage(damage);
            particleSystem.createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ffd700");
            camera.addShake(2);

            // Afficher le nombre de dégâts
            damageNumbers.push(new DamageNumber(enemy.x + enemy.width / 2, enemy.y, damage, "#ffd700"));

            if (enemy.isDead()) {
              combo++;
              comboTimer = 180; // 3 secondes à 60fps
              comboMultiplier = Math.min(1 + combo * 0.1, 3); // Max x3
              const points = Math.floor(100 * comboMultiplier);
              score += points;

              particleSystem.createDeathEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              camera.addShake(5);

              // Afficher le score gagné
              damageNumbers.push(new DamageNumber(enemy.x + enemy.width / 2, enemy.y - 20, points, "#00ff00"));

              enemies.splice(index, 1);
            }
          }
        });
      }

      // Collisions des balles avec les ennemis
      const bullets = player.getBullets();
      bullets.forEach((bullet) => {
        if (!bullet.active) return;
        enemies.forEach((enemy, enemyIndex) => {
          if (bullet.checkCollision(enemy)) {
            const damage = bullet.damage;
            enemy.takeDamage(damage);
            particleSystem.createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ffd700");
            camera.addShake(1);
            bullet.active = false;

            // Afficher le nombre de dégâts
            damageNumbers.push(new DamageNumber(enemy.x + enemy.width / 2, enemy.y, damage, "#ffd700"));

            if (enemy.isDead()) {
              combo++;
              comboTimer = 180;
              comboMultiplier = Math.min(1 + combo * 0.1, 3);
              const points = Math.floor(100 * comboMultiplier);
              score += points;

              particleSystem.createDeathEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              camera.addShake(5);

              damageNumbers.push(new DamageNumber(enemy.x + enemy.width / 2, enemy.y - 20, points, "#00ff00"));

              enemies.splice(enemyIndex, 1);
            }
          }
        });
      });

      if (enemies.length === 0) {
        // Réinitialiser le combo quand la vague se termine
        combo = 0;
        comboMultiplier = 1;

        if (currentWave === 1) {
          // Vague 1 : parcours puis coffre
          stateTransitionTimer = 60;
          fadeAlpha = 0;
          setTimeout(() => {
            startPlatformCourse();
          }, 1000);
        } else if (currentWave === 2) {
          // Vague 2 : parcours puis coffre avec le pet
          stateTransitionTimer = 60;
          fadeAlpha = 0;
          setTimeout(() => {
            startPlatformCourse();
          }, 1000);
        } else {
          // Vague 3 et plus : spawn du boss
          stateTransitionTimer = 60;
          fadeAlpha = 0;
          setTimeout(() => {
            spawnBoss();
          }, 1000);
        }
      }

      // Mettre à jour le combo timer
      if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
          combo = 0;
          comboMultiplier = 1;
        }
      }

      // Mettre à jour les nombres de dégâts
      damageNumbers.forEach((num, index) => {
        num.update();
        if (num.isDead()) {
          damageNumbers.splice(index, 1);
        }
      });
    };

    const updateChest = () => {
      if (chest && chest.checkCollision(player)) {
        const petFound = chest.open();
        if (petFound) {
          score += 500;
          particleSystem.createRewardEffect(chest.x + chest.width / 2, chest.y + chest.height / 2);

          if (currentWave === 1) {
            // Passer à la vague 2 après la vague 1
            currentWave++;
            chest = null;
            setTimeout(() => {
              state = GameState.WAVE;
              setGameState(GameState.WAVE);
              setWaveInfo(`Vague: ${currentWave}`);
              startWave();
            }, 2000);
          } else if (currentWave === 2 && !pet) {
            // Après la vague 2, créer le pet et spawner le boss
            pet = new Pet(player.x + player.width + 20, player.y);
            chest = null;
            setTimeout(() => {
              spawnBoss();
            }, 2000);
          }
        }
      }

      // Mettre à jour le pet s'il existe (même dans l'état CHEST)
      if (pet && !pet.isDead()) {
        pet.update(player, null, canvas, particleSystem);
      }
    };

    const updatePlatform = () => {
      const groundY = canvas.height - 30;
      let onPlatform = false;

      // Vérifier les collisions avec les plateformes
      platforms.forEach((platform) => {
        if (platform.checkCollision(player)) {
          onPlatform = true;
          player.y = platform.getTop() - player.height;
          player.velocityY = 0;
          player.isGrounded = true;
        }
      });

      // Si le joueur n'est sur aucune plateforme, vérifier si au sol
      if (!onPlatform) {
        if (player.y + player.height >= groundY) {
          player.y = groundY - player.height;
          player.velocityY = 0;
          player.isGrounded = true;
        } else {
          player.isGrounded = false;
        }
      }

      // Mettre à jour l'étoile
      if (star && !star.collected) {
        star.update();

        // Vérifier la collision avec l'étoile
        if (star.checkCollision(player)) {
          star.collect();
          score += 200;
          particleSystem.createRewardEffect(star.x + star.width / 2, star.y + star.height / 2);
          particleSystem.createExplosion(star.x + star.width / 2, star.y + star.height / 2, "#FFD700");

          // Passer directement au niveau suivant quand l'étoile est collectée
          if (currentWave === 1) {
            // Après avoir collecté l'étoile de la vague 1, spawner le coffre
            setTimeout(() => {
              spawnChest();
            }, 500);
          } else if (currentWave === 2) {
            // Après avoir collecté l'étoile de la vague 2, spawner le coffre avec le pet
            setTimeout(() => {
              spawnChest();
            }, 500);
          }
        }
      }

      // Mettre à jour le joueur
      player.update(keys, canvas, false, particleSystem);

      // Vérifier si le joueur tombe hors de l'écran - MORT INSTANTANÉE
      if (player.y > canvas.height) {
        // Effet d'explosion à la position du joueur
        const explosionX = player.x + player.width / 2;
        const explosionY = canvas.height - 50;
        particleSystem.createExplosion(explosionX, explosionY, "#ff0000");
        camera.addShake(15);

        // Tuer le joueur instantanément
        player.health = 0;
        state = GameState.GAME_OVER;
        setGameState(GameState.GAME_OVER);
        setGameOverMessage(`Vous êtes tombé! Score final: ${score.toLocaleString()}`);
        setShowGameOver(true);
      }
    };

    const updateBoss = () => {
      if (!boss) return;

      boss.update(player, canvas, particleSystem);

      // Mettre à jour le pet s'il existe
      if (pet && !pet.isDead() && boss) {
        const currentPet = pet;
        const currentBoss = boss;

        currentPet.update(player, currentBoss, canvas, particleSystem);

        // Collisions des balles du pet avec le boss
        const petBullets = currentPet.getBullets();
        petBullets.forEach((bullet) => {
          if (!bullet.active) return;
          if (bullet.checkCollision(currentBoss)) {
            currentBoss.takeDamage(bullet.damage);
            particleSystem.createHitEffect(currentBoss.x + currentBoss.width / 2, currentBoss.y + currentBoss.height / 2, "#ff69b4");
            bullet.active = false;
            if (currentBoss.isDead()) {
              score += 2000;
              camera.addShake(20);
              particleSystem.createExplosion(currentBoss.x + currentBoss.width / 2, currentBoss.y + currentBoss.height / 2, "#ff0000");

              state = GameState.VICTORY;
              setGameState(GameState.VICTORY);
              setVictoryMessage(`Félicitations! Vous avez battu le boss! Score: ${score.toLocaleString()}`);
              setShowVictory(true);
            }
          }
        });

        // Le boss peut attaquer le pet
        if (currentBoss.isAttacking) {
          const attackBox = currentBoss.getAttackBox();
          const petRect = { x: currentPet.x, y: currentPet.y, width: currentPet.width, height: currentPet.height };
          if (checkCollision(petRect, attackBox)) {
            currentPet.takeDamage(5);
            particleSystem.createHitEffect(currentPet.x + currentPet.width / 2, currentPet.y + currentPet.height / 2, "#ff0000");
          }
        }

        // Les balles du boss peuvent toucher le pet
        const bossBullets = currentBoss.getBullets();
        bossBullets.forEach((bullet) => {
          if (!bullet.active) return;
          const petRect = { x: currentPet.x, y: currentPet.y, width: currentPet.width, height: currentPet.height };
          if (bullet.checkCollision(petRect)) {
            currentPet.takeDamage(bullet.damage);
            particleSystem.createHitEffect(currentPet.x + currentPet.width / 2, currentPet.y + currentPet.height / 2, "#ff0000");
            bullet.active = false;
          }
        });
      }

      // Vérifier si le joueur est au-dessus du boss (peut sauter par-dessus)
      const playerBottom = player.y + player.height;
      const bossTop = boss.y;
      const isPlayerAboveBoss = playerBottom < bossTop;

      if (boss.isAttacking) {
        const attackBox = boss.getAttackBox();
        // L'attaque ne touche que si le joueur n'est pas au-dessus du boss
        if (checkCollision(player, attackBox) && !isPlayerAboveBoss) {
          const damage = 5;
          player.takeDamage(damage);
          particleSystem.createHitEffect(player.x + player.width / 2, player.y + player.height / 2, "#ff0000");
          camera.addShake(8);

          damageNumbers.push(new DamageNumber(player.x + player.width / 2, player.y, damage, "#ff0000"));
        }
      }

      if (boss.isSpecialAttacking) {
        const attackBox = boss.getSpecialAttackBox();
        // L'attaque spéciale ne touche que si le joueur n'est pas au-dessus du boss
        if (checkCollision(player, attackBox) && !isPlayerAboveBoss) {
          const damage = 8;
          player.takeDamage(damage);
          particleSystem.createHitEffect(player.x + player.width / 2, player.y + player.height / 2, "#ff00ff");
          camera.addShake(12);

          damageNumbers.push(new DamageNumber(player.x + player.width / 2, player.y, damage, "#ff00ff"));
        }
      }

      // Attaque au corps à corps
      if (player.isAttacking) {
        const attackBox = player.getAttackBox();
        if (checkCollision(boss, attackBox)) {
          boss.takeDamage(15);
          particleSystem.createHitEffect(boss.x + boss.width / 2, boss.y + boss.height / 2, "#ffd700");
          if (boss.isDead()) {
            score += 2000;
            state = GameState.VICTORY;
            setGameState(GameState.VICTORY);
            setVictoryMessage(`Félicitations! Vous avez battu le boss! Score: ${score}`);
            setShowVictory(true);
          }
        }
      }

      // Collisions des balles du joueur avec le boss
      if (boss) {
        const currentBoss = boss;
        const bullets = player.getBullets();
        bullets.forEach((bullet) => {
          if (!bullet.active) return;
          if (bullet.checkCollision(currentBoss)) {
            const damage = bullet.damage;
            currentBoss.takeDamage(damage);
            particleSystem.createHitEffect(currentBoss.x + currentBoss.width / 2, currentBoss.y + currentBoss.height / 2, "#ffd700");
            camera.addShake(2);
            bullet.active = false;

            damageNumbers.push(new DamageNumber(currentBoss.x + currentBoss.width / 2, currentBoss.y, damage, "#ffd700"));

            if (currentBoss.isDead()) {
              score += 2000;
              camera.addShake(20);
              particleSystem.createExplosion(currentBoss.x + currentBoss.width / 2, currentBoss.y + currentBoss.height / 2, "#ff0000");

              state = GameState.VICTORY;
              setGameState(GameState.VICTORY);
              setVictoryMessage(`Félicitations! Vous avez battu le boss! Score: ${score.toLocaleString()}`);
              setShowVictory(true);
            }
          }
        });
      }

      // Collisions des balles du boss avec le joueur
      if (boss) {
        const bossBullets = boss.getBullets();
        bossBullets.forEach((bullet) => {
          if (!bullet.active) return;
          if (bullet.checkCollision(player)) {
            const damage = 4;
            player.takeDamage(damage);
            particleSystem.createHitEffect(player.x + player.width / 2, player.y + player.height / 2, "#ff0000");
            camera.addShake(5);
            bullet.active = false;

            damageNumbers.push(new DamageNumber(player.x + player.width / 2, player.y, damage, "#ff0000"));
          }
        });
      }

      if (player.health <= 0) {
        state = GameState.GAME_OVER;
        setGameState(GameState.GAME_OVER);
        setGameOverMessage(`Score final: ${score.toLocaleString()}`);
        setShowGameOver(true);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mettre à jour la caméra
      camera.update();
      const cameraOffset = camera.getOffset();

      ctx.save();

      // Appliquer seulement le shake de caméra (effet visuel)
      if (cameraOffset.x !== 0 || cameraOffset.y !== 0) {
        ctx.translate(cameraOffset.x, cameraOffset.y);
      }

      // Dessiner l'image de fond
      if (backgroundLoaded && backgroundImage.complete) {
        // Calculer le ratio pour couvrir tout le canvas
        const scaleX = canvas.width / backgroundImage.width;
        const scaleY = canvas.height / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);

        const scaledWidth = backgroundImage.width * scale;
        const scaledHeight = backgroundImage.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        ctx.drawImage(backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);
      } else {
        // Fallback : gradient si l'image n'est pas chargée
        const time = gameAnimationFrame * 0.01;
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, `hsl(${200 + Math.sin(time) * 10}, 70%, ${85 + Math.sin(time * 0.5) * 5}%)`);
        bgGradient.addColorStop(0.5, `hsl(${180 + Math.sin(time * 0.7) * 10}, 60%, ${75 + Math.sin(time * 0.3) * 5}%)`);
        bgGradient.addColorStop(1, `hsl(${120 + Math.sin(time * 0.5) * 5}, 50%, ${50 + Math.sin(time * 0.4) * 3}%)`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Dessiner les plateformes si on est en mode parcours
      if (state === GameState.PLATFORM && platforms.length > 0) {
        platforms.forEach((platform) => {
          if (platform) {
            platform.draw(ctx);
          }
        });

        // Dessiner l'étoile si elle n'est pas collectée
        if (star && !star.collected) {
          star.draw(ctx);
        }
      }

      // Dessiner selon l'état
      if (state === GameState.WAVE) {
        enemies.forEach((enemy) => enemy.draw(ctx));
      } else if (state === GameState.CHEST) {
        if (chest) chest.draw(ctx);
      } else if (state === GameState.BOSS) {
        if (boss) boss.draw(ctx);
      }

      // Joueur
      player.draw(ctx);

      // Pet (si actif)
      if (pet && !pet.isDead()) {
        pet.draw(ctx);
      }

      // Système de particules
      particleSystem.update();
      particleSystem.draw(ctx);

      // Dessiner les nombres de dégâts
      damageNumbers.forEach((num) => {
        num.draw(ctx);
      });

      // Effet easter egg
      if (easterEggActive) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("EASTER EGG!", canvas.width / 2, 50);
        ctx.textAlign = "left";
      }

      ctx.restore();

      // Transition de fade entre les états (après restore pour couvrir tout l'écran)
      if (stateTransitionTimer > 0) {
        fadeAlpha = Math.min(1, (60 - stateTransitionTimer) / 30);
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        stateTransitionTimer--;
      }

      // UI overlay (non affecté par la caméra)
      drawUIOverlay(ctx, combo, comboMultiplier);
    };

    const drawUIOverlay = (ctx: CanvasRenderingContext2D, currentCombo: number, multiplier: number) => {
      // Afficher le combo
      if (currentCombo > 0 && comboTimer > 0) {
        const comboAlpha = Math.min(1, comboTimer / 60);
        ctx.save();
        ctx.globalAlpha = comboAlpha;
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(`COMBO x${multiplier.toFixed(1)}`, canvas.width / 2, 80);
        ctx.fillText(`COMBO x${multiplier.toFixed(1)}`, canvas.width / 2, 80);
        ctx.restore();
      }
    };

    const gameLoop = () => {
      gameAnimationFrame++;

      if (state !== GameState.GAME_OVER && state !== GameState.VICTORY) {
        player.update(keys, canvas, mouseClick || isMouseDown, particleSystem);

        if (state === GameState.WAVE) {
          updateWave();
        } else if (state === GameState.PLATFORM) {
          updatePlatform();
        } else if (state === GameState.CHEST) {
          updateChest();
        } else if (state === GameState.BOSS) {
          updateBoss();
        }

        // Mise à jour UI
        const healthPercent = (player.health / player.maxHealth) * 100;
        setPlayerHealth(healthPercent);
        setHealthText(`${Math.max(0, Math.ceil(player.health))}/${player.maxHealth}`);
        setScoreInfo(`Score: ${score.toLocaleString()}`);
        if (state === GameState.WAVE) {
          setWaveInfo(`Vague: ${currentWave}`);
        }

        // La caméra est utilisée uniquement pour le shake, pas pour le suivi
      }

      draw();
      requestAnimationFrame(gameLoop);
    };

    startWave();
    gameLoop();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleMouseClick);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  return (
    <div className="game-container">
      <div className="ui-overlay">
        <div className="health-bar-container">
          <div className="health-label">Vie</div>
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${playerHealth}%` }}></div>
          </div>
          <div className="health-text">{healthText}</div>
        </div>
        <div className="game-info">
          <div className="wave-info">{waveInfo}</div>
          <div className="score-info">{scoreInfo}</div>
        </div>
      </div>
      <canvas id="gameCanvas" ref={canvasRef}></canvas>
      {showGameOver && (
        <div className="game-over-screen">
          <h2>Game Over</h2>
          <p>{gameOverMessage}</p>
          <button onClick={() => window.location.reload()}>Rejouer</button>
        </div>
      )}
      {showVictory && (
        <div className="victory-screen">
          <h2>Victoire!</h2>
          <p>{victoryMessage}</p>
          <button onClick={() => window.location.reload()}>Rejouer</button>
        </div>
      )}
    </div>
  );
}
