// ========================================
// ระบบการแสดงผลและ Canvas
// ========================================

function setupCameraCanvas() {
    if (!canvasElement || !videoElement) {
        console.error('❌ ไม่พบ canvas หรือ video element');
        return;
    }

    // รอให้ video พร้อม
    const updateCanvasSize = () => {
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            
            // ปรับ CSS ให้แสดงผลได้ดี
            canvasElement.style.width = '100%';
            canvasElement.style.height = 'auto';
            canvasElement.style.maxHeight = '400px';
            
            console.log(`✅ Canvas ขนาด: ${canvasElement.width}x${canvasElement.height}`);
        } else {
            // ลองอีกครั้งหลัง 100ms
            setTimeout(updateCanvasSize, 100);
        }
    };
    
    updateCanvasSize();
}
function drawPoseResults() {
    if (!canvasCtx || !poseResults) return;
    
    // เคลียร์ canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // วาดภาพจากกล้อง
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    if (poseResults.poseLandmarks) {
        // วาดเส้นเชื่อมจุดโครงร่าง
        if (window.drawConnectors) {
            window.drawConnectors(canvasCtx, poseResults.poseLandmarks, 
                window.POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        }
        
        // ไฮไลท์จุดสำคัญตามท่าที่เลือก
        highlightImportantLandmarks();
        
        // วาดจุด landmarks ทั้งหมด
        if (window.drawLandmarks) {
            window.drawLandmarks(canvasCtx, poseResults.poseLandmarks, 
                {color: '#FF0000', lineWidth: 1, radius: 3});
        }
        
        // แสดงข้อมูลเพิ่มเติม
        drawExerciseInfo();
    }
}

function highlightImportantLandmarks() {
    if (!poseResults.poseLandmarks || !window.drawLandmarks) return;
    
    const landmarks = poseResults.poseLandmarks;
    let highlightIndices = [];
    
    // เลือกจุดสำคัญตามท่าการฝึก
    switch (currentExercise) {
        case 'butterfly-dance':
            if (autoDetectedSide === 'right') {
                highlightIndices = [12, 14, 16, 24]; // ไหล่ขวา, ศอกขวา, ข้อมือขวา, สะโพกขวา
            } else {
                highlightIndices = [11, 13, 15, 23]; // ไหล่ซ้าย, ศอกซ้าย, ข้อมือซ้าย, สะโพกซ้าย
            }
            break;
        case 'peacock':
            if (autoDetectedSide === 'right') {
                highlightIndices = [12, 14, 16]; // ไหล่ขวา, ศอกขวา, ข้อมือขวา
            } else {
                highlightIndices = [11, 13, 15]; // ไหล่ซ้าย, ศอกซ้าย, ข้อมือซ้าย
            }
            break;
        case 'dragon-claw':
            if (autoDetectedSide === 'right') {
                highlightIndices = [14, 16]; // ศอกขวา, ข้อมือขวา
            } else {
                highlightIndices = [13, 15]; // ศอกซ้าย, ข้อมือซ้าย
            }
            break;
        case 'tiger-roar':
            highlightIndices = [23, 24, 25, 26, 27, 28]; // สะโพกและขาทั้งสองข้าง
            break;
        case 'flying':
            if (autoDetectedSide === 'right') {
                highlightIndices = [24, 26, 28]; // สะโพกขวา, เข่าขวา, ข้อเท้าขวา
            } else {
                highlightIndices = [23, 25, 27]; // สะโพกซ้าย, เข่าซ้าย, ข้อเท้าซ้าย
            }
            break;
    }
    
    // วาดจุดไฮไลท์
    const highlightLandmarks = highlightIndices
        .map(index => landmarks[index])
        .filter(landmark => landmark && landmark.visibility > 0.5);
    
    if (highlightLandmarks.length > 0) {
        window.drawLandmarks(canvasCtx, highlightLandmarks, 
            {color: '#FFFF00', lineWidth: 3, radius: 6});
    }
}

function drawExerciseInfo() {
    if (!canvasCtx) return;
    
    // แสดงข้อมูลการตรวจจับข้าง
    canvasCtx.font = '16px Arial';
    canvasCtx.fillStyle = '#FFFF00';
    canvasCtx.strokeStyle = '#000000';
    canvasCtx.lineWidth = 2;
    
    const sideText = `ตรวจจับ: ข้าง${autoDetectedSide === 'right' ? 'ขวา' : 'ซ้าย'}`;
    canvasCtx.strokeText(sideText, 10, 30);
    canvasCtx.fillText(sideText, 10, 30);
    
    // แสดงมุมปัจจุบัน (ถ้ามี)
    if (currentAngle > 0 && movementPhase !== 'rest') {
        const angleText = `มุม: ${Math.round(currentAngle)}°`;
        canvasCtx.strokeText(angleText, 10, 60);
        canvasCtx.fillText(angleText, 10, 60);
    }
    
    // แสดงเฟสการเคลื่อนไหว
    if (movementPhase !== 'rest') {
        const phaseText = `สถานะ: ${getPhaseDisplayName(movementPhase)}`;
        canvasCtx.strokeText(phaseText, 10, 90);
        canvasCtx.fillText(phaseText, 10, 90);
    }
}

function getPhaseDisplayName(phase) {
    const phaseNames = {
        'lifting': 'กำลังยก',
        'lowering': 'กำลังลด',
        'flexing': 'กำลังงอ',
        'extending': 'กำลังเหยียด',
        'moving': 'กำลังเคลื่อนไหว',
        'spreading': 'กำลังกาง',
        'holding': 'กำลังคงท่า'
    };
    return phaseNames[phase] || phase;
}