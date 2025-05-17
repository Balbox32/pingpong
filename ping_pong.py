from pygame import *
from random import randint



class GameSprite(sprite.Sprite):

    def __init__(self, player_image, player_x, player_y, player_speed, wight, height): 
        super().__init__()
 
        self.image = transform.scale(image.load(player_image), (wight, height)) 
        self.speed = player_speed
 
        self.rect = self.image.get_rect()
        self.rect.x = player_x
        self.rect.y = player_y

    def reset(self):
        window.blit(self.image, (self.rect.x, self.rect.y))

class Player(GameSprite):
    def update_l(self):
        keys = key.get_pressed()
        if keys[K_w] and self.rect.y > 5:
            self.rect.y -= self.speed
        if keys[K_s] and self.rect.y < win_height - 80:
            self.rect.y += self.speed
    def update_r(self):
        keys = key.get_pressed()
        if keys[K_UP] and self.rect.y > 5:
            self.rect.y -= self.speed
        if keys[K_DOWN] and self.rect.y < win_height - 80:
            self.rect.y += self.speed

back = (200, 255, 255)
win_width = 600
win_height = 500
window = display.set_mode((win_width, win_height))
window.fill(back)

game = True
finish = False
clock = time.Clock()
FPS = 60

racket1 = Player('racket.png', 30, 200, 4, 50, 150)
racket2 = Player('racket.png', 520, 200, 4, 50, 150)
ball = GameSprite('tenis_ball.png', 200, 200, 4, 50, 50)

font.init()
font = font.Font(None, 35)
lose1 = font.render('PLAYER 1 LOST!', True, (180, 0, 0))
lose2 = font.render('PLAYER 2 LOST!', True, (180, 0, 0))
restart_text = font.render('RESTART', True, (255, 255, 255))
button_color = (0, 150, 0)
button_rect = Rect(230, 300, 140, 50)

score = 0
speed_x = 3
speed_y = 3

while game:
    for e in event.get():
        if e.type == QUIT:
            game = False
        if finish and e.type == MOUSEBUTTONDOWN and e.button == 1:
            if button_rect.collidepoint(e.pos):
                finish = False
                ball.rect.x = 200
                ball.rect.y = 200
                racket1.rect.y = 200
                racket2.rect.y = 200
                speed_x = randint(1, 15)
                speed_y = randint(1, 15)
                score = 0
                
    if finish != True:
        window.fill(back)
        racket1.update_l()
        racket2.update_r()
        ball.rect.x += speed_x
        ball.rect.y += speed_y
        counter_text = font.render(f"Score: {score}", True, (0, 0, 0))
        window.blit(counter_text, (255, 20))


        if ball.rect.y > win_height-50 or ball.rect.y < 0:
            speed_y *= -1

        if sprite.collide_rect(racket1, ball) or sprite.collide_rect(racket2, ball):
            speed_x *= -1
            score +=1

        if ball.rect.x < 0:
            finish = True
            window.blit(lose1, (200,200))
            draw.rect(window, button_color, button_rect)
            window.blit(restart_text, (button_rect.x + 15, button_rect.y +10))
            game_over = True

        if ball.rect.x > win_width:
            finish = True
            window.blit(lose2, (200,200))
            draw.rect(window, button_color, button_rect)
            window.blit(restart_text, (button_rect.x + 15, button_rect.y +10))
            game_over = True

        racket1.reset()
        racket2.reset()
        ball.reset()


    display.update()
    clock.tick(FPS)