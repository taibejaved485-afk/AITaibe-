import React, { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  beforeImage,
  afterImage
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDrag = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };
  
  // Attach window listeners for drag continue/end
  useEffect(() => {
     const move = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        let clientX;
        if ('touches' in e) clientX = e.touches[0].clientX;
        else clientX = (e as MouseEvent).clientX;
        handleDrag(clientX);
     };
     const end = () => setIsDragging(false);
     
     if (isDragging) {
         window.addEventListener('mousemove', move);
         window.addEventListener('touchmove', move);
         window.addEventListener('mouseup', end);
         window.addEventListener('touchend', end);
     }
     return () => {
         window.removeEventListener('mousemove', move);
         window.removeEventListener('touchmove', move);
         window.removeEventListener('mouseup', end);
         window.removeEventListener('touchend', end);
     };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef} 
      className="relative inline-block select-none overflow-hidden rounded-lg shadow-2xl border border-slate-800 cursor-ew-resize group"
      onMouseDown={(e) => { startDrag(e); handleDrag(e.clientX); }}
      onTouchStart={(e) => { startDrag(e); handleDrag(e.touches[0].clientX); }}
      style={{ touchAction: 'none' }} // Crucial for mobile dragging
    >
      {/* Underlying Image (After/Edited) - This sets the size of the container */}
      <img 
        src={afterImage} 
        alt="Edited" 
        className="block max-w-full max-h-[80vh] object-contain pointer-events-none"
        onLoad={(e) => setWidth(e.currentTarget.width)} // Initial width
        draggable={false}
      />
      
      {/* Overlay Image (Before/Original) - Clipped */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden pointer-events-none border-r border-white/20"
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Original" 
          className="max-w-none h-full object-contain"
          style={{ width: width ? `${width}px` : '100%' }}
          draggable={false}
        />
      </div>
      
      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white/50 group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-slate-900 rounded-full p-1.5 shadow-lg border border-slate-200 transform transition-transform group-hover:scale-110">
           <ChevronsLeftRight size={16} />
        </div>
      </div>
      
       {/* Labels */}
       <div className={`absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white/90 text-xs font-medium px-2 py-1 rounded border border-white/10 transition-opacity duration-300 pointer-events-none ${sliderPos < 15 ? 'opacity-0' : 'opacity-100'}`}>
         Original
       </div>
       <div className={`absolute top-4 right-4 bg-blue-600/80 backdrop-blur-md text-white/90 text-xs font-medium px-2 py-1 rounded border border-white/10 transition-opacity duration-300 pointer-events-none ${sliderPos > 85 ? 'opacity-0' : 'opacity-100'}`}>
         Edited
       </div>
    </div>
  );
}