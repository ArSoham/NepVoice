"""
Lightweight preprocessing before sending an image to Gemini. Cheap and
worth doing regardless of which vision model is behind the API:
- Downscales huge phone photos (cuts upload time and request payload,
  which matters on the low-connectivity rural networks this app targets).
- Auto-orients using EXIF (phone cameras often save rotated).
No deskew/contrast-correction here — that's usually unnecessary extra
complexity when the vision model itself is doing OCR (Gemini handles
moderate skew/lighting fine); resist the urge to over-engineer this until
real sample photos show it's actually needed.
"""
from io import BytesIO
from PIL import Image, ImageOps

MAX_DIMENSION = 1600  # px, generous for OCR while keeping payload small


def preprocess_image(raw_bytes: bytes) -> tuple[bytes, str]:
    img = Image.open(BytesIO(raw_bytes))
    img = ImageOps.exif_transpose(img)  # fix phone camera rotation

    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    if max(img.size) > MAX_DIMENSION:
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    buf = BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return buf.getvalue(), "image/jpeg"
