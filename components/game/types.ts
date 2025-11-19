export enum GameState {
  MENU = 'menu',
  WAVE = 'wave',
  PLATFORM = 'platform',
  CHEST = 'chest',
  BOSS = 'boss',
  VICTORY = 'victory',
  GAME_OVER = 'game_over'
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}
