import { motion } from 'motion/react';
import { useMemo } from 'react';

const DynamicBackground = () => {
  const colors = [
    '#4ECDC4', // 青色（主）
    '#F4D03F', // 亮黄（副）
    '#B2EBE0', // 浅青
    '#FFF3CD', // 浅黄
    '#80DEEA', // 天蓝青
  ];

  // 生成随机动画参数，使用 useMemo 避免重渲染时抖动
  const animations = useMemo(() => {
    const generate = () => ({
      x: [Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50],
      y: [Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50],
      scale: [1, 1.2, 0.9, 1],
      rotate: [0, 180, 0],
    });
    return [generate(), generate(), generate(), generate(), generate()];
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#FAFAF9] pointer-events-none">
      {/* 装饰性模糊圆球 */}
      
      {/* 1. 左上角 - 薰衣草紫 */}
      <motion.div
        className="absolute -top-20 -left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"
        style={{ backgroundColor: colors[0] }}
        animate={animations[0]}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* 2. 右上角 - 向日葵黄 */}
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-60"
        style={{ backgroundColor: colors[1] }}
        animate={animations[1]}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* 3. 左下角 - 橄榄绿 */}
      <motion.div
        className="absolute -bottom-32 -left-20 w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-[90px] opacity-60"
        style={{ backgroundColor: colors[2] }}
        animate={animations[2]}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* 4. 右下角 - 陶土红 */}
      <motion.div
        className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full mix-blend-multiply filter blur-[100px] opacity-60"
        style={{ backgroundColor: colors[3] }}
        animate={animations[3]}
        transition={{
          duration: 28,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* 5. 中心游走 - 蔚蓝 */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] opacity-40"
        style={{ backgroundColor: colors[4] }}
        animate={{
          x: [-100, 100, -100],
          y: [-50, 50, -50],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* 添加一层轻微的噪点纹理增加质感 */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-overlay" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
             backgroundRepeat: 'repeat',
           }}>
      </div>
    </div>
  );
};

export default DynamicBackground;
