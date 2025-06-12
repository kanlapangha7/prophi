// ========================================
// ระบบ Event Listeners
// ========================================

function setupEventListeners() {
    // ปุ่มเริ่ม/หยุดการฝึก
    if (startButton) {
        startButton.addEventListener('click', toggleExercise);
    }

    // เลือกท่าการฝึก
    if (exerciseSelect) {
        exerciseSelect.addEventListener('change', function() {
            currentExercise = this.value;
            resetExerciseState();
            updateExerciseInstructions();
        });
    }

    // การปรับเป้าหมาย
    const targetRepsInput = document.getElementById('target-reps');
    const targetSetsInput = document.getElementById('target-sets');
    
    if (targetRepsInput) {
        targetRepsInput.addEventListener('change', function() {
            targetReps = parseInt(this.value) || 10;
            updateProgressBar();
        });
    }

    if (targetSetsInput) {
        targetSetsInput.addEventListener('change', function() {
            targetSets = parseInt(this.value) || 2;
            updateProgressBar();
        });
    }
}

function toggleExercise() {
    if (!isDetecting) {
        startExercise();
    } else {
        stopExercise();
    }
}

function startExercise() {
    if (!poseDetection) {
        showError('ระบบยังไม่พร้อม กรุณารอสักครู่');
        return;
    }

    isDetecting = true;
    sessionStartTime = new Date();
    startTimer();
    resetExerciseState();
    
    startButton.innerHTML = '<i class="fas fa-stop"></i> หยุดการฝึก';
    showFeedback('เริ่มการฝึก... เตรียมพร้อม');
    
    logExerciseEvent('เริ่มเซสชัน', `ท่า: ${getExerciseName(currentExercise)}`);
}

function stopExercise() {
    isDetecting = false;
    clearInterval(timerInterval);
    
    startButton.innerHTML = '<i class="fas fa-play"></i> เริ่มการฝึก';
    showFeedback('หยุดการฝึกแล้ว');
    
    if (sessionStartTime) {
        const duration = Math.round((new Date() - sessionStartTime) / 1000);
        logExerciseEvent('จบเซสชัน', `ระยะเวลา: ${formatTime(duration)}`);
        saveExerciseSession();
    }
}

function resetExerciseState() {
    repCounter = 0;
    setCounter = 1;
    exerciseCount = 0;
    movementPhase = 'rest';
    currentAngle = 0;
    prevAngle = 0;
    correctPostureCounter = 0;
    lastRepTime = 0;
    
    // รีเซ็ตตัวแปรเฉพาะท่า
    if (window.wristMovementCount) window.wristMovementCount = 0;
    if (window.lastWristPos) window.lastWristPos = null;
    if (window.holdComplete) window.holdComplete = false;
    if (window.holdTimer) clearTimeout(window.holdTimer);
    
    updateCounters();
    updateUI();
}