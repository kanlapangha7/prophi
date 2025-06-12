// ========================================
// แก้ไขปัญหาท่ายกขาไม่นับ - leg-raise-fix.js
// บันทึกไฟล์นี้เป็น js/leg-raise-fix.js
// ========================================

console.log('🚀 เริ่มแก้ไขปัญหาท่ายกขา...');

// 1. แก้ไขฟังก์ชัน analyzeLegRaise ให้ทำงานได้ถูกต้อง
function fixedAnalyzeLegRaise() {
    if (!poseResults || !poseResults.poseLandmarks) {
        console.log('⚠️ ไม่มีข้อมูล pose results');
        return;
    }

    const landmarks = poseResults.poseLandmarks;
    
    // ตัวชี้วัดที่จำเป็น: สะโพก เข่า ข้อเท้า
    const hipLeft = 23, hipRight = 24;
    const kneeLeft = 25, kneeRight = 26;
    const ankleLeft = 27, ankleRight = 28;

    // ตรวจสอบ landmarks ที่จำเป็น
    if (!validateLandmarks(landmarks, [hipLeft, hipRight, kneeLeft, kneeRight])) {
        showFeedback('กรุณาปรับตำแหน่งให้เห็นขาชัดเจน');
        return;
    }

    // คำนวณมุมขาแบบใหม่ (ใช้ความสูงของเข่าเทียบกับสะโพก)
    const leftLegHeight = Math.abs(landmarks[hipLeft].y - landmarks[kneeLeft].y);
    const rightLegHeight = Math.abs(landmarks[hipRight].y - landmarks[kneeRight].y);
    
    // แปลงเป็นมุมโดยประมาณ (0-90 องศา)
    const leftLegAngle = Math.min(90, leftLegHeight * 300);
    const rightLegAngle = Math.min(90, rightLegHeight * 300);
    
    // เลือกขาที่ยกสูงกว่า
    const maxAngle = Math.max(leftLegAngle, rightLegAngle);
    const activeSide = leftLegAngle > rightLegAngle ? 'ซ้าย' : 'ขวา';
    
    // อัปเดตมุม
    updateAngleTracking(maxAngle);

    // พารามิเตอร์ที่ปรับแล้ว
    const MIN_ANGLE = 15;      // มุมขั้นต่ำ (ลดลง)
    const TARGET_ANGLE = 45;   // มุมเป้าหมาย (ลดลง)
    const ANGLE_THRESHOLD = 8; // ความแตกต่างที่มีนัยสำคัญ (ลดลง)

    console.log(`🦵 ขา${activeSide}: ${Math.round(maxAngle)}° | เฟส: ${movementPhase} | ก่อนหน้า: ${Math.round(prevAngle)}°`);

    // เครื่องสถานะแบบง่าย
    switch (movementPhase) {
        case 'rest':
            if (maxAngle > MIN_ANGLE && maxAngle > prevAngle + ANGLE_THRESHOLD) {
                startMovementPhase('lifting', `เริ่มยกขา${activeSide}... (${Math.round(maxAngle)}°)`);
                console.log(`✅ เริ่มยกขา${activeSide} - มุม: ${Math.round(maxAngle)}°`);
            }
            break;

        case 'lifting':
            if (maxAngle >= TARGET_ANGLE) {
                startMovementPhase('holding', `ดีมาก! ค้างท่าขา${activeSide} (${Math.round(maxAngle)}°)`);
                startHoldTimer(2000); // ค้างท่า 2 วินาที
                console.log(`✅ ถึงเป้าหมาย - มุม: ${Math.round(maxAngle)}°`);
            } else if (maxAngle < prevAngle - 10) {
                // ถ้าลดมุมลงมากโดยไม่ถึงเป้าหมาย
                movementPhase = 'rest';
                showFeedback('ยกขาให้สูงกว่านี้ แล้วลองใหม่');
                console.log(`⚠️ ยกไม่ถึงเป้าหมาย - มุม: ${Math.round(maxAngle)}°`);
            }
            break;

        case 'holding':
            if (maxAngle < TARGET_ANGLE - 10 && window.holdComplete) {
                startMovementPhase('lowering', `ลดขา${activeSide}ลง... (${Math.round(maxAngle)}°)`);
                console.log(`✅ เริ่มลดขา - มุม: ${Math.round(maxAngle)}°`);
            }
            break;

        case 'lowering':
            if (maxAngle < MIN_ANGLE + 5) {
                completeRepetition('ยกขา', activeSide);
                window.holdComplete = false;
                console.log(`🎉 สำเร็จ! ครั้งที่ ${repCounter}`);
            }
            break;
    }

    // อัปเดต UI
    updateAccuracy(Math.min(95, (maxAngle / TARGET_ANGLE) * 100), 100);
    displayMovementInfo(`${Math.round(maxAngle)}° (${activeSide})`, 'องศา');
}

