import * as THREE from 'three';

/**
 * 專為 VRM 模型設計的程序化動畫系統
 * @param {Object} vrm - VRM 模型實例
 * @param {number} time - 當前遊戲時間 (elapsedTime)
 * @param {number} moveSpeed - 移動速度 (用於調整擺動幅度)
 * @param {boolean} isPlayer - 是否為玩家 (調高動作頻率)
 */
export function updateProceduralAnimation(vrm, time, moveSpeed, isPlayer) {
    if (!vrm || !vrm.humanoid) return;

    // 動畫參數根據速度動態調整
    // intensity 控制動作的「劇烈程度」
    const intensity = Math.min(moveSpeed * (isPlayer ? 5 : 10), 1.2); 
    const freq = isPlayer ? 10 : 8;
    const t = time * freq;

    // 獲取 VRM 規範的核心骨骼
    const legs = {
        lUp: vrm.humanoid.getNormalizedBoneNode('leftUpperLeg'),
        rUp: vrm.humanoid.getNormalizedBoneNode('rightUpperLeg'),
        lLow: vrm.humanoid.getNormalizedBoneNode('leftLowerLeg'),
        rLow: vrm.humanoid.getNormalizedBoneNode('rightLowerLeg')
    };
    const arms = {
        lUp: vrm.humanoid.getNormalizedBoneNode('leftUpperArm'),
        rUp: vrm.humanoid.getNormalizedBoneNode('rightUpperArm')
    };
    const hips = vrm.humanoid.getNormalizedBoneNode('hips');
    const spine = vrm.humanoid.getNormalizedBoneNode('spine');

    if (intensity > 0.02) {
        // --- 跑步/行走狀態 ---
        const legAngle = Math.sin(t) * 0.5 * intensity;
        const armAngle = Math.sin(t) * 0.6 * intensity;

        // 雙腿交替擺動
        if (legs.lUp) legs.lUp.rotation.x = legAngle;
        if (legs.rUp) legs.rUp.rotation.x = -legAngle;
        
        // 小腿連動 (跑步時小腿會向後微彎)
        if (legs.lLow) legs.lLow.rotation.x = Math.abs(legAngle) * 0.6;
        if (legs.rLow) legs.rLow.rotation.x = Math.abs(-legAngle) * 0.6;

        // 手臂交替擺動 (與腿部相反)
        if (arms.lUp) {
            arms.lUp.rotation.x = -armAngle;
            arms.lUp.rotation.z = 1.2; // 保持手臂自然下垂
        }
        if (arms.rUp) {
            arms.rUp.rotation.x = armAngle;
            arms.rUp.rotation.z = -1.2;
        }

        // 加入身體重心上下跳動 (Bobbing)
        if (hips) {
            hips.position.y = Math.abs(Math.sin(t * 2)) * 0.08 * intensity;
        }
        // 加入脊椎輕微扭動使跑姿更自然
        if (spine) {
            spine.rotation.y = Math.sin(t) * 0.1 * intensity;
            spine.rotation.z = Math.sin(t * 0.5) * 0.05 * intensity;
        }
    } else {
        // --- 待命 (Idle) 狀態 ---
        const breath = Math.sin(time * 2) * 0.03;
        
        // 手臂自然垂放並伴隨呼吸起伏
        if (arms.lUp) {
            arms.lUp.rotation.x = THREE.MathUtils.lerp(arms.lUp.rotation.x, 0.2, 0.1);
            arms.lUp.rotation.z = 1.4 + breath; 
        }
        if (arms.rUp) {
            arms.rUp.rotation.x = THREE.MathUtils.lerp(arms.rUp.rotation.x, 0.2, 0.1);
            arms.rUp.rotation.z = -1.4 - breath;
        }
        
        // 重置腿部位置
        if (legs.lUp) legs.lUp.rotation.x = THREE.MathUtils.lerp(legs.lUp.rotation.x, 0, 0.1);
        if (legs.rUp) legs.rUp.rotation.x = THREE.MathUtils.lerp(legs.rUp.rotation.x, 0, 0.1);
        
        // 平滑重置身體高度與脊椎
        if (hips) hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0, 0.1);
        if (spine) {
            spine.rotation.y = THREE.MathUtils.lerp(spine.rotation.y, 0, 0.1);
            spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, 0, 0.1);
        }
    }
}
