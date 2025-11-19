// Système d'effets visuels avancés pour plus de réalisme
export class VisualEffects {
  private lightSources: Array<{
    x: number
    y: number
    radius: number
    intensity: number
    color: string
    life: number
  }> = []
  
  private screenShake: { x: number; y: number; intensity: number } = { x: 0, y: 0, intensity: 0 }
  private bloomEffects: Array<{ x: number; y: number; radius: number; intensity: number }> = []

  // Créer une source de lumière (pour les explosions, tirs, etc.)
  createLightSource(x: number, y: number, radius: number, color: string = '#ffff00', intensity: number = 1) {
    this.lightSources.push({
      x,
      y,
      radius,
      intensity,
      color,
      life: 100
    })
  }

  // Effet de tremblement d'écran
  addScreenShake(intensity: number) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity)
  }

  // Effet de bloom (lueur)
  createBloom(x: number, y: number, radius: number, intensity: number = 0.5) {
    this.bloomEffects.push({ x, y, radius, intensity })
  }

  update() {
    // Mettre à jour les sources de lumière
    for (let i = this.lightSources.length - 1; i >= 0; i--) {
      this.lightSources[i].life--
      this.lightSources[i].intensity *= 0.98
      if (this.lightSources[i].life <= 0 || this.lightSources[i].intensity < 0.1) {
        this.lightSources.splice(i, 1)
      }
    }

    // Réduire le tremblement
    this.screenShake.intensity *= 0.9
    if (this.screenShake.intensity < 0.1) {
      this.screenShake.intensity = 0
      this.screenShake.x = 0
      this.screenShake.y = 0
    } else {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity
    }

    // Réduire les effets de bloom
    for (let i = this.bloomEffects.length - 1; i >= 0; i--) {
      this.bloomEffects[i].intensity *= 0.95
      if (this.bloomEffects[i].intensity < 0.05) {
        this.bloomEffects.splice(i, 1)
      }
    }
  }

  // Appliquer les effets de lumière ambiante
  applyLighting(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (this.lightSources.length === 0) return

    // Créer un gradient radial pour chaque source de lumière
    this.lightSources.forEach(light => {
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      )
      gradient.addColorStop(0, `${light.color}${Math.floor(light.intensity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(0.5, `${light.color}${Math.floor(light.intensity * 128).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })
  }

  // Appliquer les effets de bloom
  applyBloom(ctx: CanvasRenderingContext2D) {
    this.bloomEffects.forEach(bloom => {
      const gradient = ctx.createRadialGradient(
        bloom.x, bloom.y, 0,
        bloom.x, bloom.y, bloom.radius
      )
      gradient.addColorStop(0, `rgba(255, 255, 255, ${bloom.intensity})`)
      gradient.addColorStop(0.5, `rgba(255, 255, 200, ${bloom.intensity * 0.5})`)
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.fillRect(bloom.x - bloom.radius, bloom.y - bloom.radius, bloom.radius * 2, bloom.radius * 2)
    })
  }

  getScreenShake() {
    return { x: this.screenShake.x, y: this.screenShake.y }
  }

  clear() {
    this.lightSources = []
    this.bloomEffects = []
    this.screenShake = { x: 0, y: 0, intensity: 0 }
  }
}
