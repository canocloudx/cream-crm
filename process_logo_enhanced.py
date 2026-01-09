#!/usr/bin/env python3
"""
Enhanced Logo Processor - Brighter Glow Version
"""

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

def process_logo(input_path, output_path, scale_factor=4.0):
    img = Image.open(input_path).convert('RGBA')
    print(f"Original size: {img.size}")
    
    data = np.array(img)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    
    threshold = 180
    is_logo = luminance < threshold
    
    new_data = np.zeros_like(data)
    
    # BRIGHTER Cyan: RGB(0, 255, 255) with higher opacity
    cyan_r, cyan_g, cyan_b = 0, 255, 255
    
    # Make opacity stronger (more visible)
    opacity = np.clip((threshold - luminance) / threshold * 300, 0, 255).astype(np.uint8)
    
    new_data[:,:,0] = np.where(is_logo, cyan_r, 0)
    new_data[:,:,1] = np.where(is_logo, cyan_g, 0)
    new_data[:,:,2] = np.where(is_logo, cyan_b, 0)
    new_data[:,:,3] = np.where(is_logo, opacity, 0)
    
    processed = Image.fromarray(new_data, 'RGBA')
    
    # Crop to content
    bbox = processed.getbbox()
    if bbox:
        padding = 20
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(processed.width, bbox[2] + padding)
        bottom = min(processed.height, bbox[3] + padding)
        processed = processed.crop((left, top, right, bottom))
    
    print(f"Cropped size: {processed.size}")
    
    # Scale up
    new_width = int(processed.width * scale_factor)
    new_height = int(processed.height * scale_factor)
    processed = processed.resize((new_width, new_height), Image.Resampling.LANCZOS)
    print(f"Scaled size: {processed.size}")
    
    # ENHANCED GLOW - Multiple layers with stronger blur and brightness
    # Layer 1: Intense inner glow
    glow1 = processed.copy()
    glow1 = glow1.filter(ImageFilter.GaussianBlur(radius=8))
    glow1 = ImageEnhance.Brightness(glow1).enhance(2.0)
    
    # Layer 2: Medium glow
    glow2 = processed.copy()
    glow2 = glow2.filter(ImageFilter.GaussianBlur(radius=20))
    glow2 = ImageEnhance.Brightness(glow2).enhance(1.8)
    
    # Layer 3: Outer soft glow
    glow3 = processed.copy()
    glow3 = glow3.filter(ImageFilter.GaussianBlur(radius=40))
    glow3 = ImageEnhance.Brightness(glow3).enhance(1.5)
    
    # Create final canvas with extra space for glow
    final_width = processed.width + 200
    final_height = processed.height + 200
    final = Image.new('RGBA', (final_width, final_height), (0, 0, 0, 0))
    
    center_x = (final_width - processed.width) // 2
    center_y = (final_height - processed.height) // 2
    
    # Composite glow layers (outer to inner)
    final.paste(glow3, (center_x, center_y), glow3)
    final.paste(glow2, (center_x, center_y), glow2)
    final.paste(glow1, (center_x, center_y), glow1)
    
    # Paste sharp logo on top
    final.paste(processed, (center_x, center_y), processed)
    
    # Brighten the entire result
    final = ImageEnhance.Brightness(final).enhance(1.2)
    
    # Final crop
    bbox = final.getbbox()
    if bbox:
        padding = 15
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(final.width, bbox[2] + padding)
        bottom = min(final.height, bbox[3] + padding)
        final = final.crop((left, top, right, bottom))
    
    print(f"Final size: {final.size}")
    final.save(output_path, 'PNG', optimize=False)
    print(f"Saved to: {output_path}")
    
    return final


def create_wallet_logos(source_img, output_dir):
    import os
    aspect = source_img.width / source_img.height
    
    # Use larger sizes for better visibility
    sizes = {
        'logo.png': (400, 120),
        'logo@2x.png': (800, 240),
        'logo@3x.png': (1200, 360),
    }
    
    for filename, (max_w, max_h) in sizes.items():
        if aspect > max_w / max_h:
            new_width = max_w
            new_height = int(max_w / aspect)
        else:
            new_height = max_h
            new_width = int(max_h * aspect)
        
        resized = source_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        output_path = os.path.join(output_dir, filename)
        resized.save(output_path, 'PNG', optimize=False)
        print(f"Created {filename}: {resized.size}")


if __name__ == '__main__':
    import os
    
    input_image = '/Users/canocloudx/.gemini/antigravity/brain/fc910f54-54fb-49e5-a9e3-0ae93e068e14/uploaded_image_1767936682413.png'
    output_image = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/logo-icon-enhanced.png'
    
    processed = process_logo(input_image, output_image, scale_factor=4.0)
    
    # Save as main logo
    web_logo_path = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/logo-icon.png'
    processed.save(web_logo_path, 'PNG', optimize=False)
    print(f"\nWeb logo saved to: {web_logo_path}")
    
    # Create Apple Wallet logos
    pass_template_dir = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/pass-template.pass'
    create_wallet_logos(processed, pass_template_dir)
    
    pass_template_backup = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/pass-template'
    if os.path.exists(pass_template_backup):
        create_wallet_logos(processed, pass_template_backup)
    
    print("\n✅ Enhanced logos with BRIGHTER GLOW created!")
