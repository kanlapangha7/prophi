// ========================================
// ระบบตรวจจับท่าทางอัตโนมัติ
// ========================================

function detectBestSideAutomatically(landmarks) {
    if (!landmarks || landmarks.length < 33) return autoDetectedSide;

    const rightSide = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 };
    const leftSide = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 };

    const rightScore = calculateSideScore(landmarks, rightSide, 'right');
    const leftScore = calculateSideScore(landmarks, leftSide, 'left');

    updateMovementData('right', rightScore);
    updateMovementData('left', leftScore);

    const bestSide = rightScore.total > leftScore.total ? 'right' : 'left';
    
    if (Math.abs(rightScore.total - leftScore.total) > 15) {
        autoDetectedSide = bestSide;
    }

    return autoDetectedSide;
}


function calculateSideScore(landmarks, sideIndices, sideName) {
    let visibilityScore = 0;
    let movementScore = 0;
    let positionScore = 0;
    let currentAngle = 0;
    
    // ตรวจสอบการมองเห็น
    Object.values(sideIndices).forEach(index => {
        if (landmarks[index] && landmarks[index].visibility > 0.5) {
            visibilityScore += landmarks[index].visibility * 20;
        }
    });

    // คำนวณมุมและการเคลื่อนไหว
    if (landmarks[sideIndices.shoulder] && landmarks[sideIndices.elbow] && landmarks[sideIndices.hip]) {
        currentAngle = calculateAngle(
            {x: landmarks[sideIndices.hip].x, y: landmarks[sideIndices.hip].y},
            {x: landmarks[sideIndices.shoulder].x, y: landmarks[sideIndices.shoulder].y},
            {x: landmarks[sideIndices.elbow].x, y: landmarks[sideIndices.elbow].y}
        );

        const lastData = lastMovementData[sideName];
        if (lastData.angle > 0) {
            const angleDiff = Math.abs(currentAngle - lastData.angle);
            movementScore = Math.min(30, angleDiff * 2);
        }

        if (currentAngle > 30 && currentAngle < 160) {
            positionScore = 25;
        }
    }

    return {
        visibility: visibilityScore,
        movement: movementScore,
        position: positionScore,
        total: visibilityScore + movementScore + positionScore,
        currentAngle: currentAngle
    };
}