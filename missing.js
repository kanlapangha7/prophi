// ========================================
// ฟังก์ชันที่ขาดหายไปทั้งหมด - เพิ่มในไฟล์ main.js หรือสร้างไฟล์ missing.js
// ========================================

// ฟังก์ชันสำหรับ updateMovementData
function updateMovementData(side, scoreData) {
    if (!lastMovementData) {
        lastMovementData = {
            right: { angle: 0, timestamp: 0, quality: 0 },
            left: { angle: 0, timestamp: 0, quality: 0 }
        };
    }
    
    lastMovementData[side] = {
        angle: scoreData.currentAngle || 0,
        timestamp: Date.now(),
        quality: scoreData.total || 0
    };
}

// ฟังก์ชันสำหรับ updateAngleTracking
function updateAngleTracking(newAngle) {
    if (!isNaN(newAngle) && newAngle >= 0 && newAngle <= 180) {
        prevAngle = currentAngle;
        currentAngle = newAngle;
    }
}

// ฟังก์ชันสำหรับ startMovementPhase
function startMovementPhase(phase, message) {
    movementPhase = phase;
    if (!lastRepTime || lastRepTime === 0) {
        lastRepTime = Date.now();
    }
    showFeedback(message);
}

// ฟังก์ชันสำหรับ updateAccuracy
function updateAccuracy(currentValue, maxValue) {
    if (!accuracyElement) return;
    
    const accuracy = Math.min(95, Math.max(0, Math.round((currentValue / maxValue) * 100)));
    accuracyElement.textContent = `${accuracy}%`;
}

// ฟังก์ชันสำหรับ displayMovementInfo
function displayMovementInfo(value, unit) {
    const infoElement = document.querySelector('.movement-info');
    if (infoElement) {
        infoElement.textContent = `${value} ${unit}`;
    }
    console.log(`Movement Info: ${value} ${unit}`);
}

// ฟังก์ชันสำหรับ updateCounters
function updateCounters() {
    if (repCountElement) {
        repCountElement.textContent = repCounter;
    }
    updateProgressBar();
}

// ฟังก์ชันสำหรับ updateProgressBar
function updateProgressBar() {
    if (!progressBar || !progressText) return;
    
    const totalReps = targetReps * targetSets;
    const progress = Math.min(100, Math.round((exerciseCount / totalReps) * 100));
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `การฝึกสำเร็จ ${progress}%`;
}

// ฟังก์ชันสำหรับ checkSetCompletion
function checkSetCompletion() {
    if (repCounter >= targetReps) {
        if (setCounter >= targetSets) {
            completeAllSets();
        } else {
            startNewSet();
        }
    }
}

// ฟังก์ชันสำหรับ startNewSet
function startNewSet() {
    setCounter++;
    repCounter = 0;
    showFeedback(`เสร็จเซตที่ ${setCounter - 1} เริ่มเซตที่ ${setCounter}`);
    updateCounters();
}

// ฟังก์ชันสำหรับ completeAllSets
function completeAllSets() {
    showFeedback('เสร็จสิ้นการฝึกทั้งหมด! ยินดีด้วย!');
    
    const successAlert = document.querySelector('.success-alert');
    if (successAlert) {
        successAlert.style.display = 'block';
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 5000);
    }
}

// ฟังก์ชันสำหรับ logExerciseEvent
function logExerciseEvent(event, details) {
    const timestamp = new Date().toLocaleTimeString('th-TH');
    
    if (!exerciseHistory) {
        exerciseHistory = [];
    }
    
    exerciseHistory.push({
        timestamp,
        event,
        details,
        exercise: currentExercise,
        side: autoDetectedSide
    });
    
    console.log(`[${timestamp}] ${event}: ${details}`);
}

// ฟังก์ชันสำหรับ showFeedback
function showFeedback(message) {
    if (feedbackText) {
        feedbackText.textContent = message;
        feedbackText.style.color = '#333';
    }
    console.log('Feedback:', message);
}

// ฟังก์ชันสำหรับ showError
function showError(message) {
    if (feedbackText) {
        feedbackText.textContent = message;
        feedbackText.style.color = '#ff4444';
    }
    console.error('Error:', message);
}

// ฟังก์ชันสำหรับ updateSideIndicator
function updateSideIndicator() {
    const sideIndicator = document.querySelector('.side-indicator');
    if (sideIndicator) {
        sideIndicator.textContent = `กำลังตรวจจับ: ข้าง${autoDetectedSide === 'right' ? 'ขวา' : 'ซ้าย'}`;
    }
    console.log(`Auto detected side: ${autoDetectedSide}`);
}

