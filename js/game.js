// 游戏配置
const GAME_CONFIG = {
    canvasWidth: 800,
    canvasHeight: 600,
    playerSize: 64, // 调整为适合小熊图片的大小
    heartSize: 32, // 调整为适合爱心图片的大小
    playerSpeed: 4,
    totalHearts: 10,
    textDisplayTime: 3000, // 毫秒
    animationSpeed: 0.1 // 动画播放速度
};

// 温馨话语库
const WARM_MESSAGES = [
    "你是我的小幸运",
    "见到你就开心",
    "心跳因你而加速",
    "每天都想见到你",
    "你的微笑很治愈",
    "有你在身边真好",
    "你的眼睛真好看",
    "我喜欢你的开心样子",
    "你是最特别的",
    "想和你分享一切",
    "你让世界更美好",
    "你总是那么可爱",
    "我想一直陪着你",
    ""
];

// 图片资源
const images = {
    bear: null,
    bearwalk1: null,
    bearwalk2: null,
    heart: null,
    background: null,
    loaded: false
};

// 游戏状态
let gameState = {
    player: {
        x: GAME_CONFIG.canvasWidth / 2 - GAME_CONFIG.playerSize / 2,
        y: GAME_CONFIG.canvasHeight / 2 - GAME_CONFIG.playerSize / 2,
        direction: 'down',
        speed: GAME_CONFIG.playerSpeed,
        isMoving: false,
        animationFrame: 0,
        // 预留未来属性：level, exp, hp, mp, skills等
        level: 1,
        exp: 0,
        hp: 100,
        mp: 50,
        skills: []
    },
    hearts: [],
    collectedHearts: 0,
    keys: {},
    // 预留未来游戏状态：enemies, items, map等
    enemies: [],
    items: [],
    map: {
        currentLevel: 1
    }
};

// 获取DOM元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const textDisplay = document.getElementById('text-display');
const heartCount = document.getElementById('heart-count');
const totalHearts = document.getElementById('total-hearts');
const mobileControls = document.getElementById('mobile-controls');

// 加载图片资源
function loadImages() {
    const imagePaths = {
        bear: 'assets/images/bear.png',
        bearwalk1: 'assets/images/bearwalk1.png',
        bearwalk2: 'assets/images/bearwalk2.png',
        heart: 'assets/images/heart.png',
        background: 'assets/images/map.jpg'
    };
    
    let loadedCount = 0;
    const totalImages = Object.keys(imagePaths).length;
    
    for (const [key, path] of Object.entries(imagePaths)) {
        images[key] = new Image();
        images[key].src = path;
        images[key].onload = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                images.loaded = true;
                console.log('所有图片资源加载完成');
            }
        };
        images[key].onerror = () => {
            console.error(`图片加载失败: ${path}`);
            loadedCount++;
            if (loadedCount === totalImages) {
                images.loaded = true;
            }
        };
    }
}

// 初始化游戏
function initGame() {
    // 加载图片资源
    loadImages();
    
    // 设置画布尺寸
    resizeCanvas();
    
    // 初始化爱心
    generateHearts();
    
    // 设置总爱心数显示
    totalHearts.textContent = GAME_CONFIG.totalHearts;
    
    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 绑定触摸事件（移动端）
    bindTouchEvents();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas);
    
    // 开始游戏循环
    gameLoop();
}

// 调整Canvas尺寸
function resizeCanvas() {
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 300;
    const aspectRatio = GAME_CONFIG.canvasWidth / GAME_CONFIG.canvasHeight;
    
    if (maxWidth / maxHeight > aspectRatio) {
        canvas.height = maxHeight;
        canvas.width = maxHeight * aspectRatio;
    } else {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
    }
}

// 生成爱心
function generateHearts() {
    gameState.hearts = [];
    
    for (let i = 0; i < GAME_CONFIG.totalHearts; i++) {
        // 随机生成爱心位置，确保不与玩家初始位置重叠
        let x, y;
        do {
            x = Math.floor(Math.random() * (canvas.width - GAME_CONFIG.heartSize));
            y = Math.floor(Math.random() * (canvas.height - GAME_CONFIG.heartSize));
        } while (isColliding(x, y, GAME_CONFIG.heartSize, GAME_CONFIG.heartSize, 
                          gameState.player.x, gameState.player.y, 
                          GAME_CONFIG.playerSize, GAME_CONFIG.playerSize));
        
        gameState.hearts.push({ x, y });
    }
}

// 键盘按下事件
function handleKeyDown(e) {
    gameState.keys[e.key] = true;
}

// 键盘松开事件
function handleKeyUp(e) {
    gameState.keys[e.key] = false;
}

