// ========================================
// ฟังก์ชันวิเคราะห์ท่าทางแต่ละท่า
// ========================================

function analyzeArmRaise() {
    const landmarks = poseResults.poseLandmarks;
    const side = autoDetectedSide;
    
    const shoulderIndex = side === 'right' ? 12 : 11;
    const elbowIndex = side === 'right' ? 14 : 13;
    const wristIndex = side === 'right' ? 16 : 15;
    const hipIndex = side === 'right' ? 24 : 23;

    if (!validateLandmarks(landmarks, [shoulderIndex, elbowIndex, wristIndex, hipIndex])) {
        showFeedback('ไม่สามารถตรวจจับท่าทางได้ครบถ้วน กรุณาปรับตำแหน่ง');
        return;
    }

    // คำนวณมุมการยกแขน
    const rawAngle = calculateAngle(
        {x: landmarks[hipIndex].x, y: landmarks[hipIndex].y},
        {x: landmarks[shoulderIndex].x, y: landmarks[shoulderIndex].y},
        {x: landmarks[elbowIndex].x, y: landmarks[elbowIndex].y}
    );

    const adjustedAngle = 180 - rawAngle;
    const filteredAngle = getFilteredAngle(adjustedAngle);
    
    updateAngleTracking(filteredAngle);

    // วิเคราะห์การเคลื่อนไหว
    const minAngle = 30;
    const maxAngle = 150;
    const angleDiff = Math.abs(filteredAngle - prevAngle);

    // ตรวจจับการเริ่มยกแขน
    if (filteredAngle > prevAngle + 10 && filteredAngle > minAngle && 
        movementPhase === 'rest' && angleDiff > 5) {
        startMovementPhase('lifting', 'กำลังยกแขนขึ้น...');
    } 
    // ตรวจจับการลดแขน
    else if (filteredAngle < prevAngle - 10 && filteredAngle > minAngle && 
             movementPhase === 'lifting' && prevAngle >= maxAngle * 0.8) {
        startMovementPhase('lowering', 'กำลังลดแขนลง...');
    } 
    // ตรวจจับการทำซ้ำเสร็จสิ้น
    else if (filteredAngle < minAngle + 5 && movementPhase === 'lowering' && 
             prevAngle > minAngle + 15) {
        completeRepetition('ยกแขน', side);
    }

    updateAccuracy(filteredAngle, maxAngle);
    displayMovementInfo(Math.round(filteredAngle), 'องศา');
}



