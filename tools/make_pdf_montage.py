from pathlib import Path
from PIL import Image, ImageDraw

files = sorted(Path("output/rendered").glob("*.png"))
thumbs, width, height = [], 300, 430
for file in files:
    image = Image.open(file).convert("RGB")
    image.thumbnail((width, height - 28))
    thumbs.append((file.stem, image.copy()))
canvas = Image.new("RGB", (width * 4, height * ((len(thumbs) + 3) // 4)), "white")
draw = ImageDraw.Draw(canvas)
for index, (label, image) in enumerate(thumbs):
    x, y = (index % 4) * width, (index // 4) * height
    canvas.paste(image, (x + (width - image.width) // 2, y + 24))
    draw.text((x + 8, y + 5), label, fill="black")
canvas.save("output/rendered/montage.png")
