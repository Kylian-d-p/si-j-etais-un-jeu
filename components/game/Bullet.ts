export class Bullet {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  damage: number
  color: string
  active: boolean
  private trail: Array<{ x: number; y: number; life: number }>
  private rotation: number
  private sprite: HTMLImageElement | null = null
  private spriteLoaded: boolean = false

  constructor(x: number, y: number, direction: number, speed: number = 10, vy: number = 0) {
    this.x = x
    this.y = y
    this.vx = direction * speed
    this.vy = vy
    this.width = 6
    this.height = 6
    this.damage = 10
    this.color = "#ffd700"
    this.active = true
    this.trail = []
    this.rotation = Math.atan2(this.vy, this.vx)
    this.loadSprite()
  }

  loadSprite() {
    this.sprite = new Image()
    this.sprite.onload = () => {
      this.spriteLoaded = true
      // Ajuster la taille selon l'image
      if (this.sprite) {
        const aspectRatio = this.sprite.height / this.sprite.width
        this.width = 12
        this.height = this.width * aspectRatio
      }
    }
    this.sprite.onerror = () => {
      console.warn('Impossible de charger projectile.png')
      this.spriteLoaded = false
    }
    this.sprite.src = '/assets/projectile.png'
  }

  update(canvas: HTMLCanvasElement) {
    // Ajouter une position à la traînée
    this.trail.push({ x: this.x, y: this.y, life: 5 })
    
    // Réduire la vie de la traînée
    this.trail.forEach(point => point.life--)
    this.trail = this.trail.filter(point => point.life > 0)

    this.x += this.vx
    this.y += this.vy

    // Légère gravité pour les balles
    this.vy += 0.05

    // Mettre à jour la rotation selon la direction
    this.rotation = Math.atan2(this.vy, this.vx)

    // Désactiver si hors écran
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.active = false
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()

    // Dessiner la traînée
    if (this.trail.length > 1) {
      ctx.strokeStyle = this.color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.moveTo(this.trail[0].x, this.trail[0].y)
      for (let i = 1; i < this.trail.length; i++) {
        const alpha = this.trail[i].life / 5
        ctx.globalAlpha = alpha * 0.3
        ctx.lineTo(this.trail[i].x, this.trail[i].y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1.0
    }
    
    // Dessiner le sprite si chargé
    if (this.spriteLoaded && this.sprite) {
      // Calculer l'angle de rotation basé sur la direction
      this.rotation = Math.atan2(this.vy, this.vx)
      
      // Rotation du sprite selon la direction
      ctx.translate(this.x, this.y)
      ctx.rotate(this.rotation)
      ctx.drawImage(
        this.sprite,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      )
      ctx.rotate(-this.rotation)
      ctx.translate(-this.x, -this.y)
    } else {
      // Fallback : dessiner un sprite simple si l'image n'est pas chargée
      // Ombre dynamique
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.arc(this.x, this.y + 2, this.width / 2, 0, Math.PI * 2)
      ctx.fill()

      // Effet de lumière autour de la balle
      const glowGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.width * 2
      )
      glowGradient.addColorStop(0, `${this.color}80`)
      glowGradient.addColorStop(0.5, `${this.color}40`)
      glowGradient.addColorStop(1, 'transparent')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.width * 2, 0, Math.PI * 2)
      ctx.fill()

      // Balle avec gradient amélioré
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width / 2)
      if (this.color === "#ff0000") {
        // Balle du boss (rouge)
        gradient.addColorStop(0, "#ffffff")
        gradient.addColorStop(0.3, "#ff6666")
        gradient.addColorStop(0.6, this.color)
        gradient.addColorStop(1, "#880000")
      } else {
        // Balle du joueur (dorée)
        gradient.addColorStop(0, "#ffffff")
        gradient.addColorStop(0.3, "#ffff00")
        gradient.addColorStop(0.6, this.color)
        gradient.addColorStop(1, "#ff8800")
      }
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2)
      ctx.fill()

      // Lueur intense
      ctx.shadowColor = this.color
      ctx.shadowBlur = 12
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.width / 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Point lumineux au centre
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(this.x - 1, this.y - 1, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  checkCollision(target: { x: number; y: number; width: number; height: number }): boolean {
    return (
      this.x < target.x + target.width &&
      this.x + this.width > target.x &&
      this.y < target.y + target.height &&
      this.y + this.height > target.y
    )
  }
}