function resetExerciseState() {
    movementPhase = 'rest';
    repCounter = 0;
    setCounter = 1;
    exerciseCount = 0;
    currentAngle = 0;
    prevAngle = 0;
    correctPostureCounter = 0;
    lastRepTime = 0;
    
    // รีเซ็ตตัวแปรเฉพาะท่า
    if (window.wristMovementCount) window.wristMovementCount = 0;
    if (window.lastWristPos) window.lastWristPos = null;
    if (window.holdComplete) window.holdComplete = false;
    if (window.holdTimer) {
        clearTimeout(window.holdTimer);
        window.holdTimer = null;
    }
    
    // รีเซ็ต angleHistory
    if (window.angleHistory) window.angleHistory = [];
    if (window.lastValidAngle) window.lastValidAngle = 0;
    
    updateCounters();
    showFeedback('รีเซ็ตสถานะการฝึกเรียบร้อย');
    
    console.log('🔄 รีเซ็ตสถานะเรียบร้อย');
}


// ฟังก์ชันสำหรับ updateStartButton
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

// ฟังก์ชันสำหรับ calculateDistance
function calculateDistance(point1, point2) {
    if (!point1 || !point2) return 0;
    
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// ฟังก์ชันสำหรับ validateLandmarks
function validateLandmarks(landmarks, indices) {
    if (!landmarks || !Array.isArray(landmarks)) return false;
    
    return indices.every(index => {
        const landmark = landmarks[index];
        return landmark && 
               typeof landmark.x === 'number' && 
               typeof landmark.y === 'number' &&
               landmark.visibility > 0.5;
    });
}

// ฟังก์ชันสำหรับ calculateAngle
function calculateAngle(pointA, pointB, pointC) {
    try {
        const BA = {x: pointA.x - pointB.x, y: pointA.y - pointB.y};
        const BC = {x: pointC.x - pointB.x, y: pointC.y - pointB.y};
        
        const dotProduct = BA.x * BC.x + BA.y * BC.y;
        const magnitudeBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
        const magnitudeBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);
        
        if (magnitudeBA === 0 || magnitudeBC === 0) return 0;
        
        const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
        const clampedCos = Math.max(-1, Math.min(1, cosAngle));
        const angleRad = Math.acos(clampedCos);
        
        return angleRad * (180 / Math.PI);
    } catch (error) {
        console.warn('Error calculating angle:', error);
        return 0;
    }
}

// ฟังก์ชันสำหรับ startHoldTimer
function startHoldTimer(duration) {
    if (window.holdTimer) clearTimeout(window.holdTimer);
    
    window.holdComplete = false;
    let remaining = Math.floor(duration / 1000);
    
    const countdown = setInterval(() => {
        if (movementPhase !== 'spreading' && movementPhase !== 'holding') {
            clearInterval(countdown);
            return;
        }
        
        remaining--;
        
        if (remaining > 0) {
            showFeedback(`คงท่า... เหลือ ${remaining} วินาที`);
        } else {
            clearInterval(countdown);
            window.holdComplete = true;
            showFeedback('คงท่าครบแล้ว! กลับสู่ท่าเริ่มต้น');
        }
    }, 1000);
    
    window.holdTimer = countdown;
}

// ฟังก์ชันสำหรับ completeRepetition
function completeRepetition(exerciseName, side) {
    movementPhase = 'rest';
    repCounter++;
    exerciseCount++;
    
    const repDuration = lastRepTime ? (Date.now() - lastRepTime) / 1000 : 0;
    lastRepTime = Date.now();
    
    // รีเซ็ตตัวแปรเฉพาะท่า
    if (exerciseName === 'กระดกข้อมือ') {
        window.wristMovementCount = 0;
    }
    
    logExerciseEvent(`ทำท่า${exerciseName}ถูกต้อง`, 
        `ครั้งที่ ${repCounter} (${side}) ใช้เวลา ${repDuration.toFixed(1)} วินาที`);
    
    updateCounters();
    checkSetCompletion();
    
    showFeedback(`ทำท่า${exerciseName}สำเร็จ! (${repCounter}/${targetReps})`);
}

// ========================================
// ฟังก์ชันสำหรับระบบการแสดงผลและ Canvas (แก้ไข)
// ========================================

function setupCameraCanvas() {
    if (canvasElement && videoElement) {
        canvasElement.width = videoElement.videoWidth || 640;
        canvasElement.height = videoElement.videoHeight || 480;
    }
}