// 2. แก้ไขฟังก์ชัน analyzeCurrentExercise
function fixAnalyzeCurrentExercise() {
    console.log('🔧 แก้ไข analyzeCurrentExercise...');
    
    // สร้างฟังก์ชันใหม่
    window.analyzeCurrentExercise = function() {
        if (!poseResults || !poseResults.poseLandmarks) {
            return;
        }

        try {
            switch (currentExercise) {
                case 'butterfly-dance':
                    if (typeof analyzeArmRaise === 'function') {
                        analyzeArmRaise();
                    }
                    break;
                case 'peacock':
                    if (typeof analyzeElbowFlexion === 'function') {
                        analyzeElbowFlexion();
                    }
                    break;
                case 'dragon-claw':
                    if (typeof analyzeWristMovement === 'function') {
                        analyzeWristMovement();
                    }
                    break;
                case 'tiger-roar':
                    if (typeof analyzeKneeSpread === 'function') {
                        analyzeKneeSpread();
                    }
                    break;
                case 'flying':
                    console.log('🦵 เรียกใช้ fixedAnalyzeLegRaise...');
                    fixedAnalyzeLegRaise(); // ใช้ฟังก์ชันใหม่
                    break;
                default:
                    showFeedback('เลือกท่าที่ต้องการฝึกจากเมนูด้านล่าง');
            }
        } catch (error) {
            console.error('❌ Error ในการวิเคราะห์ท่า:', error);
            showFeedback('เกิดข้อผิดพลาดในการวิเคราะห์ท่าทาง');
        }
    };
    
    console.log('✅ แก้ไข analyzeCurrentExercise เรียบร้อย');
}

// 3. ฟังก์ชันช่วยคำนวณมุมขาแบบใหม่
function calculateImprovedLegAngle(hip, knee, ankle) {
    if (!hip || !knee) return 0;
    
    // วิธีที่ 1: ใช้ระยะห่างแนวตั้ง
    const heightDiff = Math.abs(hip.y - knee.y);
    let angle1 = Math.min(90, heightDiff * 300);
    
    // วิธีที่ 2: ถ้ามีข้อเท้า ใช้มุมจริง
    let angle2 = 0;
    if (ankle) {
        const hipKneeDistance = calculateDistance(hip, knee);
        const kneeAnkleDistance = calculateDistance(knee, ankle);
        const hipAnkleDistance = calculateDistance(hip, ankle);
        
        // ใช้กฎโคไซน์
        if (hipKneeDistance > 0 && kneeAnkleDistance > 0) {
            const cosAngle = (hipKneeDistance * hipKneeDistance + kneeAnkleDistance * kneeAnkleDistance - hipAnkleDistance * hipAnkleDistance) / 
                           (2 * hipKneeDistance * kneeAnkleDistance);
            const clampedCos = Math.max(-1, Math.min(1, cosAngle));
            angle2 = Math.acos(clampedCos) * (180 / Math.PI);
            angle2 = Math.abs(180 - angle2); // แปลงให้เป็นมุมการยก
        }
    }
    
    // ใช้ค่าเฉลี่ยถ้ามีทั้งสองวิธี
    return ankle && angle2 > 0 ? (angle1 + angle2) / 2 : angle1;
}

// 4. เพิ่มฟังก์ชัน debug
function debugLegRaiseDetailed() {
    if (!poseResults || !poseResults.poseLandmarks) {
        console.log('❌ ไม่มีข้อมูล landmarks');
        return;
    }

    const landmarks = poseResults.poseLandmarks;
    console.log('🔍 Debug รายละเอียดท่ายกขา:');
    console.log('- currentExercise:', currentExercise);
    console.log('- movementPhase:', movementPhase);
    console.log('- repCounter:', repCounter);
    
    // ตรวจสอบ landmarks ขา
    const legLandmarks = {
        'สะโพกซ้าย (23)': landmarks[23],
        'สะโพกขวา (24)': landmarks[24],
        'เข่าซ้าย (25)': landmarks[25],
        'เข่าขวา (26)': landmarks[26],
        'ข้อเท้าซ้าย (27)': landmarks[27],
        'ข้อเท้าขวา (28)': landmarks[28]
    };
    
    Object.entries(legLandmarks).forEach(([name, landmark]) => {
        if (landmark) {
            console.log(`- ${name}: visibility=${landmark.visibility.toFixed(2)}, y=${landmark.y.toFixed(3)}`);
        } else {
            console.log(`- ${name}: ไม่พบ`);
        }
    });
    
    // คำนวณมุมทั้งสองข้าง
    if (landmarks[23] && landmarks[25]) {
        const leftAngle = calculateImprovedLegAngle(landmarks[23], landmarks[25], landmarks[27]);
        console.log(`- มุมขาซ้าย: ${leftAngle.toFixed(1)}°`);
    }
    
    if (landmarks[24] && landmarks[26]) {
        const rightAngle = calculateImprovedLegAngle(landmarks[24], landmarks[26], landmarks[28]);
        console.log(`- มุมขาขวา: ${rightAngle.toFixed(1)}°`);
    }
}

