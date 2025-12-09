import Phaser from 'phaser';

// Player sheet info
const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 32;
const COLUMNS = 12;     // 384 / 32
const CHAR_ROW = 1;     // row 2 (0-based index)

// Tilemap info
const TILE_SIZE = 32;
const NUM_COINS = 15;   // how many random coins to spawn

class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 150;
  private lastDirection: 'down' | 'up' | 'left' | 'right' = 'down';

  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallsLayer!: Phaser.Tilemaps.TilemapLayer;

  // coins + score
  private coins!: Phaser.Physics.Arcade.Group;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super('MainScene');
  }

  preload(): void {
    // PLAYER SPRITESHEET
    this.load.spritesheet('player', '/assets/sprites/player.png', {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT
    });

    // TILEMAP + TILESET
    this.load.tilemapTiledJSON('map1', '/assets/maps/map1.json');
    this.load.image('tiles', '/assets/tilesets/tileset.png');

    // COIN SPRITESHEET (32×32 frames)
    this.load.spritesheet('coin', '/assets/sprites/coin.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create(): void {
    // --- TILEMAP ---
    this.map = this.make.tilemap({ key: 'map1' });

    const tileset = this.map.addTilesetImage('main-tiles', 'tiles');

    this.groundLayer = this.map.createLayer('Ground', tileset, 0, 0)!;
    this.wallsLayer = this.map.createLayer('walls', tileset, 0, 0)!;
    this.wallsLayer.setCollisionByExclusion([-1]);

    this.physics.world.setBounds(
      0, 0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    // --- PLAYER ---
    const startX = this.map.widthInPixels / 2;
    const startY = this.map.heightInPixels / 2;

    this.player = this.physics.add.sprite(startX, startY, 'player', 0);
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.createPlayerAnimations();
    this.player.anims.play('idle-down');

    this.physics.add.collider(this.player, this.wallsLayer);

    // --- CAMERA FOLLOW ---
    this.cameras.main.setBounds(
      0, 0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.cameras.main.startFollow(this.player);

    // --- COIN ANIMATION ---
    this.anims.create({
      key: 'coin-spin',
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 7 }),
      frameRate: 5,  // slower spin speed
      repeat: -1
    });

    // --- COINS (RANDOM) ---
    this.createCoinsRandom();

    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin,
      undefined,
      this
    );

    // --- SCORE TEXT ---
    this.scoreText = this.add
      .text(16, 16, 'Score: 0', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff'
      })
      .setScrollFactor(0)
      .setDepth(1000);
  }

  /**
   * Spawn coins at random positions on walkable tiles.
   * Avoids walls layer.
   */
  private createCoinsRandom(): void {
    this.coins = this.physics.add.group();

    for (let i = 0; i < NUM_COINS; i++) {
      let tries = 0;
      let x = 0;
      let y = 0;
      let blocked = true;

      // Try a few times to find a non-wall tile
      while (blocked && tries < 50) {
        // random pixel position inside map bounds
        x = Phaser.Math.Between(TILE_SIZE, this.map.widthInPixels - TILE_SIZE);
        y = Phaser.Math.Between(TILE_SIZE, this.map.heightInPixels - TILE_SIZE);

        const wallTile = this.wallsLayer.getTileAtWorldXY(x, y);
        blocked = !!wallTile; // true if there is a wall tile here
        tries++;
      }

      if (blocked) {
        // couldn't find a good spot after many tries, skip this coin
        continue;
      }

      const coin = this.coins.create(x, y, 'coin') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      coin.setDepth(5);
      coin.setScale(1.3);              // adjust size as you like
      coin.body.setAllowGravity(false);
      coin.setImmovable(true);
      coin.play('coin-spin');
    }
  }

  private collectCoin(
    _playerObj: Phaser.GameObjects.GameObject,
    coinObj: Phaser.GameObjects.GameObject
  ): void {
    const coin = coinObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    coin.disableBody(true, true);   // remove coin

    this.score += 10;               // score value per coin
    this.scoreText.setText('Score: ' + this.score);
  }

  private createPlayerAnimations(): void {
    const base = CHAR_ROW * COLUMNS;
    const downCols = [0, 1, 2, 3];
    const upCols = [4, 5, 6, 7];
    const sideCols = [8, 9, 10, 11];

    const framesFor = (cols: number[]) =>
      cols.map((col) => ({ key: 'player', frame: base + col }));

    this.anims.create({
      key: 'walk-down',
      frames: framesFor(downCols),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'walk-up',
      frames: framesFor(upCols),
      frameRate: 10,
      repeat: -1
    });

    const sideFrames = framesFor(sideCols);

    this.anims.create({
      key: 'walk-right',
      frames: sideFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'walk-left',
      frames: sideFrames,
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'idle-down',
      frames: [{ key: 'player', frame: base + downCols[1] }],
      frameRate: 1
    });
    this.anims.create({
      key: 'idle-up',
      frames: [{ key: 'player', frame: base + upCols[1] }],
      frameRate: 1
    });
    this.anims.create({
      key: 'idle-right',
      frames: [{ key: 'player', frame: base + sideCols[1] }],
      frameRate: 1
    });
    this.anims.create({
      key: 'idle-left',
      frames: [{ key: 'player', frame: base + sideCols[1] }],
      frameRate: 1
    });
  }

  update(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moving = false;

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-this.speed);
      this.player.setFlipX(true);
      this.lastDirection = 'left';
      moving = true;
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(this.speed);
      this.player.setFlipX(false);
      this.lastDirection = 'right';
      moving = true;
    }

    if (this.cursors.up?.isDown) {
      body.setVelocityY(-this.speed);
      this.lastDirection = 'up';
      moving = true;
    } else if (this.cursors.down?.isDown) {
      body.setVelocityY(this.speed);
      this.lastDirection = 'down';
      moving = true;
    }

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(this.speed);
    }

    if (moving) {
      if (this.lastDirection === 'left' || this.lastDirection === 'right') {
        this.player.anims.play(
          this.lastDirection === 'left' ? 'walk-left' : 'walk-right',
          true
        );
      } else if (this.lastDirection === 'up') {
        this.player.anims.play('walk-up', true);
      } else {
        this.player.anims.play('walk-down', true);
      }
    } else {
      if (this.lastDirection === 'left' || this.lastDirection === 'right') {
        this.player.anims.play(
          this.lastDirection === 'left' ? 'idle-left' : 'idle-right',
          true
        );
      } else if (this.lastDirection === 'up') {
        this.player.anims.play('idle-up', true);
      } else {
        this.player.anims.play('idle-down', true);
      }
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  parent: 'app',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [MainScene]
};

new Phaser.Game(config);
