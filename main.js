// ========================================
// ระบบฟื้นฟูสมรรถภาพทางกายสำหรับผู้ป่วยติดเตียง
// ไฟล์หลัก - main.js
// ========================================

// ตัวแปรระบบหลัก
let poseDetection = null;
let camera = null;
let isDetecting = false;
let sessionStartTime = null;
let timerInterval = null;
let elapsedSeconds = 0;

// ตัวแปรการตรวจจับท่าทาง
let poseResults = null;
let currentExercise = 'butterfly-dance';
let currentAngle = 0;
let prevAngle = 0;
let movementPhase = 'rest';
let correctPostureCounter = 0;

// ตัวแปรสถิติ
let repCounter = 0;
let setCounter = 1;
let exerciseCount = 0;
let targetReps = 10;
let targetSets = 2;
let exerciseHistory = [];
let lastRepTime = 0;

// เพิ่มตัวแปรการกรองสัญญาณที่ขาดหายไป
let angleHistory = [];
let lastValidAngle = 0;
let noiseThreshold = 15;
let bedPatientMode = true;

// ตัวแปรการตรวจจับอัตโนมัติ
let autoDetectedSide = 'right'; // ข้างที่ระบบตรวจจับอัตโนมัติ
let lastMovementData = {
    right: { angle: 0, timestamp: 0, quality: 0 },
    left: { angle: 0, timestamp: 0, quality: 0 }
};

// องค์ประกอบ DOM
const videoElement = document.querySelector('.input-video');
const canvasElement = document.querySelector('.output-canvas');
const canvasCtx = canvasElement ? canvasElement.getContext('2d') : null;
const startButton = document.querySelector('.camera-controls .btn-primary');
const exerciseSelect = document.getElementById('exercise-select');
const instructionText = document.querySelector('.instruction-text');
const feedbackText = document.querySelector('.feedback-text');
const repCountElement = document.getElementById('rep-counter');
const timeElement = document.getElementById('exercise-timer');
const accuracyElement = document.getElementById('accuracy-value');
const progressBar = document.getElementById('exercise-progress');
const progressText = document.getElementById('progress-text');
// ========================================
// ฟังก์ชันกรองสัญญาณรบกวน
// ========================================

function addToAngleHistory(angle) {
    if (!angleHistory) angleHistory = [];
    angleHistory.push(angle);
    if (angleHistory.length > 10) {
        angleHistory.shift();
    }
}

function getFilteredAngle(rawAngle) {
    if (isNaN(rawAngle) || rawAngle < 0 || rawAngle > 180) {
        return lastValidAngle;
    }
    
    addToAngleHistory(rawAngle);
    
    if (angleHistory.length < 3) {
        lastValidAngle = rawAngle;
        return rawAngle;
    }
    
    const recentAngles = angleHistory.slice(-5);
    const average = recentAngles.reduce((sum, angle) => sum + angle, 0) / recentAngles.length;
    
    const deviation = Math.abs(rawAngle - average);
    if (deviation > noiseThreshold && angleHistory.length >= 5) {
        return average;
    }
    
    const alpha = 0.3;
    const smoothedAngle = lastValidAngle + alpha * (rawAngle - lastValidAngle);
    lastValidAngle = smoothedAngle;
    return smoothedAngle;
}


function isMovementStable(angle, threshold = 5) {
    if (angleHistory.length < 5) return false;
    
    const recent = angleHistory.slice(-5);
    const variance = calculateVariance(recent);
    
    return variance < threshold;
}

function calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

function validateMovementQuality(landmarks, exerciseType) {
    if (!landmarks) return { valid: false, score: 0, issues: ['ไม่พบ landmarks'] };
    
    let qualityScore = 100;
    let issues = [];
    
    // ตรวจสอบความชัดเจนของ landmarks
    const requiredLandmarks = getRequiredLandmarks(exerciseType);
    let visibleCount = 0;
    
    requiredLandmarks.forEach(index => {
        if (landmarks[index] && landmarks[index].visibility > 0.7) {
            visibleCount++;
        } else {
            qualityScore -= 15;
            issues.push(`จุดสำคัญ ${index} ไม่ชัดเจน`);
        }
    });
    
    // ตรวจสอบท่าทางเหมาะสมสำหรับผู้ป่วยติดเตียง
    if (bedPatientMode) {
        const bodyOrientation = detectBodyOrientation(landmarks);
        if (bodyOrientation !== 'horizontal' && bodyOrientation !== 'semi-horizontal') {
            qualityScore -= 20;
            issues.push('ท่าทางไม่เหมาะสมสำหรับผู้ป่วยติดเตียง');
        }
    }
    
    // ตรวจสอบความเสถียรของการเคลื่อนไหว
    if (!isMovementStable(currentAngle)) {
        qualityScore -= 10;
        issues.push('การเคลื่อนไหวไม่เสถียร');
    }
    
    return {
        valid: qualityScore >= 60,
        score: Math.max(0, qualityScore),
        issues: issues
    };
}