// 绑定触摸事件
function bindTouchEvents() {
    const dpadBtns = document.querySelectorAll('.dpad-btn');
    
    dpadBtns.forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = btn.dataset.direction;
            handleDirectionPress(direction, true);
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            const direction = btn.dataset.direction;
            handleDirectionPress(direction, false);
        });
        
        // 鼠标事件支持（调试用）
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const direction = btn.dataset.direction;
            handleDirectionPress(direction, true);
        });
        
        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            const direction = btn.dataset.direction;
            handleDirectionPress(direction, false);
        });
    });
}

// 处理方向键按下/松开
function handleDirectionPress(direction, isPressed) {
    const keyMap = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
    };
    
    if (keyMap[direction]) {
        gameState.keys[keyMap[direction]] = isPressed;
    }
}

// 更新玩家位置
function updatePlayer() {
    const player = gameState.player;
    const speed = player.speed;
    let isMoving = false;
    
    // 根据按键状态移动玩家
    if (gameState.keys['ArrowUp'] || gameState.keys['w'] || gameState.keys['W']) {
        player.y = Math.max(0, player.y - speed);
        player.direction = 'up';
        isMoving = true;
    }
    if (gameState.keys['ArrowDown'] || gameState.keys['s'] || gameState.keys['S']) {
        player.y = Math.min(canvas.height - GAME_CONFIG.playerSize, player.y + speed);
        player.direction = 'down';
        isMoving = true;
    }
    if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) {
        player.x = Math.max(0, player.x - speed);
        player.direction = 'left';
        isMoving = true;
    }
    if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) {
        player.x = Math.min(canvas.width - GAME_CONFIG.playerSize, player.x + speed);
        player.direction = 'right';
        isMoving = true;
    }
    
    // 更新移动状态和动画
    player.isMoving = isMoving;
    if (isMoving) {
        // 增加动画帧
        player.animationFrame += GAME_CONFIG.animationSpeed;
        if (player.animationFrame >= 2) {
            player.animationFrame = 0;
        }
    }
}

// 检测碰撞
function isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
}

// 更新爱心状态
function updateHearts() {
    for (let i = gameState.hearts.length - 1; i >= 0; i--) {
        const heart = gameState.hearts[i];
        
        // 检测玩家与爱心的碰撞
        if (isColliding(
            gameState.player.x, gameState.player.y, GAME_CONFIG.playerSize, GAME_CONFIG.playerSize,
            heart.x, heart.y, GAME_CONFIG.heartSize, GAME_CONFIG.heartSize
        )) {
            // 收集爱心
            gameState.hearts.splice(i, 1);
            gameState.collectedHearts++;
            
            // 更新爱心计数显示
            heartCount.textContent = gameState.collectedHearts;
            
            // 显示温馨话语
            showRandomMessage();
            
            // 预留：收集爱心后的奖励逻辑（经验、分数等）
            // gainExperience(10);
            
            // 如果所有爱心都收集完了，重新生成
            if (gameState.hearts.length === 0) {
                // 显示特殊文本
                textDisplay.textContent = "~你得到我所有的爱啦~";
                textDisplay.classList.add('show');
                
                setTimeout(() => {
                    generateHearts();
                    gameState.collectedHearts = 0;
                    heartCount.textContent = gameState.collectedHearts;
                    textDisplay.classList.remove('show');
                }, 3000);
            }
        }
    }
}

// 显示随机温馨话语
function showRandomMessage() {
    // 随机选择一条消息
    const randomIndex = Math.floor(Math.random() * WARM_MESSAGES.length);
    const message = WARM_MESSAGES[randomIndex];
    
    // 显示消息
    textDisplay.textContent = message;
    textDisplay.classList.add('show');
    
    // 一段时间后隐藏消息
    setTimeout(() => {
        textDisplay.classList.remove('show');
    }, GAME_CONFIG.textDisplayTime);
}

