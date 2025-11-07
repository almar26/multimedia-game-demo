const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 550,
  physics: { default: "arcade" },
  scene: { preload, create, update },
};

const game = new Phaser.Game(config);

let score = 0;
let scoreText;
let popSound;
let bgMusic;
let background; // reference for scrolling background
let bgWidth;

function preload() {
  this.load.image("background", "assets/background_new.jpg"); // 🏞️ your uploaded background
  this.load.image("star", "assets/star.png");
  this.load.audio("pop", "assets/pop.mp3");
  this.load.audio("bgmusic", "assets/bgmusic.mp3");
  this.load.audio("congratsMusic", "assets/congratulations.wav");
}

function create() {
  // Get background image dimensions
  const bgImage = this.textures.get("background").getSourceImage();

  // Create background as an image (not tileSprite)
  background = this.add.image(0, 0, "background").setOrigin(0, 0);

  // Compute scale so it CONTAINS within game area
  const scaleX = this.scale.width / bgImage.width;
  const scaleY = this.scale.height / bgImage.height;
  const scale = Math.min(scaleX, scaleY);

  background.setScale(scale);

  // Store the width after scaling (for looping)
  bgWidth = bgImage.width * scale;

  // Duplicate a second copy for seamless scrolling
  this.bg2 = this.add
    .image(bgWidth, 0, "background")
    .setOrigin(0, 0)
    .setScale(scale);

  this.bgMusic = this.sound.add("bgmusic");
  this.bgMusic.setLoop(true);

  if (this.sound.locked) {
    // Display a "Tap to Start" message or button
    var text = this.add.text(500, 250, "Click to Start", {
      fill: "#ffffff",
      fontSize: "30px",
      fill: "#ff0",
      stroke: "#000",
      strokeThickness: 4,
    });
    text.setOrigin(0.5);

    // Wait for a user interaction to unlock and play the music
    this.input.once(
      "pointerdown",
      function () {
        this.bgMusic.play();
        text.destroy(); // Remove the message once clicked
        spawnStar(this);
      },
      this
    );
  } else {
    // if somehow unlocked already, just play
    this.bgMusic.play();
    spawnStar(this);
  }

  // 🔊 Pop sound
  popSound = this.sound.add("pop", { volume: 0.5 });

  // 🧮 Score display
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#fff",
    stroke: "#000",
    strokeThickness: 3,
  });

  // 🪄 Create the first star
  //   spawnStar(this);
}

function spawnStar(scene) {
  const x = Phaser.Math.Between(100, 900);
  const y = Phaser.Math.Between(150, 400); // Stay above ground

  const star = scene.physics.add.image(x, y, "star").setInteractive();
  star.setScale(0.3);
  star.setAlpha(0.8);

  // 🌟 Bubble-in animation
  scene.tweens.add({
    targets: star,
    scale: 0.8,
    duration: 500,
    ease: "Back.easeOut",
  });

  // 💫 Spin animation
  scene.tweens.add({
    targets: star,
    angle: 360,
    duration: 2000,
    repeat: -1,
    ease: "Linear",
  });

  // 🌈 Pulse (glow) animation
  scene.tweens.add({
    targets: star,
    scale: { from: 0.75, to: 0.85 },
    yoyo: true,
    repeat: -1,
    duration: 800,
    ease: "Sine.easeInOut",
  });

  // 🖱️ Pop event
  star.on("pointerdown", () => {
    popSound.play();

    // Pop animation (scale up + fade out)
    scene.tweens.add({
      targets: star,
      scale: 1.2,
      alpha: 0,
      duration: 200,
      ease: "Back.easeIn",
      onComplete: () => {
        star.destroy();
        score += 10;
        scoreText.setText("Score: " + score);

        
        // Create floating text
        const popText = scene.add
          .text(star.x, star.y - 50, "+10", {
            fontSize: "32px",
            fill: "#ff0",
            stroke: "#000",
            strokeThickness: 4,
          })
          .setOrigin(0.5);

        // Animate the text upward and fade out
        scene.tweens.add({
          targets: popText,
          y: popText.y - 50,
          alpha: 0,
          duration: 800,
          ease: "Power1",
          onComplete: () => {
            popText.destroy();
          },
        });

        // 🌈 Praise messages based on score milestones
        if (score === 50) {
          showPraise(scene, "Nice!");
        } else if (score === 100) {
          showPraise(scene, "Awesome!");
        } else if (score === 150) {
          showPraise(scene, "Perfect!");
        } 


        if (score >= 200) {
          showCongratulations(scene);
        } else {
          // Respawn new star
          scene.time.delayedCall(300, () => {
            spawnStar(scene);
          });
        }
      },
    });
  });
}