function getRequiredLandmarks(exerciseType) {
    const landmarkSets = {
        'butterfly-dance': [11, 12, 13, 14, 15, 16, 23, 24], // ไหล่, ศอก, ข้อมือ, สะโพก
        'peacock': [11, 12, 13, 14, 15, 16], // แขนทั้งสอง
        'dragon-claw': [13, 14, 15, 16], // ศอกและข้อมือ
        'tiger-roar': [23, 24, 25, 26, 27, 28], // สะโพกและขา
        'flying': [23, 24, 25, 26, 27, 28] // สะโพกและขา
    };
    
    return landmarkSets[exerciseType] || [11, 12, 13, 14, 15, 16];
}

function detectBodyOrientation(landmarks) {
    if (!landmarks[11] || !landmarks[12] || !landmarks[23] || !landmarks[24]) {
        return 'unknown';
    }
    
    // คำนวณมุมของลำตัว
    const shoulderCenter = {
        x: (landmarks[11].x + landmarks[12].x) / 2,
        y: (landmarks[11].y + landmarks[12].y) / 2
    };
    
    const hipCenter = {
        x: (landmarks[23].x + landmarks[24].x) / 2,
        y: (landmarks[24].y + landmarks[24].y) / 2
    };
    
    const bodyAngle = Math.abs(Math.atan2(
        hipCenter.y - shoulderCenter.y,
        hipCenter.x - shoulderCenter.x
    ) * 180 / Math.PI);
    
    if (bodyAngle < 30 || bodyAngle > 150) {
        return 'horizontal'; // นอน
    } else if (bodyAngle > 60 && bodyAngle < 120) {
        return 'vertical'; // นั่งหรือยืน
    } else {
        return 'semi-horizontal'; // เอียง
    }
}

// ========================================
// ฟังก์ชันเริ่มต้นระบบ
// ========================================

window.onload = function() {
    loadMediaPipeLibraries().then(() => {
        console.log("MediaPipe libraries loaded successfully");
        initializeSystem();
    }).catch(error => {
        console.error("Failed to load MediaPipe libraries:", error);
        showError("ไม่สามารถโหลดไลบรารี่การตรวจจับท่าทางได้ กรุณาโหลดหน้าเว็บใหม่");
    });
};