function analyzeElbowFlexion() {
    const landmarks = poseResults.poseLandmarks;
    const side = autoDetectedSide;
    
    const shoulderIndex = side === 'right' ? 12 : 11;
    const elbowIndex = side === 'right' ? 14 : 13;
    const wristIndex = side === 'right' ? 16 : 15;

    if (!validateLandmarks(landmarks, [shoulderIndex, elbowIndex, wristIndex])) {
        showFeedback('ไม่สามารถตรวจจับแขนได้ชัดเจน กรุณาปรับตำแหน่ง');
        return;
    }

    // คำนวณระยะห่างระหว่างข้อมือกับไหล่
    const distance = calculateDistance(landmarks[wristIndex], landmarks[shoulderIndex]);
    const normalizedDistance = Math.max(0, Math.min(1, distance * 5)); // ปรับขนาด
    
    const minDistance = 0.2; // ใกล้ไหล่
    const maxDistance = 0.8; // ห่างจากไหล่

    // ตรวจจับการงอแขน
    if (normalizedDistance < maxDistance - 0.1 && movementPhase === 'rest') {
        startMovementPhase('flexing', 'กำลังงอแขนเข้าหาไหล่...');
    } 
    // ตรวจจับการเหยียดแขน
    else if (normalizedDistance < minDistance + 0.1 && movementPhase === 'flexing') {
        startMovementPhase('extending', 'กำลังเหยียดแขนออก...');
    } 
    // ตรวจจับการทำซ้ำเสร็จสิ้น
    else if (normalizedDistance > maxDistance - 0.1 && movementPhase === 'extending') {
        completeRepetition('งอเหยียดศอก', side);
    }

    const accuracyPercent = Math.max(0, 100 - (normalizedDistance * 50));
    updateAccuracy(accuracyPercent, 100);
    displayMovementInfo(Math.round((1 - normalizedDistance) * 100), '%');
}
function analyzeWristMovement() {
    const landmarks = poseResults.poseLandmarks;
    const side = autoDetectedSide;
    
    const elbowIndex = side === 'right' ? 14 : 13;
    const wristIndex = side === 'right' ? 16 : 15;

    if (!validateLandmarks(landmarks, [elbowIndex, wristIndex])) {
        showFeedback('ไม่สามารถตรวจจับข้อมือได้ชัดเจน กรุณาปรับตำแหน่ง');
        return;
    }

    // ติดตามการเคลื่อนไหวของข้อมือ
    const currentWristPos = {
        x: landmarks[wristIndex].x,
        y: landmarks[wristIndex].y
    };

    if (!window.lastWristPos) {
        window.lastWristPos = currentWristPos;
        window.wristMovementCount = 0;
        window.lastSignificantMovement = Date.now();
    }

    // คำนวณการเคลื่อนที่
    const movement = calculateDistance(currentWristPos, window.lastWristPos);
    const timeSinceLastMove = Date.now() - window.lastSignificantMovement;
    
    // ตรวจจับการเคลื่อนไหวที่มีนัยสำคัญ
    if (movement > 0.02 && timeSinceLastMove > 300) {
        if (movementPhase === 'rest') {
            startMovementPhase('moving', 'กำลังเคลื่อนไหวข้อมือ...');
        }
        
        window.wristMovementCount++;
        window.lastSignificantMovement = Date.now();
        
        if (window.wristMovementCount >= 10) {
            completeRepetition('กระดกข้อมือ', side);
            window.wristMovementCount = 0;
            movementPhase = 'rest';
        } else {
            showFeedback(`กระดกข้อมือครั้งที่ ${window.wristMovementCount}/10`);
        }
        
        window.lastWristPos = currentWristPos;
    }
    
    // รีเซ็ตเมื่อไม่มีการเคลื่อนไหวนาน
    if (timeSinceLastMove > 3000 && movementPhase === 'moving') {
        movementPhase = 'rest';
        showFeedback('กรุณาเริ่มกระดกข้อมือใหม่');
    }

    const progress = (window.wristMovementCount / 10) * 100;
    updateAccuracy(Math.min(95, 75 + progress * 0.2), 100);
    displayMovementInfo(window.wristMovementCount, 'ครั้ง');
}
function analyzeKneeSpread() {
    const landmarks = poseResults.poseLandmarks;
    
    const hipLeft = 23, hipRight = 24;
    const kneeLeft = 25, kneeRight = 26;

    if (!validateLandmarks(landmarks, [hipLeft, hipRight, kneeLeft, kneeRight])) {
        showFeedback('ไม่สามารถตรวจจับขาได้ครบถ้วน กรุณาปรับตำแหน่ง');
        return;
    }

    // คำนวณระยะห่างระหว่างเข่า
    const kneeDistance = calculateDistance(landmarks[kneeLeft], landmarks[kneeRight]);
    const normalizedDistance = kneeDistance * 3; // ปรับขนาดให้เห็นชัดขึ้น
    
    const minDistance = 0.3; // เข่าใกล้กัน
    const maxDistance = 0.9; // เข่าห่างกัน

    // ตรวจจับการกางเข่า
    if (normalizedDistance > maxDistance * 0.7 && movementPhase === 'rest') {
        startMovementPhase('spreading', 'กำลังกางเข่า...');
        startHoldTimer(3000); // ค้างท่า 3 วินาที
    } 
    // ตรวจจับการหุบเข่า
    else if (normalizedDistance < minDistance + 0.1 && 
             (movementPhase === 'spreading' || movementPhase === 'holding')) {
        if (window.holdComplete) {
            completeRepetition('กางเข่า', 'ทั้งสองข้าง');
            window.holdComplete = false;
        } else if (movementPhase === 'spreading') {
            showFeedback('ควรค้างท่ากางเข่าให้ครบ 3 วินาที');
            movementPhase = 'rest';
        }
    }

    const spreadPercentage = Math.min(100, (normalizedDistance / maxDistance) * 100);
    updateAccuracy(Math.min(95, 70 + spreadPercentage * 0.25), 100);
    displayMovementInfo(Math.round(normalizedDistance * 100), 'cm');
}
function analyzeLegRaise() {
    const landmarks = poseResults.poseLandmarks;
    
    // ตัวชี้วัดที่จำเป็น
    const hipLeft = 23, hipRight = 24;
    const kneeLeft = 25, kneeRight = 26;

    if (!validateLandmarks(landmarks, [hipLeft, hipRight, kneeLeft, kneeRight])) {
        showFeedback('กรุณาปรับตำแหน่งให้เห็นขาชัดเจน');
        return;
    }

    // คำนวณการยกขาด้วยวิธีใหม่ (ใช้ตำแหน่ง Y)
    const leftKneeHeight = landmarks[hipLeft].y - landmarks[kneeLeft].y;
    const rightKneeHeight = landmarks[hipRight].y - landmarks[kneeRight].y;
    
    // แปลงเป็นคะแนนการยก (0-100)
    const leftLiftScore = Math.max(0, Math.min(100, leftKneeHeight * 500));
    const rightLiftScore = Math.max(0, Math.min(100, rightKneeHeight * 500));
    
    // เลือกขาที่ยกสูงกว่า
    const maxLiftScore = Math.max(leftLiftScore, rightLiftScore);
    const activeSide = leftLiftScore > rightLiftScore ? 'ซ้าย' : 'ขวา';
    
    // อัปเดตมุม (ใช้ lift score แทน)
    updateAngleTracking(maxLiftScore);

    // เกณฑ์ที่ง่าย
    const MIN_LIFT = 15;     // คะแนนขั้นต่ำ
    const TARGET_LIFT = 40;  // คะแนนเป้าหมาย
    const THRESHOLD = 8;     // ความแตกต่างที่มีนัยสำคัญ

    console.log(`🦵 ขา${activeSide}: ${Math.round(maxLiftScore)} คะแนน | เฟส: ${movementPhase} | ก่อนหน้า: ${Math.round(prevAngle)}`);

    // ลอจิกการนับแบบง่าย
    switch (movementPhase) {
        case 'rest':
            if (maxLiftScore > MIN_LIFT && maxLiftScore > prevAngle + THRESHOLD) {
                startMovementPhase('lifting', `เริ่มยกขา${activeSide}...`);
                console.log(`✅ เริ่มยกขา${activeSide} - คะแนน: ${Math.round(maxLiftScore)}`);
            }
            break;

        case 'lifting':
            if (maxLiftScore >= TARGET_LIFT) {
                // นับทันทีเมื่อถึงเป้าหมาย
                completeRepetition('ยกขา', activeSide);
                movementPhase = 'counting'; // เปลี่ยนเป็น counting
                console.log(`🎉 นับแล้ว! ครั้งที่ ${repCounter}`);
                
                // ตั้งเวลาให้กลับสู่ rest หลัง 2 วินาที
                setTimeout(() => {
                    if (movementPhase === 'counting') {
                        movementPhase = 'rest';
                        showFeedback('พร้อมสำหรับการยกขาครั้งต่อไป');
                    }
                }, 2000);
            }
            break;

        case 'counting':
            // รอให้เวลาผ่านไปแล้วกลับสู่ rest
            showFeedback(`ยกขา${activeSide}สำเร็จ! (${repCounter}/${targetReps}) กำลังเตรียมพร้อมสำหรับครั้งต่อไป...`);
            break;
    }

    // อัปเดต UI
    updateAccuracy(Math.min(95, (maxLiftScore / TARGET_LIFT) * 100), 100);
    displayMovementInfo(`${Math.round(maxLiftScore)} (${activeSide})`, 'คะแนน');
}

