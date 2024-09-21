import serial
import time

# Настройка COM порта, замените '/dev/cu.usbserial-14220' на ваш порт
ser = serial.Serial('/dev/ttyUSB0', baudrate=115200, timeout=1)

# Функция для создания данных с белой точкой (возможный порядок GRB)
def create_white_dot(num_leds, dot_position):
    color_data = bytearray()
    
    for i in range(num_leds):
        if i == dot_position:
            # Белая точка в формате GRB (максимальная яркость для всех цветов)
            g, r, b = 255, 255, 255
        else:
            # Черный цвет (светодиоды выключены)
            g, r, b = 200, 0, 0
        
        # Добавляем GRB значения для каждого светодиода
        color_data += bytearray([g, r, b])
    
    return color_data

# Функция для создания заголовка и данных с белой точкой
def create_data_with_header(num_leds, dot_position):
    # Заголовок: Ada\x00\x00\x366
    header = b'Ada\x00\x00\x36'
    
    # Получаем данные с белой точкой
    color_data = create_white_dot(num_leds, dot_position)
    
    # Объединяем заголовок и данные
    return header + color_data

def send_data_with_dot(num_leds, dot_position):
    # Открываем порт, если он закрыт
    if not ser.is_open:
        ser.open()

    # Создаем данные с заголовком и белой точкой
    data = create_data_with_header(num_leds, dot_position)

    # Отправляем данные через COM порт
    ser.write(data)
    print(f"Данные с белой точкой отправлены для {num_leds} светодиодов, позиция: {dot_position}")

    # Опционально можно сделать задержку для эффекта анимации
    time.sleep(0.1)

# Основной цикл для перемещения белой точки
num_leds = 54  # Количество светодиодов

dot_position = 0  # Начальная позиция точки

while True:
    # Отправляем данные для текущей позиции белой точки
    send_data_with_dot(num_leds, dot_position)

    # Обновляем позицию точки (циклически)
    dot_position = (dot_position + 1) % num_leds  # Перемещаем точку, возвращаясь в начало после конца ленты

# Закрываем порт после завершения (если это нужно)
ser.close()
