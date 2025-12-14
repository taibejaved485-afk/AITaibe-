import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Trash2, Edit3, Github, Command, CheckSquare, X, Layers } from 'lucide-react';
import { ImageItem, EditedVersion } from './types';
import { Editor } from './components/Editor';
import { MultiImageEditor } from './components/MultiImageEditor';

function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMultiEditor, setShowMultiEditor] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImages((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                originalUrl: e.target!.result as string,
                currentUrl: e.target!.result as string,
                versions: [],
                isProcessing: false,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update Image Handler (from Editor)
  const handleUpdateImage = (id: string, newUrl: string, prompt: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id === id) {
          const newVersion: EditedVersion = {
            id: Math.random().toString(36).substr(2, 9),
            url: newUrl,
            prompt,
            timestamp: Date.now(),
          };
          return {
            ...img,
            currentUrl: newUrl,
            versions: [...img.versions, newVersion],
          };
        }
        return img;
      })
    );
  };

  // Add a brand new image (result of multi-edit)
  const handleAddGeneratedImage = (newUrl: string, prompt: string) => {
    const newImage: ImageItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Blend Result ${new Date().toLocaleTimeString()}`,
      originalUrl: newUrl,
      currentUrl: newUrl,
      versions: [],
      isProcessing: false,
    };
    setImages(prev => [newImage, ...prev]);
    setShowMultiEditor(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedIds.has(id)) {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    }
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setIsSelectionMode(true);
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size >= 4) {
        alert("You can select up to 4 images max.");
        return;
      }
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleStartMultiEdit = () => {
    setShowMultiEditor(true);
  };

  const activeImage = images.find((img) => img.id === editingId);

  // Render Logic: Multi Editor
  if (showMultiEditor) {
    // Determine selected images in order (or just filtered)
    // We want to preserve the order the user *sees* or *clicked*?
    // Map existing images to filter those selected. 
    // To respect selection order, we might need a list, but for now filtering by gallery order is standard UX unless specified.
    // However, user prompt says "First image as reference". Gallery order dictates this unless we track click order.
    // Let's assume Gallery Order is implicit order.
    const selectedImagesList = images.filter(img => selectedIds.has(img.id));
    
    return (
      <MultiImageEditor
        selectedImages={selectedImagesList}
        onBack={() => setShowMultiEditor(false)}
        onSaveNewImage={handleAddGeneratedImage}
      />
    );
  }

  // Render Logic: Single Editor
  if (editingId && activeImage) {
    return (
      <Editor
        image={activeImage}
        onBack={() => setEditingId(null)}
        onUpdateImage={handleUpdateImage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 p-2 rounded-lg">
              <Command className="text-slate-900" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                PicEditor AI
              </h1>
              <p className="text-xs text-slate-500">Gemini 2.5 Flash Image Powered</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {images.length > 1 && (
               <button
                 onClick={toggleSelectionMode}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
                   isSelectionMode 
                     ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                     : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                 }`}
               >
                 {isSelectionMode ? <X size={16} /> : <CheckSquare size={16} />}
                 {isSelectionMode ? 'Cancel Selection' : 'Select Images'}
               </button>
             )}
             
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
              title="View Source"
            >
              <Github size={24} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col">
        {images.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ImageIcon className="text-slate-500" size={40} />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-center text-slate-200">
              Start by uploading photos
            </h2>
            <p className="text-slate-500 mb-8 max-w-md text-center">
              Select multiple images to edit with AI. "Face preservation" mode enabled by default.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 transform hover:-translate-y-1"
            >
              <Plus size={20} />
              Upload Images
            </button>
          </div>
        ) : (
          // Gallery Grid
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-200">
                Your Gallery <span className="text-slate-500 text-sm ml-2">({images.length} images)</span>
              </h2>
              
              <div className="flex gap-3">
                 {isSelectionMode && selectedIds.size >= 2 && (
                    <button
                      onClick={handleStartMultiEdit}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-in fade-in zoom-in duration-200 flex items-center gap-2"
                    >
                      <Layers size={16} />
                      Blend {selectedIds.size} Images
                    </button>
                 )}
                 <button
                   onClick={() => fileInputRef.current?.click()}
                   className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                 >
                   <Plus size={16} />
                   Add More
                 </button>
              </div>
            </div>

            {isSelectionMode && (
               <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-lg text-blue-300 text-sm flex items-center gap-2 mb-2">
                  <CheckSquare size={16} />
                  <span>Select 2 to 4 images. The <strong>first selected image</strong> (top-left) will be the reference style.</span>
               </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((img, index) => {
                const isSelected = selectedIds.has(img.id);
                // In selection mode, clicking the card toggles selection. Otherwise it edits.
                const handleClick = (e: React.MouseEvent) => {
                   if (isSelectionMode) {
                      toggleSelection(img.id, e);
                   } else {
                      setEditingId(img.id);
                   }
                };

                return (
                  <div
                    key={img.id}
                    onClick={handleClick}
                    className={`group relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border transition-all cursor-pointer shadow-lg 
                      ${isSelectionMode 
                         ? (isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-800 opacity-70 hover:opacity-100')
                         : 'border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10'
                      }`}
                  >
                    <img
                      src={img.currentUrl}
                      alt={img.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${!isSelectionMode && 'group-hover:scale-105'}`}
                    />
                    
                    {/* Selection Indicator */}
                    {isSelectionMode && (
                       <div className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-black/40 border-white/60'}`}>
                          {isSelected && <CheckSquare size={14} className="text-white" />}
                       </div>
                    )}
                    
                    {/* Badge for Reference in Multi-Mode Preview */}
                    {isSelectionMode && isSelected && index === images.findIndex(i => selectedIds.has(i.id)) && (
                       <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wide">
                          Reference
                       </div>
                    )}

                    {/* Overlay (Only show in non-selection mode or distinct) */}
                    {!isSelectionMode && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white font-medium text-sm truncate mb-1">{img.name}</p>
                        <div className="flex gap-2">
                           <span className="text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                             {img.versions.length > 0 ? `${img.versions.length} edits` : 'Original'}
                           </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {!isSelectionMode && (
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => removeImage(img.id, e)}
                          className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                         <div className="p-2 bg-blue-600/80 text-white rounded-lg backdrop-blur-md">
                          <Edit3 size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Add Tile */}
              {!isSelectionMode && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 gap-2"
                >
                  <Plus size={32} />
                  <span className="text-sm font-medium">Add Photo</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}

export default App;
