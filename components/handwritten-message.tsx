"use client"

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/translations';

export default function HandwrittenMessage() {
  const t = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [name, setName] = useState('');
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' | 'info' | '' });
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentWidth, setCurrentWidth] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const [favoriteSong, setFavoriteSong] = useState('');

  const penColors = [
    { color: '#000000', name: t('colorBlack') },
    { color: '#EF4444', name: t('colorRed') },
    { color: '#3B82F6', name: t('colorBlue') },
    { color: '#10B981', name: t('colorGreen') },
    { color: '#8B5CF6', name: t('colorPurple') },
    { color: '#F59E0B', name: t('colorOrange') },
  ];

  const penWidths = [
    { width: 2, name: t('widthThin') },
    { width: 3, name: t('widthMedium') },
    { width: 5, name: t('widthThick') },
    { width: 8, name: t('widthBold') },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setCanvasSize = (isInitial = false) => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const width = Math.min(1000, rect.width * 0.95);
        if (Math.abs(canvas.width - width) > 5 || canvas.height !== 600) {
          canvas.width = width;
          canvas.height = 600;
        }
        canvas.style.border = '2px solid #e5e7eb';
        canvas.style.borderRadius = '0.5rem';
        if (isInitial) {
          canvas.style.backgroundColor = 'white';
        }
      }
    };

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineWidth = currentWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = currentColor;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    setCtx(context);
    setCanvasSize(true);

    const handleResize = () => setCanvasSize(false);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
    }
  }, [currentColor, currentWidth, ctx]);

  const points = useRef<Array<{x: number, y: number, pressure: number}>>([]);
  const rafId = useRef<number | null>(null);
  const lastWidth = useRef(currentWidth);
  const hasDrawn = useRef(false);
  const canvasStateBeforeDrawing = useRef<ImageData | null>(null);
  const isProcessingStop = useRef(false);
  const hasSavedToHistory = useRef(false);
  const lastTouchTime = useRef(0);

  const getPressure = (e: Touch | MouseEvent | React.Touch | React.MouseEvent): number => {
    const event = e as any;
    if ('force' in event && event.force) {
      return Math.min(Math.max(event.force, 0.1), 1);
    }
    return 0.5;
  };

  const drawSmoothLine = () => {
    if (!canvasRef.current || points.current.length < 3) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const pointsToDraw = [...points.current];
    
    ctx.beginPath();
    ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);
    
    for (let i = 1; i < pointsToDraw.length - 2; i++) {
      const xc = (pointsToDraw[i].x + pointsToDraw[i + 1].x) / 2;
      const yc = (pointsToDraw[i].y + pointsToDraw[i + 1].y) / 2;
      ctx.quadraticCurveTo(pointsToDraw[i].x, pointsToDraw[i].y, xc, yc);
    }
    
    if (pointsToDraw.length > 1) {
      const i = pointsToDraw.length - 2;
      ctx.quadraticCurveTo(
        pointsToDraw[i].x, 
        pointsToDraw[i].y, 
        pointsToDraw[i + 1].x, 
        pointsToDraw[i + 1].y
      );
    }
    
    const avgPressure = pointsToDraw.reduce((sum, p) => sum + p.pressure, 0) / pointsToDraw.length;
    const targetWidth = currentWidth * (0.5 + avgPressure * 0.5);
    
    const width = lastWidth.current + (targetWidth - lastWidth.current) * 0.3;
    lastWidth.current = width;
    
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const getCanvasCoordinates = (
    e: MouseEvent | React.MouseEvent<HTMLCanvasElement> | 
       Touch | React.TouchEvent<HTMLCanvasElement> | 
       { clientX: number; clientY: number }
  ) => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number;
    let clientY: number;

    if ('touches' in e && e.touches) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if ('nativeEvent' in e) {
      const nativeEvent = e.nativeEvent as MouseEvent | TouchEvent;
      if ('touches' in nativeEvent && nativeEvent.touches.length > 0) {
        clientX = nativeEvent.touches[0].clientX;
        clientY = nativeEvent.touches[0].clientY;
      } else if ('clientX' in nativeEvent) {
        clientX = nativeEvent.clientX;
        clientY = nativeEvent.clientY;
      } else {
        return null;
      }
    } else {
      return null;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) {
      lastTouchTime.current = Date.now();
    } else {
      if (Date.now() - lastTouchTime.current < 500) {
        return;
      }
    }
    
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const coords = getCanvasCoordinates('touches' in e ? e.touches[0] : e.nativeEvent);
    if (!coords) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      canvasStateBeforeDrawing.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    const pressure = getPressure('touches' in e ? e.touches[0] : e.nativeEvent);
    points.current = [{ x: coords.x, y: coords.y, pressure }];
    hasDrawn.current = false;
    isProcessingStop.current = false;
    hasSavedToHistory.current = false;
    setIsDrawing(true);
    
    const drawLoop = () => {
      if (points.current.length >= 3) {
        drawSmoothLine();
      }
      rafId.current = requestAnimationFrame(drawLoop);
    };
    
    rafId.current = requestAnimationFrame(drawLoop);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) {
      lastTouchTime.current = Date.now();
    } else {
      if (Date.now() - lastTouchTime.current < 500) {
        return;
      }
    }
    
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    
    const coords = getCanvasCoordinates('touches' in e ? e.touches[0] : e.nativeEvent);
    if (!coords) return;
    
    const pressure = getPressure('touches' in e ? e.touches[0] : e.nativeEvent);
    
    points.current.push({ x: coords.x, y: coords.y, pressure });
    hasDrawn.current = true;
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) {
      if ('touches' in e || 'changedTouches' in e) {
        lastTouchTime.current = Date.now();
      } else {
        if (Date.now() - lastTouchTime.current < 500) {
          return;
        }
      }
    }
    
    if (!isDrawing || isProcessingStop.current) return;
    
    isProcessingStop.current = true;
    
    setIsDrawing(false);
    
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    
    if (!canvasRef.current || points.current.length === 0) {
      points.current = [];
      hasDrawn.current = false;
      canvasStateBeforeDrawing.current = null;
      isProcessingStop.current = false;
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || !canvasStateBeforeDrawing.current) {
      points.current = [];
      hasDrawn.current = false;
      canvasStateBeforeDrawing.current = null;
      isProcessingStop.current = false;
      return;
    }
    
    const isDot = points.current.length < 3;
    
    if (isDot) {
      ctx.putImageData(canvasStateBeforeDrawing.current, 0, 0);
      const point = points.current[0];
      ctx.beginPath();
      ctx.arc(point.x, point.y, currentWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = currentColor;
      ctx.fill();
    }
    
    if (!hasSavedToHistory.current) {
      hasSavedToHistory.current = true;
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL();
          setHistory(prev => [...prev, dataUrl]);
        }
      });
    }
    
    points.current = [];
    hasDrawn.current = false;
    canvasStateBeforeDrawing.current = null;
    isProcessingStop.current = false;
  };

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
  };

  const undoLastStroke = () => {
    if (!canvasRef.current || !ctx || history.length === 0) return;

    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (newHistory.length > 0) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = newHistory[newHistory.length - 1];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canvasRef.current || !name.trim()) {
      setMessage({ text: t('messageError'), type: 'error' });
      return;
    }

    if (isAttending === null) {
      setMessage({ text: t('rsvpError'), type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: t('sendingMessage'), type: 'info' });

    try {
      const rsvpResponse = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          favoriteSong: isAttending ? favoriteSong : '',
          isAttending,
        }),
      });

      const rsvpData = await rsvpResponse.json().catch(() => ({}));
      if (!rsvpResponse.ok) {
        throw new Error((rsvpData as { message?: string })?.message || t('rsvpError'));
      }

      const messageDataUrl = canvasRef.current.toDataURL('image/png');

      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), message: messageDataUrl }),
      });

      const messageData = await messageResponse.json().catch(() => ({}));

      if (!messageResponse.ok || (messageData as { success?: boolean; message?: string })?.success === false) {
        throw new Error((messageData as { message?: string })?.message || t('messageError'));
      }

      setMessage({ text: t('messageSent'), type: 'success' });
      clearCanvas();
      setName('');
      setFavoriteSong('');
      setIsAttending(null);
      setHistory([]);
    } catch (error) {
      console.error('Error sending note & RSVP:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : t('messageError'), 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      id="message" 
      className="py-16 px-4 md:py-20 bg-gradient-to-b from-background to-accent/5 select-none"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-8 select-none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1] 
              }
            }
          }}
        >
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2 select-none">{t('writeUsMessage')}</h2>
          <p className="text-gray-600 text-center mb-4 select-none">{t('writeUsDescription')}</p>
          
          <div className="bg-white/90 p-6 md:p-8 rounded-lg shadow-lg select-none">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-gray-700 text-lg md:text-xl leading-relaxed select-none">
                  {t('yourMessage')}...
                </p>
                <p className="text-sm text-muted-foreground select-none">
                  {t('drawMessageHint')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 justify-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{t('color')}:</span>
                    <div className="flex gap-1">
                      {penColors.map((pen) => (
                        <button
                          key={pen.color}
                          type="button"
                          onClick={() => setCurrentColor(pen.color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            currentColor === pen.color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: pen.color }}
                          title={pen.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{t('width')}:</span>
                    <div className="flex gap-2">
                      {penWidths.map((pen) => (
                        <button
                          key={pen.width}
                          type="button"
                          onClick={() => setCurrentWidth(pen.width)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentWidth === pen.width
                              ? 'bg-accent text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pen.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: currentColor }}
                    />
                    <span>{t('current')}: {penColors.find(p => p.color === currentColor)?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="bg-gray-800 rounded-full"
                      style={{ 
                        width: currentWidth * 2, 
                        height: currentWidth * 2 
                      }}
                    />
                    <span>{t('size')}: {penWidths.find(p => p.width === currentWidth)?.name}</span>
                  </div>
                </div>

                <div 
                  className="relative border-2 border-gray-200 rounded-lg overflow-hidden select-none"
                  style={{
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'rgba(0,0,0,0)'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    onTouchCancel={stopDrawing}
                    className="w-full h-[500px] bg-white touch-none cursor-crosshair select-none"
                    style={{
                      touchAction: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'rgba(0,0,0,0)'
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={undoLastStroke}
                    className="flex-1 sm:flex-none px-5 sm:px-7 py-3 text-base font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isSubmitting || history.length === 0}
                  >
                    {t('undo')}
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex-1 sm:flex-none px-5 sm:px-7 py-3 text-base font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    {t('clearDrawing')}
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-center">
                <p className="text-base font-semibold text-gray-800 select-none">
                  {t('rsvpSubtitle')}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAttending(true)}
                    aria-pressed={isAttending === true}
                    className={`min-w-[150px] px-6 py-3 rounded-full border-2 text-lg font-semibold transition-all ${
                      isAttending === true
                        ? 'bg-accent text-white border-accent shadow-lg shadow-accent/40'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-accent/70'
                    }`}
                  >
                    {t('attending')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAttending(false)}
                    aria-pressed={isAttending === false}
                    className={`min-w-[150px] px-6 py-3 rounded-full border-2 text-lg font-semibold transition-all ${
                      isAttending === false
                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-400/40'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500/70'
                    }`}
                  >
                    {t('notAttending')}
                  </button>
                </div>
                <p className="text-sm text-gray-500 select-none">
                  {isAttending === null
                    ? t('rsvpSubtitle')
                    : isAttending
                      ? t('rsvpDescription')
                      : t('sorryToMissYou')}
                </p>
              </div>

              {isAttending !== null && (
                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 select-none">
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('yourName')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent"
                      required
                    />
                  </div>

                  {isAttending && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 select-none">
                        {t('promiseToDance')}
                      </label>
                      <input
                        type="text"
                        value={favoriteSong}
                        onChange={(e) => setFavoriteSong(e.target.value)}
                        placeholder={t('favoriteSongPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent"
                      />
                    </div>
                  )} 
                  {!isAttending && (
                    <p className="text-sm text-gray-600 italic select-none">
                      {t('sorryToMissYou')}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-3 text-lg font-semibold text-white bg-accent rounded-xl hover:bg-accent/90 disabled:opacity-60 transition-colors shadow-lg shadow-accent/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('sendingMessage') : t('sendMessage')}
              </button>

              {message.text && (
                <div
                  className={`mt-2 p-4 rounded-md text-center ${
                    message.type === 'error'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : message.type === 'info'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}