function loadMediaPipeLibraries() {
    return new Promise((resolve, reject) => {
        // ตรวจสอบว่าไลบรารี่โหลดแล้วหรือยัง
        if (window.Pose && window.Camera && window.drawConnectors) {
            resolve();
            return;
        }

        // ใช้ CDN URL ที่เสถียรกว่า
        const scripts = [
            'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js',
            'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils@0.6.1629159505/control_utils.js', 
            'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1640029074/drawing_utils.js',
            'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1635988162/pose.js'
        ];

        let loadedCount = 0;
        let hasError = false;

        scripts.forEach((src) => {
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                loadedCount++;
                console.log(`✅ โหลดสำเร็จ: ${src}`);
                if (loadedCount === scripts.length && !hasError) {
                    // รอให้ไลบรารี่เตรียมพร้อม
                    setTimeout(() => {
                        if (window.Pose && window.Camera) {
                            resolve();
                        } else {
                            reject(new Error('ไลบรารี่ไม่พร้อมใช้งาน'));
                        }
                    }, 500);
                }
            };
            
            script.onerror = (error) => {
                hasError = true;
                console.error(`❌ โหลดไม่สำเร็จ: ${src}`, error);
                reject(new Error(`ไม่สามารถโหลด: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    });
}
function initializeSystem() {
    setupEventListeners();
    setupTabs();
    populateSampleData();
    setupPoseDetection();
    updateUI();
}

// ========================================
// ระบบบันทึกและสถิติ
// ========================================

function logExerciseEvent(event, details) {
    const timestamp = new Date().toLocaleTimeString('th-TH');
    exerciseHistory.push({
        timestamp,
        event,
        details,
        exercise: currentExercise,
        side: autoDetectedSide
    });
    console.log(`[${timestamp}] ${event}: ${details}`);
}

function saveExerciseSession() {
    if (!sessionStartTime) return;
    
    const sessionData = {
        id: Date.now(),
        date: new Date().toLocaleDateString('th-TH'),
        time: new Date().toLocaleTimeString('th-TH'),
        exercise: currentExercise,
        exerciseName: getExerciseName(currentExercise),
        detectedSide: autoDetectedSide,
        repetitions: repCounter,
        sets: setCounter,
        totalCount: exerciseCount,
        duration: elapsedSeconds,
        formattedDuration: formatTime(elapsedSeconds),
        accuracy: accuracyElement ? accuracyElement.textContent : '85%',
        events: [...exerciseHistory]
    };
    
    // บันทึกลง localStorage
    const savedSessions = JSON.parse(localStorage.getItem('exerciseSessions') || '[]');
    savedSessions.push(sessionData);
    localStorage.setItem('exerciseSessions', JSON.stringify(savedSessions));
    
    // อัปเดตตารางประวัติ
    addToHistoryTable(sessionData);
    
    console.log('บันทึกเซสชันเรียบร้อย:', sessionData);
}

function addToHistoryTable(sessionData) {
    const recordTable = document.getElementById('record-table-body');
    if (!recordTable) return;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${sessionData.date}</td>
        <td>${sessionData.exerciseName}</td>
        <td>${sessionData.totalCount}</td>
        <td>${sessionData.formattedDuration}</td>
        <td>${sessionData.accuracy}</td>
        <td>8.5/10</td>
        <td>
            <button class="btn-icon" onclick="viewSessionDetails(${sessionData.id})" title="ดูรายละเอียด">
                <i class="fas fa-info-circle"></i>
            </button>
        </td>
    `;
    
    // เพิ่มแถวใหม่ด้านบนสุด
    if (recordTable.firstChild) {
        recordTable.insertBefore(newRow, recordTable.firstChild);
    } else {
        recordTable.appendChild(newRow);
    }
}

function viewSessionDetails(sessionId) {
    const savedSessions = JSON.parse(localStorage.getItem('exerciseSessions') || '[]');
    const session = savedSessions.find(s => s.id === sessionId);
    
    if (session) {
        alert(`รายละเอียดการฝึก ${session.exerciseName}\n` +
              `วันที่: ${session.date} ${session.time}\n` +
              `ข้างที่ตรวจจับ: ${session.detectedSide === 'right' ? 'ขวา' : 'ซ้าย'}\n` +
              `จำนวนครั้ง: ${session.totalCount}\n` +
              `ระยะเวลา: ${session.formattedDuration}\n` +
              `ความแม่นยำ: ${session.accuracy}`);
    }
}

// ========================================
// ฟังก์ชันเสริม
// ========================================

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    elapsedSeconds = 0;
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        if (timeElement) {
            timeElement.textContent = formatTime(elapsedSeconds);
        }
    }, 1000);
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getExerciseName(exerciseCode) {
    const exerciseNames = {
        'butterfly-dance': 'ท่าที่ 1: ท่ายกแขน',
        'peacock': 'ท่าที่ 2: ท่างอและเหยียดศอก',
        'dragon-claw': 'ท่าที่ 3: ท่ากระดกข้อมือ',
        'tiger-roar': 'ท่าที่ 4: ท่ากางเข่า',
        'flying': 'ท่าที่ 5: ท่ายกขา'
    };
    return exerciseNames[exerciseCode] || exerciseCode;
}

function updateExerciseInstructions() {
    const exerciseInstructions = {
        'butterfly-dance': 'จับข้อศอกของผู้ป่วยให้ตรง ยกแขนขึ้นเหนือศีรษะ ชูจนสุด แล้ววางลงข้างลำตัว',
        'peacock': 'วางแขนตรงกับหัวไหล่ จากนั้นยกขึ้นให้มือแตะไหล่แล้ววางลงในท่าเดิม',
        'dragon-claw': 'จับข้อมือของผู้ป่วย กระดกขึ้น-ลง 10 ครั้ง กระดกซ้าย-ขวา 10 ครั้ง',
        'tiger-roar': 'ชันเข่าข้างหนึ่งขึ้นวางไขว้กับขาอีกข้าง ค่อยๆ กดลง ท่านี้ช่วยคลายกล้ามเนื้อช่วงสะโพก',
        'flying': 'จับเข่าและข้อเท้า ตั้งขึ้น 90 องศา ให้อยู่ในท่าตัว L จากนั้นวางลงในท่าเดิม'
    };

    if (instructionText) {
        instructionText.textContent = exerciseInstructions[currentExercise] || 'ไม่มีคำแนะนำสำหรับท่านี้';
    }
}

function checkDependencies() {
    if (!videoElement || !canvasElement) {
        console.error('ไม่พบองค์ประกอบ video หรือ canvas');
        return false;
    }
    
    if (typeof window.Pose === 'undefined' || typeof window.Camera === 'undefined') {
        console.error('MediaPipe libraries ไม่พร้อมใช้งาน');
        return false;
    }
    
    return true;
}

function updateUI() {
    updateCounters();
    updateExerciseInstructions();
    updateSideIndicator();
}

// ========================================
// ฟังก์ชันเสริมสำหรับ UI อื่นๆ
// ========================================

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.id.replace('-tab', '-content');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function populateSampleData() {
    // เพิ่มข้อมูลตัวอย่างในตารางประวัติ
    const sampleData = [
        {
            date: '25/05/2025',
            exercise: 'ท่าที่ 1: ท่ายกแขน',
            reps: 20,
            time: '08:30',
            accuracy: '92%',
            score: '8.5/10'
        },
        {
            date: '24/05/2025',
            exercise: 'ท่าที่ 2: ท่างอและเหยียดศอก',
            reps: 15,
            time: '06:45',
            accuracy: '88%',
            score: '8.0/10'
        }
    ];
    
    const recordTable = document.getElementById('record-table-body');
    if (recordTable) {
        sampleData.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.exercise}</td>
                <td>${record.reps}</td>
                <td>${record.time}</td>
                <td>${record.accuracy}</td>
                <td>${record.score}</td>
                <td>
                    <button class="btn-icon" title="ดูรายละเอียด">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            recordTable.appendChild(row);
        });
    }
}
function addGlobalErrorHandling() {
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('Global Error:', {msg, url, lineNo, columnNo, error});
        showError('เกิดข้อผิดพลาดในระบบ กรุณาโหลดหน้าใหม่');
        return false;
    };

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled Promise Rejection:', event.reason);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    });
}