function showCongratulations(scene) {
  // Play celebration music
  const music = scene.sound.add("congratsMusic", {
    volume: 0.6,
  });
  music.play();
  scene.bgMusic.stop();

  const congratsText = scene.add
    .text(
      scene.scale.width / 2,
      scene.scale.height / 2 - 40,
      "🎉 Congratulations! 🎉",
      {
        fontSize: "48px",
        fill: "#ffff00",
        stroke: "#000",
        strokeThickness: 8,
      }
    )
    .setOrigin(0.5);

  // Animate the text (fade in + scale up)
  scene.tweens.add({
    targets: congratsText,
    scale: { from: 0, to: 1 },
    alpha: { from: 0, to: 1 },
    duration: 800,
    ease: "Back.easeOut",
  });

  // Fade out after 3 seconds
  scene.time.delayedCall(3000, () => {
    scene.tweens.add({
      targets: congratsText,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        music.stop();
        congratsText.destroy();
        // scene.bgMusic.play();

        // // Respawn a new star after celebration
        // scene.time.delayedCall(500, () => {
        //   spawnStar(scene);
        //   score = 0;
        //   scoreText.setText("Score: " + score);
        //   scene.congratsShown = false;
        // });
      },
    });
  });

  // 🖱️ “Play Again” button (hidden initially)
  const playAgainBtn = scene.add
    .text(scene.scale.width / 2, scene.scale.height / 2 + 40, "▶️ Play Again", {
      fontSize: "36px",
      fill: "#00ffcc",
      stroke: "#000",
      strokeThickness: 4,
      backgroundColor: "#00000066",
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });

  // ✨ Fade in the button after delay
  scene.time.delayedCall(2500, () => {
    scene.tweens.add({
      targets: playAgainBtn,
      alpha: 1,
      duration: 800,
      onComplete: () => {
        // Add pulse/bounce animation
        scene.tweens.add({
          targets: playAgainBtn,
          scale: { from: 1, to: 1.1 },
          yoyo: true,
          repeat: -1,
          duration: 600,
          ease: "Sine.easeInOut",
        });
      },
    });
  });

  // 🖱️ Handle button click
  playAgainBtn.on("pointerdown", () => {
    // Fade out everything
    scene.tweens.add({
      targets: [congratsText, playAgainBtn],
      alpha: 0,
      duration: 600,
      onComplete: () => {
        scene.bgMusic.play();
        // congratsText.destroy();
        // playAgainBtn.destroy();
        // particles.destroy();
        // music.stop();

        // 🔄 Reset score
        score = 0;
        scoreText.setText("Score: " + score);
        scene.congratsShown = false;

        // 🌟 Spawn a new star
        scene.time.delayedCall(300, () => {
          spawnStar(scene);
        });
      },
    });
  });
}

function showPraise(scene, message) {
  // 🌟 Create the praise text in the center
  const praiseText = scene.add
    .text(scene.scale.width / 2, scene.scale.height / 2 - 100, message, {
      fontSize: "48px",
      fill: "#00ffcc",
      stroke: "#000",
      strokeThickness: 6,
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setScale(0)
    .setAlpha(0.8);

  // 💫 Animate the praise text (pop-in + fade out)
  scene.tweens.add({
    targets: praiseText,
    scale: { from: 0, to: 1 },
    duration: 300,
    ease: "Back.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: praiseText,
        y: praiseText.y - 50,
        alpha: 0,
        duration: 1000,
        ease: "Power1",
        onComplete: () => praiseText.destroy(),
      });
    },
  });
}

function update() {
  const speed = 0.5; // adjust scroll speed

  // Move both backgrounds to the left
  background.x -= speed;
  this.bg2.x -= speed;

  // Reset when they go offscreen for infinite scroll
  if (background.x <= -bgWidth) {
    background.x = this.bg2.x + bgWidth;
  }
  if (this.bg2.x <= -bgWidth) {
    this.bg2.x = background.x + bgWidth;
  }
}
