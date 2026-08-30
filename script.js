function drawTooth() {
    ctx.save();
    
    // Warna dinamis berdasarkan kesehatan (Putih ke Cokelat)
    let toothColor;
    if (health >= 5) toothColor = "#FFFFFF";
    else if (health === 4) toothColor = "#F4ECE1";
    else if (health === 3) toothColor = "#E6D5BC";
    else if (health === 2) toothColor = "#CEB48D";
    else toothColor = "#8B5A2B"; 

    ctx.translate(tooth.x, tooth.y);
    
    // Setting Shadow agar gigi terlihat "timbul"
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    
    // Mulai menggambar bentuk gigi yang lebih proporsional
    ctx.fillStyle = toothColor;
    ctx.strokeStyle = "#CCCCCC"; // Warna garis tepi abu-abu muda
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    // Bagian Atas Gigi (Oklusal)
    ctx.moveTo(-45, -40);
    ctx.bezierCurveTo(-20, -55, 20, -55, 45, -40);
    
    // Sisi Kanan Gigi
    ctx.bezierCurveTo(60, -30, 55, 30, 40, 55);
    
    // Bagian Bawah Gigi (Akar/Gingiva)
    ctx.lineTo(15, 40); // Lekukan tengah bawah
    ctx.lineTo(-15, 40);
    
    // Sisi Kiri Gigi
    ctx.lineTo(-40, 55);
    ctx.bezierCurveTo(-55, 30, -60, -30, -45, -40);
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Menambahkan detail kilauan (Highlight) agar gigi terlihat bersih/sehat di awal
    if(health >= 4) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 6;
        ctx.arc(-20, -25, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}