// เรียกใช้ใน initializeSystem()
function initializeSystem() {
    addGlobalErrorHandling();
    setupEventListeners();
    setupTabs();
    populateSampleData();
    setupPoseDetection();
    updateUI();
}
function addDebugFunctions() {
    window.debugSystem = {
        // ตรวจสอบสถานะระบบ
        status: () => {
            console.log('=== สถานะระบบ ===');
            console.log('- isDetecting:', isDetecting);
            console.log('- currentExercise:', currentExercise);
            console.log('- movementPhase:', movementPhase);
            console.log('- repCounter:', repCounter);
            console.log('- poseDetection:', !!poseDetection);
            console.log('- camera:', !!camera);
            console.log('- poseResults:', !!poseResults);
        },
        
        // รีเซ็ตระบบทั้งหมด
        reset: () => {
            stopExercise();
            resetExerciseState();
            console.log('✅ รีเซ็ตระบบเรียบร้อย');
        },
        
        // ทดสอบการตรวจจับ
        testDetection: () => {
            if (poseResults) {
                console.log('✅ ระบบตรวจจับทำงาน - จำนวน landmarks:', 
                           poseResults.poseLandmarks?.length || 0);
            } else {
                console.log('❌ ไม่มีข้อมูลการตรวจจับ');
            }
        }
    };
}
// แทนที่ฟังก์ชัน analyzeLegRaise เดิม
window.analyzeLegRaise = fixedAnalyzeLegRaise;

console.log('✅ แก้ไขท่ายกขาใน missing.js เรียบร้อย');

// ทำให้ฟังก์ชันสำคัญสามารถเรียกใช้จาก HTML ได้
window.viewSessionDetails = viewSessionDetails;
window.exerciseSystem = {
    startExercise,
    stopExercise,
    resetExerciseState,
    toggleExercise,
    getExerciseName,
    formatTime
};