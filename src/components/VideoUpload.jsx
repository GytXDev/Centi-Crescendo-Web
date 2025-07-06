import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Video, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadVideo, validateVideoFile, deleteVideo } from '@/lib/fileUploadService';

function VideoUpload({
    currentVideoPath,
    onVideoUploaded,
    onVideoRemoved,
    className = ""
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = async (file) => {
        setError(null);

        // Valider le fichier
        const validation = validateVideoFile(file);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Simuler le progrès d'upload
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Upload du fichier
            const result = await uploadVideo(file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result.success) {
                // Supprimer l'ancienne vidéo si elle existe
                if (currentVideoPath) {
                    await deleteVideo(currentVideoPath);
                }

                // Notifier le parent
                onVideoUploaded(result.filePath, result.publicUrl);

                setTimeout(() => {
                    setUploadProgress(0);
                    setIsUploading(false);
                }, 1000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setError(error.message);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemoveVideo = async () => {
        if (!currentVideoPath) {
            onVideoRemoved();
            return;
        }

        try {
            const result = await deleteVideo(currentVideoPath);
            if (result.success) {
                onVideoRemoved();
            } else {
                setError(`Erreur lors de la suppression : ${result.error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la vidéo:', error);
            setError('Erreur lors de la suppression de la vidéo');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Zone de drop */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragging
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-600 hover:border-gray-500'
                    } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isUploading ? (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 text-yellow-400 mx-auto animate-spin" />
                        <div>
                            <p className="text-white font-medium">Upload en cours...</p>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                <div
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">{uploadProgress}%</p>
                        </div>
                    </div>
                ) : currentVideoPath ? (
                    <div className="space-y-4">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                        <div>
                            <p className="text-white font-medium">Vidéo uploadée avec succès</p>
                            <p className="text-gray-400 text-sm">Votre vidéo est maintenant disponible</p>
                        </div>
                        <Button
                            onClick={handleRemoveVideo}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Supprimer la vidéo
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                            <p className="text-white font-medium">
                                Glissez-déposez votre vidéo ici
                            </p>
                            <p className="text-gray-400 text-sm">
                                ou cliquez pour sélectionner un fichier
                            </p>
                            <p className="text-gray-500 text-xs mt-2">
                                Formats acceptés : MP4, WebM, OGG, AVI, MOV, WMV (max 100MB)
                            </p>
                        </div>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            Sélectionner une vidéo
                        </Button>
                    </div>
                )}
            </div>

            {/* Input file caché */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInputChange}
                className="hidden"
            />

            {/* Affichage des erreurs */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                >
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
            )}
        </div>
    );
}

export default VideoUpload; 