use std::{fs, io, path::Path};

fn ensure_windows_icon() -> io::Result<()> {
    let ico_path = Path::new("icons/icon.ico");
    if ico_path.exists() {
        return Ok(());
    }

    let png_path = Path::new("icons/128x128@2x.png");
    let png = fs::read(png_path)?;

    // ICO container with one 256x256 PNG-compressed image. Width/height 0 means 256.
    let image_offset = 6u32 + 16u32;
    let image_size = u32::try_from(png.len())
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidData, "icon PNG is too large"))?;

    let mut ico = Vec::with_capacity(image_offset as usize + png.len());
    ico.extend_from_slice(&0u16.to_le_bytes()); // reserved
    ico.extend_from_slice(&1u16.to_le_bytes()); // type: icon
    ico.extend_from_slice(&1u16.to_le_bytes()); // image count

    ico.push(0); // width: 256
    ico.push(0); // height: 256
    ico.push(0); // color count
    ico.push(0); // reserved
    ico.extend_from_slice(&1u16.to_le_bytes()); // planes
    ico.extend_from_slice(&32u16.to_le_bytes()); // bits per pixel
    ico.extend_from_slice(&image_size.to_le_bytes());
    ico.extend_from_slice(&image_offset.to_le_bytes());
    ico.extend_from_slice(&png);

    fs::write(ico_path, ico)
}

fn main() {
    println!("cargo:rerun-if-changed=icons/128x128@2x.png");

    #[cfg(target_os = "windows")]
    ensure_windows_icon().expect("failed to generate icons/icon.ico from the Overyn PNG icon");

    tauri_build::build()
}
