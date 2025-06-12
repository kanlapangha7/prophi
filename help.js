// ========================================
// ฟังก์ชันช่วยเหลือ
// ========================================

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

function calculateDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) + 
        Math.pow(point1.y - point2.y, 2)
    );
}

function updateAngleTracking(newAngle) {
    prevAngle = currentAngle;
    currentAngle = newAngle;
}

function startMovementPhase(phase, message) {
    movementPhase = phase;
    if (!lastRepTime) lastRepTime = Date.now();
    showFeedback(message);
}

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

function updateAccuracy(currentValue, maxValue) {
    if (!accuracyElement) return;
    
    const accuracy = Math.min(95, Math.max(75, Math.round((currentValue / maxValue) * 100)));
    accuracyElement.textContent = `${accuracy}%`;
}

function updateCounters() {
    if (repCountElement) repCountElement.textContent = repCounter;
    updateProgressBar();
}

function updateProgressBar() {
    if (!progressBar || !progressText) return;
    
    const totalReps = targetReps * targetSets;
    const progress = Math.min(100, Math.round((exerciseCount / totalReps) * 100));
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `การฝึกสำเร็จ ${progress}%`;
}

function checkSetCompletion() {
    if (repCounter >= targetReps) {
        if (setCounter >= targetSets) {
            completeAllSets();
        } else {
            startNewSet();
        }
    }
}

function startNewSet() {
    setCounter++;
    repCounter = 0;
    showFeedback(`เสร็จเซตที่ ${setCounter - 1} เริ่มเซตที่ ${setCounter}`);
    updateCounters();
}

function completeAllSets() {
    showFeedback('เสร็จสิ้นการฝึกทั้งหมด! ยินดีด้วย!');
    // สามารถเพิ่มการแสดงผลสรุปหรือบันทึกผลลัพธ์ได้ที่นี่
}