function drawPoseResults() {
    if (!canvasCtx || !poseResults) return;
    
    // เคลียร์ canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // วาดภาพจากกล้อง
    if (videoElement && videoElement.videoWidth > 0) {
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    }
    
    if (poseResults.poseLandmarks) {
        // วาดเส้นเชื่อมจุดโครงร่าง
        if (window.drawConnectors && window.POSE_CONNECTIONS) {
            try {
                window.drawConnectors(canvasCtx, poseResults.poseLandmarks, 
                    window.POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
            } catch (error) {
                console.warn('Error drawing connectors:', error);
            }
        }
        
        // ไฮไลท์จุดสำคัญตามท่าที่เลือก
        highlightImportantLandmarks();
        
        // วาดจุด landmarks ทั้งหมด
        if (window.drawLandmarks) {
            try {
                window.drawLandmarks(canvasCtx, poseResults.poseLandmarks, 
                    {color: '#FF0000', lineWidth: 1, radius: 3});
            } catch (error) {
                console.warn('Error drawing landmarks:', error);
            }
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
        try {
            window.drawLandmarks(canvasCtx, highlightLandmarks, 
                {color: '#FFFF00', lineWidth: 3, radius: 6});
        } catch (error) {
            console.warn('Error highlighting landmarks:', error);
        }
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

// ========================================
// ฟังก์ชันตรวจสอบการโหลดไลบรารี่
// ========================================

function checkDependencies() {
    const requiredObjects = ['Pose', 'Camera'];
    const missing = [];
    
    requiredObjects.forEach(obj => {
        if (typeof window[obj] === 'undefined') {
            missing.push(obj);
        }
    });
    
    if (missing.length > 0) {
        console.error('Missing MediaPipe dependencies:', missing);
        showError(`ไม่พบไลบรารี่ที่จำเป็น: ${missing.join(', ')}`);
        return false;
    }
    
    if (!videoElement || !canvasElement) {
        console.error('Missing DOM elements: video or canvas');
        showError('ไม่พบองค์ประกอบ video หรือ canvas');
        return false;
    }
    
    return true;
}
function ensureFunctionsExist() {
    console.log('🔧 ตรวจสอบฟังก์ชันที่จำเป็น...');
    
    // ตรวจสอบฟังก์ชันสำคัญ
    const requiredFunctions = [
        'validateLandmarks',
        'updateAngleTracking', 
        'startMovementPhase',
        'completeRepetition',
        'startHoldTimer',
        'updateAccuracy',
        'displayMovementInfo',
        'updateCounters',
        'showFeedback'
    ];
    
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            console.warn(`⚠️ ฟังก์ชัน ${funcName} ไม่พบ`);
        } else {
            console.log(`✅ ฟังก์ชัน ${funcName} พร้อมใช้งาน`);
        }
    });
    
    // ตรวจสอบตัวแปรสำคัญ
    const requiredVars = ['poseResults', 'currentExercise', 'movementPhase', 'repCounter'];
    requiredVars.forEach(varName => {
        if (typeof window[varName] === 'undefined') {
            console.warn(`⚠️ ตัวแปร ${varName} ไม่พบ`);
        } else {
            console.log(`✅ ตัวแปร ${varName} พร้อมใช้งาน:`, window[varName]);
        }
    });
    function runLegRaiseFix() {
    console.log('🚀 เริ่มแก้ไขปัญหาท่ายกขาไม่นับ...');
    
    // 1. ตรวจสอบฟังก์ชันที่จำเป็น
    ensureFunctionsExist();
    
    // 2. แก้ไข analyzeCurrentExercise
    fixAnalyzeCurrentExercise();
    
    // 3. ทำให้ฟังก์ชันสามารถเรียกใช้ได้ทั่วโลก
    window.analyzeLegRaise = analyzeLegRaise;
    window.resetExerciseState = resetExerciseState;
    window.testLegRaiseSystem = testLegRaiseSystem;
    
    // 4. ทดสอบระบบ
    setTimeout(testLegRaiseSystem, 500);
    
    console.log('✅ แก้ไขเสร็จสิ้น! ระบบท่ายกขาพร้อมใช้งาน');
    console.log('💡 วิธีใช้:');
    console.log('1. เลือกท่าที่ 5: ท่ายกขา จากเมนู');
    console.log('2. กดเริ่มการฝึก');
    console.log('3. ยกขาขึ้นให้ถึงมุม 45 องศา');
    console.log('4. ค้างท่า 2 วินาที');
    console.log('5. ลดขาลงเพื่อเสร็จสิ้น 1 ครั้ง');
}}
runLegRaiseFix();

// 8. ฟังก์ชันสำหรับทดสอบด้วยตัวเอง (สำหรับ debug)
function debugLegRaise() {
    console.log('🐛 Debug ข้อมูลท่ายกขา:');
    console.log('- currentExercise:', currentExercise);
    console.log('- movementPhase:', movementPhase);
    console.log('- currentAngle:', currentAngle);
    console.log('- prevAngle:', prevAngle);
    console.log('- repCounter:', repCounter);
    console.log('- isDetecting:', isDetecting);
    console.log('- poseResults:', !!poseResults);
    
    if (poseResults && poseResults.poseLandmarks) {
        const landmarks = poseResults.poseLandmarks;
        console.log('- Landmarks ขา:');
        console.log('  สะโพกซ้าย (23):', landmarks[23]?.visibility);
        console.log('  สะโพกขวา (24):', landmarks[24]?.visibility);
        console.log('  เข่าซ้าย (25):', landmarks[25]?.visibility);
        console.log('  เข่าขวา (26):', landmarks[26]?.visibility);
    }
}

// ทำให้สามารถเรียกใช้จาก console ได้
window.debugLegRaise = debugLegRaise;

// ========================================
// เพิ่มให้ window เพื่อให้เรียกใช้จาก HTML ได้
// ========================================

window.resetExerciseState = resetExerciseState;
window.updateUI = updateUI;
window.updateMovementData = updateMovementData;
window.updateAngleTracking = updateAngleTracking;
window.startMovementPhase = startMovementPhase;
window.completeRepetition = completeRepetition;