// 绘制玩家
function drawPlayer() {
    const { player } = gameState;
    
    // 设置像素风格绘制
    ctx.imageSmoothingEnabled = false;
    
    // 检查图片是否加载完成
    if (images.loaded) {
        let currentImage = images.bear; // 默认静态图片
        
        // 如果玩家正在移动，使用行走动画
        if (player.isMoving) {
            // 根据动画帧切换行走图片
            if (Math.floor(player.animationFrame) === 0) {
                currentImage = images.bearwalk1;
            } else {
                currentImage = images.bearwalk2;
            }
        }
        
        // 绘制图片
        if (currentImage.complete) {
            // 计算缩放比例，保持图片比例
            const scale = Math.min(
                GAME_CONFIG.playerSize / currentImage.width,
                GAME_CONFIG.playerSize / currentImage.height
            );
            const scaledWidth = currentImage.width * scale;
            const scaledHeight = currentImage.height * scale;
            
            // 居中绘制图片
            const offsetX = (GAME_CONFIG.playerSize - scaledWidth) / 2;
            const offsetY = (GAME_CONFIG.playerSize - scaledHeight) / 2;
            
            // 检查是否需要镜像翻转（向左走时）
            const isFlipped = player.direction === 'left';
            
            if (isFlipped) {
                // 保存当前状态
                ctx.save();
                
                // 平移到玩家位置中心并翻转
                ctx.translate(player.x + GAME_CONFIG.playerSize / 2, player.y);
                ctx.scale(-1, 1);
                ctx.translate(-(player.x + GAME_CONFIG.playerSize / 2), -player.y);
                
                // 绘制翻转后的图片
                ctx.drawImage(
                    currentImage,
                    player.x + offsetX,
                    player.y + offsetY,
                    scaledWidth,
                    scaledHeight
                );
                
                // 恢复状态
                ctx.restore();
            } else {
                // 正常绘制图片
                ctx.drawImage(
                    currentImage,
                    player.x + offsetX,
                    player.y + offsetY,
                    scaledWidth,
                    scaledHeight
                );
            }
        } else {
            // 图片未加载完成时的 fallback
            ctx.fillStyle = '#4a90e2';
            ctx.fillRect(player.x, player.y, GAME_CONFIG.playerSize, GAME_CONFIG.playerSize);
        }
    } else {
        // 图片资源未加载完成时的 fallback
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(player.x, player.y, GAME_CONFIG.playerSize, GAME_CONFIG.playerSize);
    }
}

// 绘制爱心
function drawHearts() {
    ctx.imageSmoothingEnabled = false;
    
    gameState.hearts.forEach(heart => {
        // 检查图片是否加载完成
        if (images.loaded && images.heart.complete) {
            // 计算缩放比例，保持图片比例
            const scale = Math.min(
                GAME_CONFIG.heartSize / images.heart.width,
                GAME_CONFIG.heartSize / images.heart.height
            );
            const scaledWidth = images.heart.width * scale;
            const scaledHeight = images.heart.height * scale;
            
            // 居中绘制图片
            const offsetX = (GAME_CONFIG.heartSize - scaledWidth) / 2;
            const offsetY = (GAME_CONFIG.heartSize - scaledHeight) / 2;
            
            ctx.drawImage(
                images.heart,
                heart.x + offsetX,
                heart.y + offsetY,
                scaledWidth,
                scaledHeight
            );
        } else {
            // 图片未加载完成时的 fallback
            ctx.fillStyle = '#e94560';
            ctx.beginPath();
            ctx.moveTo(heart.x + GAME_CONFIG.heartSize / 2, heart.y);
            ctx.bezierCurveTo(
                heart.x + GAME_CONFIG.heartSize, heart.y,
                heart.x + GAME_CONFIG.heartSize, heart.y + GAME_CONFIG.heartSize,
                heart.x + GAME_CONFIG.heartSize / 2, heart.y + GAME_CONFIG.heartSize
            );
            ctx.bezierCurveTo(
                heart.x, heart.y + GAME_CONFIG.heartSize,
                heart.x, heart.y,
                heart.x + GAME_CONFIG.heartSize / 2, heart.y
            );
            ctx.fill();
        }
    });
}

// 绘制游戏背景
function drawBackground() {
    // 检查背景图片是否加载完成
    if (images.loaded && images.background && images.background.complete) {
        // 绘制背景图片，覆盖整个画布
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    } else {
        // 图片未加载完成时的 fallback
        // 绘制渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#f0f8ff');
        gradient.addColorStop(1, '#e6f3ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格（可选）
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        const gridSize = 32;
        
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}

// 游戏循环
function gameLoop() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新游戏状态
    updatePlayer();
    updateHearts();
    
    // 预留：更新敌人、物品等游戏元素
    // updateEnemies();
    // updateItems();
    
    // 绘制游戏元素
    drawBackground();
    drawHearts();
    
    // 预留：绘制敌人、物品等游戏元素
    // drawEnemies();
    // drawItems();
    
    drawPlayer();
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 预留：经验获取函数
function gainExperience(amount) {
    gameState.player.exp += amount;
    // 预留：升级逻辑
    // checkLevelUp();
}

// 预留：升级检查函数
function checkLevelUp() {
    // 预留：升级逻辑
}

// 预留：战斗系统初始化
function initCombatSystem() {
    // 预留：战斗系统逻辑
}

// 预留：技能系统初始化
function initSkillSystem() {
    // 预留：技能系统逻辑
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', initGame);

// 导出游戏对象（预留：模块化扩展）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_CONFIG,
        gameState,
        initGame,
        gainExperience
    };
}