// 5. ฟังก์ชันทดสอบ
function testLegRaiseSystem() {
    console.log('🧪 ทดสอบระบบท่ายกขา...');
    
    // รีเซ็ตสถานะ
    if (typeof resetExerciseState === 'function') {
        resetExerciseState();
    }
    
    // เปลี่ยนเป็นท่ายกขา
    currentExercise = 'flying';
    console.log('✅ เปลี่ยนเป็นท่ายกขา');
    
    // แสดงสถานะ
    console.log('📋 สถานะปัจจุบัน:');
    console.log('- currentExercise:', currentExercise);
    console.log('- movementPhase:', movementPhase);
    console.log('- repCounter:', repCounter);
    console.log('- ฟังก์ชัน fixedAnalyzeLegRaise:', typeof fixedAnalyzeLegRaise);
    console.log('- ฟังก์ชัน analyzeCurrentExercise:', typeof analyzeCurrentExercise);
    
    // อัปเดต UI
    if (typeof updateExerciseInstructions === 'function') {
        updateExerciseInstructions();
    }
    
    // อัปเดต dropdown
    const exerciseSelect = document.getElementById('exercise-select');
    if (exerciseSelect) {
        exerciseSelect.value = 'flying';
        // ทริกเกอร์ event change
        const event = new Event('change');
        exerciseSelect.dispatchEvent(event);
    }
}

// 6. ฟังก์ชันหลักสำหรับรันการแก้ไข
function runLegRaiseFix() {
    console.log('🚀 เริ่มแก้ไขปัญหาท่ายกขาไม่นับ...');
    
    // 1. ตรวจสอบฟังก์ชันที่จำเป็น
    const requiredFunctions = [
        'validateLandmarks', 'updateAngleTracking', 'startMovementPhase',
        'completeRepetition', 'startHoldTimer', 'updateAccuracy',
        'displayMovementInfo', 'showFeedback', 'calculateDistance'
    ];
    
    let missingFunctions = [];
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            missingFunctions.push(funcName);
        }
    });
    
    if (missingFunctions.length > 0) {
        console.error('❌ ฟังก์ชันที่จำเป็นขาดหายไป:', missingFunctions);
        return;
    }
    
    // 2. แก้ไข analyzeCurrentExercise
    fixAnalyzeCurrentExercise();
    
    // 3. ทำให้ฟังก์ชันสามารถเรียกใช้ได้ทั่วโลก
    window.fixedAnalyzeLegRaise = fixedAnalyzeLegRaise;
    window.debugLegRaiseDetailed = debugLegRaiseDetailed;
    window.testLegRaiseSystem = testLegRaiseSystem;
    window.calculateImprovedLegAngle = calculateImprovedLegAngle;
    
    // 4. ทดสอบระบบ
    setTimeout(testLegRaiseSystem, 500);
    
    console.log('✅ แก้ไขเสร็จสิ้น! ระบบท่ายกขาพร้อมใช้งาน');
    console.log('💡 วิธีใช้:');
    console.log('1. เลือกท่าที่ 5: ท่ายกขา จากเมนู');
    console.log('2. กดเริ่มการฝึก');
    console.log('3. ยกขาขึ้นให้ถึงมุม 45 องศา');
    console.log('4. ค้างท่า 2 วินาที');
    console.log('5. ลดขาลงเพื่อเสร็จสิ้น 1 ครั้ง');
    console.log('🔧 Debug: เรียกใช้ debugLegRaiseDetailed() เพื่อดูรายละเอียด');
}

// 7. รันการแก้ไขอัตโนมัติ
setTimeout(() => {
    runLegRaiseFix();
}, 1000);

// 8. เพิ่มฟังก์ชันตรวจสอบสำหรับ debugging
window.checkLegRaiseStatus = function() {
    console.log('=== สถานะระบบท่ายกขา ===');
    console.log('✅ ตัวแปรหลัก:');
    console.log('- currentExercise:', currentExercise);
    console.log('- movementPhase:', movementPhase);
    console.log('- repCounter:', repCounter);
    console.log('- isDetecting:', isDetecting);
    
    console.log('✅ ฟังก์ชันที่จำเป็น:');
    console.log('- fixedAnalyzeLegRaise:', typeof fixedAnalyzeLegRaise);
    console.log('- analyzeCurrentExercise:', typeof analyzeCurrentExercise);
    console.log('- validateLandmarks:', typeof validateLandmarks);
    console.log('- completeRepetition:', typeof completeRepetition);
    
    if (poseResults && poseResults.poseLandmarks) {
        console.log('✅ มี landmarks:', poseResults.poseLandmarks.length, 'จุด');
        debugLegRaiseDetailed();
    } else {
        console.log('❌ ไม่มี landmarks');
    }
};