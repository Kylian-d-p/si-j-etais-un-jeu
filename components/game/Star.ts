export class Star {
  x: number
  y: number
  width: number
  height: number
  collected: boolean
  private rotation: number
  private floatOffset: number
  private floatSpeed: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.width = 40
    this.height = 40
    this.collected = false
    this.rotation = 0
    this.floatOffset = 0
    this.floatSpeed = 0.05
  }

  update() {
    if (this.collected) return
    
    // Animation de flottement
    this.floatOffset += this.floatSpeed
    this.rotation += 0.1
    
    // Oscillation verticale
    this.y += Math.sin(this.floatOffset) * 0.5
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.collected) return

    ctx.save()
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
    ctx.rotate(this.rotation)

    // Lueur autour de l'étoile
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width)
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)')
    glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)')
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(0, 0, this.width, 0, Math.PI * 2)
    ctx.fill()

    // Étoile principale
    ctx.fillStyle = '#FFD700'
    ctx.strokeStyle = '#FFA500'
    ctx.lineWidth = 2

    // Dessiner une étoile à 5 branches
    ctx.beginPath()
    const spikes = 5
    const outerRadius = this.width / 2
    const innerRadius = outerRadius * 0.4

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (i * Math.PI) / spikes - Math.PI / 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Point lumineux au centre
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI * 2)
    ctx.fill()

    // Effet de pulsation
    const pulse = Math.sin(this.floatOffset * 2) * 0.2 + 1
    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(0, 0, 8 * pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1.0

    ctx.restore()
  }

  checkCollision(player: { x: number; y: number; width: number; height: number }): boolean {
    if (this.collected) return false
    
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    )
  }

  collect() {
    this.collected = true
  }
}