console.log('✅ โหลดฟังก์ชันการวิเคราะห์ท่าทางเรียบร้อย (รวมท่ายกขาที่แก้ไขแล้ว)');
function analyzeLegRaise() {
    const landmarks = poseResults.poseLandmarks;
    
    // ตัวชี้วัดที่จำเป็น
    const hipLeft = 23, hipRight = 24;
    const kneeLeft = 25, kneeRight = 26;

    if (!validateLandmarks(landmarks, [hipLeft, hipRight, kneeLeft, kneeRight])) {
        showFeedback('กรุณาปรับตำแหน่งให้เห็นขาชัดเจน');
        return;
    }

    // คำนวณมุมขาแบบง่าย (ใช้ความสูง)
    const leftLegHeight = Math.abs(landmarks[hipLeft].y - landmarks[kneeLeft].y);
    const rightLegHeight = Math.abs(landmarks[hipRight].y - landmarks[kneeRight].y);
    
    // แปลงเป็นมุม 0-90 องศา
    const leftLegAngle = Math.min(90, leftLegHeight * 200);
    const rightLegAngle = Math.min(90, rightLegHeight * 200);
    
    // เลือกขาที่ยกสูงกว่า
    const maxAngle = Math.max(leftLegAngle, rightLegAngle);
    const activeSide = leftLegAngle > rightLegAngle ? 'ซ้าย' : 'ขวา';
    
    updateAngleTracking(maxAngle);

    // เกณฑ์ที่ง่ายขึ้น
    const MIN_ANGLE = 10;     // ลดลง
    const TARGET_ANGLE = 25;  // ลดลง
    const THRESHOLD = 5;      // ลดลง

    console.log(`🦵 ขา${activeSide}: ${Math.round(maxAngle)}°, เฟส: ${movementPhase}`);

    // ลอจิกการนับแบบง่าย
    switch (movementPhase) {
        case 'rest':
            if (maxAngle > MIN_ANGLE && maxAngle > prevAngle + THRESHOLD) {
                startMovementPhase('lifting', `ยกขา${activeSide}...`);
            }
            break;

        case 'lifting':
            if (maxAngle >= TARGET_ANGLE) {
                // ค้างท่าสั้นๆ แล้วนับเลย
                setTimeout(() => {
                    completeRepetition('ยกขา', activeSide);
                    console.log(`🎉 นับแล้ว! ครั้งที่ ${repCounter}`);
                }, 800);
                movementPhase = 'counting';
            }
            break;

        case 'counting':
            // รอให้กลับสู่ท่าพัก
            if (maxAngle < MIN_ANGLE + 2) {
                movementPhase = 'rest';
            }
            break;
    }

    updateAccuracy(Math.min(95, (maxAngle / TARGET_ANGLE) * 100), 100);
    displayMovementInfo(`${Math.round(maxAngle)}° (${activeSide})`, 'องศา');
}

