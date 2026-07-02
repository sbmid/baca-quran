const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'quran-web', 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

(async () => {
  console.log(`Menemukan ${files.length} gambar. Mulai kompresi brutal ala Senior Dev...`);
  let totalSaved = 0;

  for (const file of files) {
    if (file === 'favicon.png') continue; // Skip favicon
    
    const filePath = path.join(publicDir, file);
    const tempPath = path.join(publicDir, `temp_${file}`);
    
    const origSize = fs.statSync(filePath).size;

    await sharp(filePath)
      .resize({ width: 800, withoutEnlargement: true }) // Mentok lebar 800px
      .jpeg({ quality: 60, progressive: true }) // Turunin quality jadi 60%
      .toFile(tempPath);
      
    const newSize = fs.statSync(tempPath).size;
    totalSaved += (origSize - newSize);

    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
    console.log(`✅ ${file} : ${(origSize / 1024 / 1024).toFixed(2)} MB -> ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  }
  console.log(`\n🎉 Selesai! Berhasil menghemat ${(totalSaved / 1024 / 1024).toFixed(2)} MB ruang.`);
})();
