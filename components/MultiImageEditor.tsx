import React, { useState } from 'react';
import { ImageItem } from '../types';
import { generateMultiImageTransform } from '../services/gemini';
import { ArrowLeft, Wand2, Save, AlertCircle, ArrowRight } from 'lucide-react';
import { Spinner } from './Spinner';

interface MultiImageEditorProps {
  selectedImages: ImageItem[];
  onBack: () => void;
  onSaveNewImage: (newUrl: string, prompt: string) => void;
}

export const MultiImageEditor: React.FC<MultiImageEditorProps> = ({ 
  selectedImages, 
  onBack, 
  onSaveNewImage 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const referenceImage = selectedImages[0];
  const targetImages = selectedImages.slice(1);

  const handleGenerate = async () => {
    if (!prompt.trim() && !window.confirm("Generate without a prompt? The model will infer the style transfer automatically.")) {
        return;
    }

    setIsProcessing(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Prepare array of base64 strings: [Ref, Target1, Target2...]
      const imagesPayload = selectedImages.map(img => img.currentUrl);
      
      const resultUrl = await generateMultiImageTransform(
        imagesPayload,
        prompt || "Apply the style of the first image to the second image."
      );

      setGeneratedImage(resultUrl);
    } catch (err) {
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (generatedImage) {
      onSaveNewImage(generatedImage, `Reference: ${referenceImage.name} + ${targetImages.length} targets`);
    }
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
        
        <h2 className="font-semibold text-lg text-slate-200">
           Multi-Image Blend
        </h2>

        <div className="w-24"></div> 
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 relative bg-slate-900 p-8 overflow-y-auto">
          <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center min-h-full">
            
            {/* Input Column */}
            <div className="flex flex-col gap-6 flex-1 max-w-md">
              
              {/* Reference Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/10">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Reference (Style)</span>
                   <span className="text-xs text-slate-500">Image 1</span>
                </div>
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                   <img src={referenceImage.currentUrl} className="w-full h-full object-cover" alt="Reference" />
                </div>
                <p className="mt-2 text-sm text-slate-300 truncate">{referenceImage.name}</p>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center text-slate-600">
                 <ArrowRight className="rotate-90 lg:rotate-0" size={24} />
              </div>

              {/* Target Cards */}
              <div className="space-y-4">
                 {targetImages.map((img, idx) => (
                    <div key={img.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target (Content)</span>
                           <span className="text-xs text-slate-500">Image {idx + 2}</span>
                        </div>
                        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 opacity-80">
                           <img src={img.currentUrl} className="w-full h-full object-cover" alt="Target" />
                        </div>
                        <p className="mt-2 text-sm text-slate-400 truncate">{img.name}</p>
                    </div>
                 ))}
              </div>
            </div>

            {/* Middle Action / Arrow (Desktop) */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="bg-slate-800 rounded-full p-2">
                <ArrowRight className="text-slate-400" size={32} />
              </div>
            </div>

            {/* Output Column */}
            <div className="flex-1 flex flex-col max-w-xl">
              <div className="flex-1 bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center relative overflow-hidden min-h-[400px]">
                 {isProcessing ? (
                    <div className="flex flex-col items-center justify-center text-blue-400">
                       <Spinner className="w-10 h-10 mb-4" />
                       <span className="animate-pulse">Synthesizing...</span>
                    </div>
                 ) : generatedImage ? (
                    <img src={generatedImage} alt="Result" className="w-full h-full object-contain" />
                 ) : (
                    <div className="text-center text-slate-500 p-8">
                       <Wand2 size={48} className="mx-auto mb-4 opacity-50" />
                       <p>Result will appear here</p>
                    </div>
                 )}
              </div>
              
              {generatedImage && (
                 <div className="mt-4 flex justify-end">
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all"
                    >
                       <Save size={18} />
                       Save to Gallery
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Controls */}
        <div className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col p-6 overflow-y-auto">
            <h3 className="font-medium text-slate-200 mb-4">Transformation Settings</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Prompt (Optional)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Transfer the watercolor style from image 1 to the content of image 2..."
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
              <p className="mt-2 text-xs text-slate-500">
                If left empty, AI will automatically attempt to transfer the style of the first image to the others.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg'
              }`}
            >
              <Wand2 size={18} />
              {isProcessing ? 'Generating...' : 'Blend Images'}
            </button>

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
