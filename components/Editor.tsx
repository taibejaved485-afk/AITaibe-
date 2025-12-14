import React, { useState, useEffect } from 'react';
import { ImageItem } from '../types';
import { editImageWithGemini } from '../services/gemini';
import { ArrowLeft, Wand2, RefreshCcw, Save, Layers, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { Spinner } from './Spinner';

interface EditorProps {
  image: ImageItem;
  onBack: () => void;
  onUpdateImage: (id: string, newUrl: string, prompt: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ image, onBack, onUpdateImage }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preserveFaces, setPreserveFaces] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [viewingVersionIndex, setViewingVersionIndex] = useState<number | null>(null);

  // Reset viewing version when image changes
  useEffect(() => {
    setViewingVersionIndex(null);
    setPrompt('');
    setError(null);
    setShowOriginal(false);
  }, [image.id]);

  const activeUrl = viewingVersionIndex !== null 
    ? image.versions[viewingVersionIndex].url 
    : image.currentUrl;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Always edit based on the ORIGINAL to avoid degradation, 
      // OR edit the current one to chain edits. 
      // For "Face preservation" it is often safer to edit the result if chaining is desired, 
      // but usually users want to edit the source. Let's edit the *current active view*.
      const sourceImage = activeUrl;
      
      const newImageUrl = await editImageWithGemini({
        imageBase64: sourceImage,
        prompt: prompt,
        preserveFaces: preserveFaces
      });

      onUpdateImage(image.id, newImageUrl, prompt);
      setViewingVersionIndex(null); // Switch to the newest (which becomes current)
      setPrompt('');
    } catch (err) {
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevertToOriginal = () => {
    onUpdateImage(image.id, image.originalUrl, "Revert to Original");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
          <span>Back to Gallery</span>
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg text-slate-200 hidden sm:block">
             Editing: {image.name}
          </h2>
        </div>

        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-900 p-8">
          <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-slate-800">
            {isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm bg-slate-950/70">
                <Spinner className="w-12 h-12 text-blue-500 mb-4" />
                <p className="animate-pulse font-medium">Gemini is transforming your image...</p>
              </div>
            )}
            
            <img 
              src={showOriginal ? image.originalUrl : activeUrl} 
              alt="Editing canvas" 
              className="max-w-full max-h-[80vh] object-contain block"
            />
            
            {/* Compare Button (Floating) - Only show if we have edits */}
            {activeUrl !== image.originalUrl && (
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="absolute top-4 right-4 bg-slate-950/80 hover:bg-black text-white p-2 rounded-full backdrop-blur-md border border-slate-700 shadow-lg transition-all active:scale-95 z-10"
                title="Hold to see original"
              >
                {showOriginal ? <Eye size={24} className="text-blue-400" /> : <EyeOff size={24} />}
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar - Controls */}
        <div className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Prompt Section */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                What would you like to change?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Make it look like a sketch, Add a neon glow, Change background to a beach..."
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
            </div>

            {/* Options */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPreserveFaces(!preserveFaces)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${preserveFaces ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                {preserveFaces && <Check size={14} className="text-white" />}
              </div>
              <span className="text-sm text-slate-300 select-none">Preserve faces (No distortion)</span>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isProcessing || !prompt.trim()}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                isProcessing || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20'
              }`}
            >
              <Wand2 size={18} />
              {isProcessing ? 'Generating...' : 'Generate Edit'}
            </button>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <hr className="border-slate-800" />

            {/* History / Versions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Layers size={16} />
                  History
                </h3>
                {image.currentUrl !== image.originalUrl && (
                   <button 
                     onClick={handleRevertToOriginal}
                     className="text-xs text-slate-500 hover:text-white flex items-center gap-1"
                   >
                     <RefreshCcw size={12} /> Reset
                   </button>
                )}
              </div>
              
              <div className="space-y-2">
                {/* Original */}
                <div 
                  onClick={() => setViewingVersionIndex(null)} // Show current
                  className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                     image.currentUrl === image.originalUrl ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-900'
                  }`}
                >
                  <img src={image.originalUrl} className="w-10 h-10 object-cover rounded bg-slate-800" alt="Original" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300">Original Image</p>
                    <p className="text-[10px] text-slate-500">Source</p>
                  </div>
                </div>

                {/* Versions Stack */}
                {image.versions.slice().reverse().map((version, idx) => {
                   // Calculate original index because we reversed the array for display
                   const originalIndex = image.versions.length - 1 - idx;
                   const isActive = activeUrl === version.url;
                   
                   return (
                    <div 
                      key={version.id}
                      onClick={() => setViewingVersionIndex(originalIndex)}
                      className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                        isActive ? 'bg-slate-800 border border-blue-500/30' : 'hover:bg-slate-900'
                      }`}
                    >
                      <img src={version.url} className="w-10 h-10 object-cover rounded bg-slate-800" alt="Version" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate" title={version.prompt}>
                          {version.prompt}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                   );
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-6 border-t border-slate-800">
             <button className="w-full py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-sm flex items-center justify-center gap-2">
               <Save size={16} />
               Download Active Image
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};