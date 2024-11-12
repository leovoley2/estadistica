// src/utils/canvas-utils.js
export const setupHighDPI = (canvas, context) => {
    const pixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    
    context.scale(pixelRatio, pixelRatio);
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };
  
  export const smoothLine = (context, x1, y1, x2, y2) => {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const minDistance = 3;
  
    if (distance < minDistance) {
      context.lineTo(x2, y2);
    } else {
      const midPoint = {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2
      };
      context.quadraticCurveTo(x1, y1, midPoint.x, midPoint.y);
    }
  };