// ฟังก์ชันช่วยคำนวณมุมขาแบบง่าย
function calculateLegAngle(hip, knee) {
    if (!hip || !knee) return 0;
    
    // คำนวณจากความสูงของเข่าเทียบกับสะโพก
    const heightDiff = hip.y - knee.y;
    // แปลงเป็นมุมโดยประมาณ (0-90 องศา)
    return Math.max(0, Math.min(90, heightDiff * 180));
}

// ตรวจสอบและแก้ไขฟังก์ชัน analyzeCurrentExercise
function fixAnalyzeCurrentExercise() {
    console.log('🔧 แก้ไข analyzeCurrentExercise...');
    
    // เก็บฟังก์ชันเดิมไว้
    const originalAnalyze = window.analyzeCurrentExercise;
    
    // สร้างฟังก์ชันใหม่
    window.analyzeCurrentExercise = function() {
        if (!poseResults || !poseResults.poseLandmarks) {
            console.log('⚠️ ไม่มีข้อมูล pose results');
            return;
        }

        console.log(`🔍 กำลังวิเคราะห์ท่า: ${currentExercise}`);

        try {
            switch (currentExercise) {
                case 'butterfly-dance':
                    if (typeof analyzeArmRaise === 'function') {
                        analyzeArmRaise();
                    } else {
                        console.log('❌ analyzeArmRaise ไม่พบ');
                    }
                    break;
                case 'peacock':
                    if (typeof analyzeElbowFlexion === 'function') {
                        analyzeElbowFlexion();
                    } else {
                        console.log('❌ analyzeElbowFlexion ไม่พบ');
                    }
                    break;
                case 'dragon-claw':
                    if (typeof analyzeWristMovement === 'function') {
                        analyzeWristMovement();
                    } else {
                        console.log('❌ analyzeWristMovement ไม่พบ');
                    }
                    break;
                case 'tiger-roar':
                    if (typeof analyzeKneeSpread === 'function') {
                        analyzeKneeSpread();
                    } else {
                        console.log('❌ analyzeKneeSpread ไม่พบ');
                    }
                    break;
                case 'flying':
                    console.log('🦵 เรียกใช้ analyzeLegRaise...');
                    analyzeLegRaise(); // เรียกใช้ฟังก์ชันใหม่
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

// รันการแก้ไข
console.log('🔧 กำลังแก้ไขปัญหาการนับท่ายกขา...');
fixAnalyzeCurrentExercise();


window.analyzeLegRaise = analyzeLegRaise;

console.log('✅ ระบบท่ายกขา (ทั้งสองข้าง) พร้อมใช้งาน!');

function testLegRaiseSystem() {
    console.log('🧪 ทดสอบระบบท่ายกขา (ทั้งสองข้าง)...');
    
    // เปลี่ยนเป็นท่ายกขา
    currentExercise = 'flying';
    console.log('✅ เปลี่ยนเป็นท่ายกขาแล้ว (ตรวจจับทั้งสองข้าง)');
    
    // แสดงสถานะ
    console.log('📋 สถานะปัจจุบัน:');
    console.log('- currentExercise:', currentExercise);
    console.log('- movementPhase:', movementPhase);
    console.log('- ระบบ: ตรวจจับขาทั้งสองข้างพร้อมกัน');
    console.log('- ฟังก์ชัน analyzeLegRaise:', typeof analyzeLegRaise);
    console.log('- ฟังก์ชัน analyzeCurrentExercise:', typeof analyzeCurrentExercise);
}

// รันทดสอบ
setTimeout(testLegRaiseSystem, 500);

// 4. ทดสอบการทำงาน
function testLegRaiseSystem() {
    console.log('🧪 ทดสอบระบบท่ายกขา...');
    
    // รีเซ็ตสถานะ
    resetExerciseState();
    
    // เปลี่ยนเป็นท่ายกขา
    currentExercise = 'flying';
    console.log('✅ เปลี่ยนเป็นท่ายกขา');
    
    // แสดงสถานะ
    console.log('📋 สถานะปัจจุบัน:');
    console.log('- currentExercise:', currentExercise);
    console.log('- movementPhase:', movementPhase);
    console.log('- repCounter:', repCounter);
    console.log('- ฟังก์ชัน analyzeLegRaise:', typeof analyzeLegRaise);
    console.log('- ฟังก์ชัน analyzeCurrentExercise:', typeof analyzeCurrentExercise);
    
    // อัปเดต UI
    if (typeof updateExerciseInstructions === 'function') {
        updateExerciseInstructions();
    }
    
    // อัปเดต dropdown
    const exerciseSelect = document.getElementById('exercise-select');
    if (exerciseSelect) {
        exerciseSelect.value = 'butterfly-dance';
    }
}

// รันทดสอบหลังจากโหลด
setTimeout(testLegRaiseAfterFix, 1000);
// ฟังก์ชันเสริมสำหรับการบันทึกผลการทำซ้ำพร้อมรายละเอียด
function completeRepetitionWithDetails(exerciseName, side, details = {}) {
    // เรียกใช้ฟังก์ชันปกติก่อน
    completeRepetition(exerciseName, side);
    
    // บันทึกข้อมูลละเอียดเพิ่มเติม
    if (details.score !== undefined) {
        logExerciseEvent(`คะแนนท่า${exerciseName}`, 
            `คะแนนรวม: ${details.score}/100 | มุมสูงสุด: ${details.maxAngle}° | เวลาค้างท่า: ${details.holdTime}วิ`);
        
        // แสดงผลคะแนนบนหน้าจอ
        showFeedback(`ท่า${exerciseName}สำเร็จ! คะแนน: ${details.score}/100 (มุม: ${details.maxAngle}°, เวลา: ${details.holdTime}วิ)`);
    }
}