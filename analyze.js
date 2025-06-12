// ========================================
// ระบบตรวจจับและวิเคราะห์ท่าทาง
// ========================================

function setupPoseDetection() {
    if (!checkDependencies()) return;

    try {
        poseDetection = new window.Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1635988162/${file}`;
            }
        });

        // ปรับการตั้งค่าเพื่อประสิทธิภาพที่ดีขึ้น
        poseDetection.setOptions({
            modelComplexity: 1,          // ลดความซับซ้อน
            smoothLandmarks: true,       // เพิ่มความนุ่มนวล
            enableSegmentation: false,   // ปิด segmentation
            minDetectionConfidence: 0.7, // เพิ่มความแม่นยำ
            minTrackingConfidence: 0.6,  // เพิ่มความเสถียร
            selfieMode: false            // โหมดปกติ
        });

        poseDetection.onResults(onPoseResults);

        // ลด frame rate เพื่อประหยัดทรัพยากร
        let lastProcessTime = 0;
        const PROCESS_INTERVAL = 100; // ประมวลผลทุก 100ms

        camera = new window.Camera(videoElement, {
            onFrame: async () => {
                const now = Date.now();
                if (isDetecting && poseDetection && (now - lastProcessTime) > PROCESS_INTERVAL) {
                    lastProcessTime = now;
                    await poseDetection.send({ image: videoElement });
                }
            },
            width: 640,
            height: 480
        });

        // เริ่มกล้องพร้อม error handling
        camera.start()
            .then(() => {
                console.log('✅ กล้องเริ่มทำงานสำเร็จ');
                updateStartButton(true);
                setTimeout(setupCameraCanvas, 500); // รอให้ video พร้อม
            })
            .catch(error => {
                console.error('❌ ไม่สามารถเริ่มกล้องได้:', error);
                showError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์');
            });

    } catch (error) {
        console.error('❌ Error ในการตั้งค่า MediaPipe:', error);
        showError('เกิดข้อผิดพลาดในการตั้งค่าระบบตรวจจับท่าทาง');
    }}

function onPoseResults(results) {
    if (!isDetecting) return;

    poseResults = results;
    
    // ตรวจจับข้างที่เหมาะสมอัตโนมัติ
    if (results.poseLandmarks) {
        autoDetectedSide = detectBestSideAutomatically(results.poseLandmarks);
        updateSideIndicator();
    }

    drawPoseResults();
    analyzeCurrentExercise();
}

function analyzeCurrentExercise() {
    if (!poseResults || !poseResults.poseLandmarks) return;

    switch (currentExercise) {
        case 'butterfly-dance':
            analyzeArmRaise();
            break;
        case 'peacock':
            analyzeElbowFlexion();
            break;
        case 'dragon-claw':
            analyzeWristMovement();
            break;
        case 'tiger-roar':
            analyzeKneeSpread();
            break;
        case 'flying':
            analyzeLegRaise();
            break;
        default:
            showFeedback('เลือกท่าที่ต้องการฝึกจากเมนูด้านล่าง');
    }
}
// ตรวจสอบฟังก์ชัน analyzeCurrentExercise
console.log('Current exercise:', currentExercise);
console.log('typeof analyzeCurrentExercise:', typeof analyzeCurrentExercise);

// ตรวจสอบการทำงานของ switch case
function testAnalyzeCurrentExercise() {
    console.log('=== ทดสอบ analyzeCurrentExercise ===');
    
    // เปลี่ยนเป็นท่ายกขา
    currentExercise = 'flying';
    console.log('เปลี่ยน currentExercise เป็น:', currentExercise);
    
    // เรียกใช้ analyzeCurrentExercise
    if (typeof analyzeCurrentExercise === 'function') {
        console.log('🔍 เรียกใช้ analyzeCurrentExercise...');
        try {
            analyzeCurrentExercise();
        } catch (error) {
            console.error('❌ Error ใน analyzeCurrentExercise:', error);
        }
    } else {
        console.log('❌ ฟังก์ชัน analyzeCurrentExercise ไม่พบ');
    }
}

// รันทดสอบ
testAnalyzeCurrentExercise();