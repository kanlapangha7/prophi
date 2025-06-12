// ========================================
// ฟังก์ชัน UI และการแสดงผล
// ========================================

function showFeedback(message) {
    if (feedbackText) {
        feedbackText.textContent = message;
    }
}

function showError(message) {
    if (feedbackText) {
        feedbackText.textContent = message;
        feedbackText.style.color = '#ff4444';
    }
}

function updateSideIndicator() {
    // อัปเดตการแสดงผลข้างที่กำลังตรวจจับ
    const sideIndicator = document.querySelector('.side-indicator');
    if (sideIndicator) {
        sideIndicator.textContent = `กำลังตรวจจับ: ข้าง${autoDetectedSide === 'right' ? 'ขวา' : 'ซ้าย'}`;
    }
}

function updateStartButton(enabled) {
    if (startButton) {
        startButton.disabled = !enabled;
        if (enabled) {
            startButton.innerHTML = '<i class="fas fa-play"></i> เริ่มการฝึก';
        } else {
            startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังเตรียมพร้อม...';
        }
    }
}

function displayMovementInfo(value, unit) {
    // แสดงข้อมูลการเคลื่อนไหวเพิ่มเติมถ้าต้องการ
    const infoElement = document.querySelector('.movement-info');
    if (infoElement) {
        infoElement.textContent = `${value} ${unit}`;
    }
}