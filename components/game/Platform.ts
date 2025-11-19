export class Platform {
  x: number
  y: number
  width: number
  height: number

  constructor(x: number, y: number, width: number, height: number = 30) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Ombre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(this.x + 3, this.y + 3, this.width, this.height)

    // Plateforme principale - couleur vive et visible
    ctx.fillStyle = '#FF6B35' // Orange vif
    ctx.fillRect(this.x, this.y, this.width, this.height)

    // Contour épais noir
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 4
    ctx.strokeRect(this.x, this.y, this.width, this.height)

    // Bordure supérieure claire
    ctx.fillStyle = '#FF8C42'
    ctx.fillRect(this.x, this.y, this.width, 5)

    // Détails de brique
    ctx.strokeStyle = '#CC5500'
    ctx.lineWidth = 2
    ctx.strokeRect(this.x, this.y, this.width, this.height)

    // Lignes de séparation
    const brickWidth = 50
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 1
    for (let i = brickWidth; i < this.width; i += brickWidth) {
      ctx.beginPath()
      ctx.moveTo(this.x + i, this.y)
      ctx.lineTo(this.x + i, this.y + this.height)
      ctx.stroke()
    }
  }

  checkCollision(player: { x: number; y: number; width: number; height: number }): boolean {
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    )
  }

  getTop(): number {
    return this.y
  }
}

